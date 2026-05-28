import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const orderRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// FUNGSI HELPER: GENERATOR QRIS DINAMIS
// ==========================================
function crc16_ccitt(data: string) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
        x ^= x >> 4;
        crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseTlv(tlv: string) {
    const tags: any = {};
    let i = 0;
    while (i < tlv.length) {
        const tag = tlv.substring(i, i + 2);
        const lenStr = tlv.substring(i + 2, i + 4);
        const len = parseInt(lenStr, 10);
        if (isNaN(len)) break;
        const val = tlv.substring(i + 4, i + 4 + len);
        tags[tag] = val;
        i += 4 + len;
    }
    return tags;
}

function injectAmount(qrisRaw: string, amount: number) {
    if (!qrisRaw) return null;
    try {
        const tags = parseTlv(qrisRaw);
        delete tags['63']; 
        tags['53'] = '360';
        tags['54'] = amount.toFixed(2);
        tags['58'] = 'ID';
        
        const sortedKeys = Object.keys(tags).sort();
        let newTlv = '';
        for (const tag of sortedKeys) {
            const val = tags[tag];
            const len = String(val.length).padStart(2, '0');
            newTlv += tag + len + val;
        }
        const withCrcHeader = newTlv + '6304';
        return withCrcHeader + crc16_ccitt(withCrcHeader);
    } catch (e) {
        console.error("QRIS Inject Error:", e);
        return null;
    }
}

// ==========================================
// ENDPOINT CHECKOUT
// ==========================================
orderRouter.post('/checkout', async (c) => {
  const db = c.env.DB;
  const user = c.get('jwtPayload'); 
  const body = await c.req.json();
  
  if (!user || !user.id) return c.json({ success: false, message: 'Harap login.' }, 401);
  if (!body.cart || body.cart.length === 0) return c.json({ success: false, message: 'Keranjang kosong.' }, 400);

  try {
    const settings: any = await db.prepare('SELECT * FROM delivery_settings WHERE id = "default-settings"').first();
    const config: any = await db.prepare('SELECT * FROM config WHERE id = 1').first();
    
    if (!config || !config.master_raw_qris) {
      return c.json({ success: false, message: 'Sistem pembayaran belum siap.' }, 500);
    }

    // 1. Kalkulasi Subtotal & Ekstrak ID Restoran dari keranjang pertama
    let subtotal = 0;
    let fallbackRestoId = 'default_resto';

    for (const item of body.cart) {
      const dbItem: any = await db.prepare(`
        SELECT m.price, m.promo_price, m.is_promo, c.restaurant_id 
        FROM menu_items m
        LEFT JOIN menu_categories c ON m.category_id = c.id
        WHERE m.id = ?
      `).bind(item.id).first();

      if (dbItem) {
        subtotal += (dbItem.is_promo === 1 ? dbItem.promo_price : dbItem.price) * item.qty;
        if(dbItem.restaurant_id) fallbackRestoId = dbItem.restaurant_id;
      }
    }

    // Tentukan Ongkir dari Body
    let ongkir = typeof body.ongkir === 'number' ? body.ongkir : (settings?.mid_range_price || 10000);

    // 2. Kalkulasi Diskon Kupon
    let couponDiscount = 0;
    let excessCouponValue = 0;
    if (body.coupon_code) {
      const coupon: any = await db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').bind(body.coupon_code).first();
      if (coupon && subtotal >= coupon.min_purchase) {
        const rawDiscount = coupon.discount_type === 'PERCENTAGE' 
          ? Math.min(Math.floor(subtotal * (coupon.discount_value / 100)), coupon.max_discount || subtotal)
          : coupon.discount_value;
        
        const totalBefore = subtotal + ongkir;
        if (rawDiscount > totalBefore) {
            couponDiscount = totalBefore;
            excessCouponValue = rawDiscount - totalBefore;
        } else {
            couponDiscount = rawDiscount;
        }
        await db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').bind(coupon.code).run();
      }
    }

    const baseTotal = Math.max(0, subtotal + ongkir - couponDiscount);
    const pointData: any = await db.prepare('SELECT balance FROM points WHERE user_id = ?').bind(user.id).first();
    const userPoints = pointData ? pointData.balance : 0;

    // 3. Logika Poin & Final Amount
    let finalAmount = baseTotal;
    let pointsUsed = 0;
    let uniqueCode = 0;

    if (baseTotal > 0 && userPoints > 0) {
      pointsUsed = Math.min(userPoints, baseTotal);
      finalAmount = baseTotal - pointsUsed;
    } else if (baseTotal > 0) {
      const min = config.unique_min || 1;
      const max = config.unique_max || 999;
      uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min;
      finalAmount = baseTotal + uniqueCode;
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-6);

    // Gabungkan Catatan ke Alamat
    const finalAddress = body.notes ? `${body.address || '-'} (Catatan: ${body.notes})` : (body.address || '-');

    // 4. INSERT KE TABEL ORDERS (Sinkron dengan Skema Tabel)
    await db.prepare(
      `INSERT INTO orders (id, user_id, restaurant_id, total_price, status, address, order_type, payment_method, points_used, coupon_code, coupon_discount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      orderId, 
      user.id, 
      body.restaurant_id || fallbackRestoId, 
      baseTotal, 
      finalAmount === 0 ? 'PROCESSING' : 'PENDING', 
      finalAddress,
      'DELIVERY', 
      finalAmount === 0 ? 'POINTS' : 'QRIS', 
      pointsUsed,
      body.coupon_code || null,
      couponDiscount
    ).run();

    // 5. INSERT KE TABEL ORDER_DETAILS (Menyimpan item makanan yang dipesan)
    for (const item of body.cart) {
      const odId = crypto.randomUUID();
      const dbItem: any = await db.prepare('SELECT price, promo_price, is_promo FROM menu_items WHERE id = ?').bind(item.id).first();
      const itemPrice = dbItem ? (dbItem.is_promo === 1 ? dbItem.promo_price : dbItem.price) : 0;
      const finalItemPrice = itemPrice + (item.additional_price || 0);
      
      await db.prepare(
        'INSERT INTO order_details (id, order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?, ?)'
      ).bind(odId, orderId, item.id, item.qty, finalItemPrice).run();
    }

    // 6. Jika ada sisa kupon -> Tambah Poin
    if (excessCouponValue > 0) {
        await db.prepare(`INSERT INTO points (user_id, balance) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?`).bind(user.id, excessCouponValue, excessCouponValue).run();
    }

    // 7. Transaksi QRIS (Jika ada tagihan)
    if (finalAmount > 0) {
      const rawQris = injectAmount(config.master_raw_qris, finalAmount);
      const nowTimestamp = Math.floor(Date.now() / 1000);
      const expiredAt = nowTimestamp + 1800; // 30 Menit
      
      await db.prepare(
        `INSERT INTO transactions (order_id, amount, unique_code, final_amount, raw_qris, status, created_at, expired_at) 
         VALUES (?, ?, ?, ?, ?, 'UNPAID', ?, ?)`
      ).bind(orderId, baseTotal, uniqueCode, finalAmount, rawQris, nowTimestamp, expiredAt).run();
    }

    return c.json({ success: true, data: { order_id: orderId, final_amount: finalAmount } });
  } catch (e: any) {
    return c.json({ success: false, message: e.message }, 500);
  }
});


// ==========================================
// ENDPOINT WEBHOOK (CALLBACK PEMBAYARAN)
// ==========================================
orderRouter.post('/webhook', async (c) => {
  const db = c.env.DB;
  
  try {
    const body = await c.req.json();
    
    // Sesuaikan properti body.amount dengan payload dari Mutasi GoPay / Moota Anda.
    const amountPaid = body.amount || body.gross_amount || body.nominal; 
    
    if (!amountPaid) {
        return c.json({ success: false, message: 'Payload webhook tidak valid (Amount tidak ditemukan)' }, 400);
    }

    // 1. Cari transaksi UNPAID dengan final_amount persis sama dengan dana yang masuk
    const tx: any = await db.prepare(
        `SELECT order_id FROM transactions WHERE final_amount = ? AND status = 'UNPAID'`
    ).bind(amountPaid).first();

    if (!tx) {
        // Abaikan & berikan status 200 agar bot mutasi tidak melakukan retry terus menerus
        return c.json({ success: true, message: 'Transaksi tidak ditemukan atau sudah dibayar' }, 200);
    }

    const orderId = tx.order_id;

    // 2. Ambil data pesanan untuk memeriksa apakah menggunakan saldo poin
    const order: any = await db.prepare(
        `SELECT user_id, points_used FROM orders WHERE id = ?`
    ).bind(orderId).first();

    // 3. Update Status Transaksi menjadi PAID
    await db.prepare(
        `UPDATE transactions SET status = 'PAID' WHERE order_id = ?`
    ).bind(orderId).run();

    // 4. Update Status Pesanan menjadi PROCESSING (Langsung diproses Dapur)
    await db.prepare(
        `UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(orderId).run();

    // 5. Potong Poin User (Dieksekusi HANYA jika transaksi lunas agar tidak merugikan user jika batal)
    if (order && order.points_used > 0) {
        await db.prepare(
            `UPDATE points SET balance = balance - ? WHERE user_id = ?`
        ).bind(order.points_used, order.user_id).run();
    }

    return c.json({ success: true, message: 'Pembayaran berhasil diverifikasi secara otomatis' }, 200);

  } catch (e: any) {
    console.error("Webhook Error Processing:", e);
    return c.json({ success: false, message: 'Kesalahan Sistem Webhook Server' }, 500);
  }
});

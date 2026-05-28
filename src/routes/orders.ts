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
        delete tags['63']; // Hapus CRC lama
        tags['53'] = '360'; // IDR Currency
        tags['54'] = amount.toFixed(2); // Inject Nominal
        tags['58'] = 'ID'; // Country ID
        
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
// ENDPOINT CHECKOUT (MEMPROSES PESANAN & QRIS)
// ==========================================
orderRouter.post('/checkout', async (c) => {
  const db = c.env.DB;
  const user = c.get('jwtPayload'); // Data user dari token
  const body = await c.req.json();
  
  if (!user || !user.id) return c.json({ success: false, message: 'Harap login terlebih dahulu.' }, 401);
  if (!body.cart || body.cart.length === 0) return c.json({ success: false, message: 'Keranjang kosong.' }, 400);

  try {
    // 1. Ambil Pengaturan Biaya & Config QRIS
    const settings: any = await db.prepare('SELECT * FROM delivery_settings WHERE id = "default-settings"').first();
    const config: any = await db.prepare('SELECT * FROM config WHERE id = 1').first();
    
    if (!config || !config.master_raw_qris) {
      return c.json({ success: false, message: 'Sistem pembayaran sedang tidak tersedia (Master QRIS belum diset admin).' }, 500);
    }

    // 2. Kalkulasi Subtotal dari Database (Mencegah kecurangan harga dari frontend)
    let subtotal = 0;
    for (const item of body.cart) {
      const dbItem: any = await db.prepare('SELECT price, promo_price, is_promo FROM menu_items WHERE id = ?').bind(item.id).first();
      if (dbItem) {
        const itemPrice = dbItem.is_promo === 1 ? dbItem.promo_price : dbItem.price;
        subtotal += (itemPrice + (item.additional_price || 0)) * item.qty;
      }
    }

    // 3. Kalkulasi Total Dasar (Sebelum Diskon)
    const deliveryFee = settings ? settings.mid_range_price : 10000;
    const serviceFee = 3000;
    const totalBeforeDiscount = subtotal + deliveryFee + serviceFee;

    // 4. Kalkulasi Diskon Kupon & Eksekusi Sisa Kupon ke Poin
    let rawCouponDiscount = 0;
    let appliedCouponDiscount = 0;
    let excessCouponValue = 0; // Sisa kupon yang akan jadi poin

    if (body.coupon_code) {
      const coupon: any = await db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').bind(body.coupon_code).first();
      if (coupon && subtotal >= coupon.min_purchase) {
        // Tentukan nilai mentah diskon
        if (coupon.discount_type === 'PERCENTAGE') {
          rawCouponDiscount = Math.floor(subtotal * (coupon.discount_value / 100));
          if (coupon.max_discount > 0 && rawCouponDiscount > coupon.max_discount) {
             rawCouponDiscount = coupon.max_discount;
          }
        } else {
          rawCouponDiscount = coupon.discount_value; // Potongan FIX
        }

        // Jika Diskon MELEBIHI Total Tagihan -> Ubah sisanya jadi Poin
        if (rawCouponDiscount > totalBeforeDiscount) {
          appliedCouponDiscount = totalBeforeDiscount; // Tagihan jadi Rp 0
          excessCouponValue = rawCouponDiscount - totalBeforeDiscount; // Sisa uang masuk ke Poin
        } else {
          appliedCouponDiscount = rawCouponDiscount;
        }
        
        // Catat penggunaan kupon (tambah count limit)
        await db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').bind(coupon.code).run();
      }
    }

    // 5. Total Sementara Setelah Kupon
    const baseTotal = totalBeforeDiscount - appliedCouponDiscount;

    // 6. Cek Saldo Point User
    const pointData: any = await db.prepare('SELECT balance FROM points WHERE user_id = ?').bind(user.id).first();
    const userPoints = pointData ? pointData.balance : 0;

    // ==========================================
    // 7. LOGIKA INTI: KODE UNIK vs POTONG POINT
    // ==========================================
    let finalAmount = baseTotal;
    let pointsUsed = 0;
    let uniqueCodeGenerated = 0;

    // Eksekusi Pemotongan Poin hanya jika masih ada sisa tagihan (baseTotal > 0)
    if (baseTotal > 0) {
        if (userPoints > 0) {
          // SKENARIO A: USER PUNYA POINT
          pointsUsed = Math.min(userPoints, baseTotal);
          finalAmount = baseTotal - pointsUsed;
          // Tidak ada kode unik karena nominal pengurangan sudah membuat tagihan unik
        } else {
          // SKENARIO B: USER TIDAK PUNYA POINT
          const min = config.unique_min || 1;
          const max = config.unique_max || 999;
          const now = Math.floor(Date.now() / 1000);
          
          let isCollision = true;
          let attempts = 0;
          
          while (isCollision && attempts < 15) {
            uniqueCodeGenerated = Math.floor(Math.random() * (max - min + 1)) + min;
            finalAmount = baseTotal + uniqueCodeGenerated;
            
            const exists = await db.prepare("SELECT id FROM transactions WHERE final_amount = ? AND status = 'UNPAID' AND expired_at > ?").bind(finalAmount, now).first();
            if (!exists) isCollision = false;
            attempts++;
          }
          
          if (isCollision) return c.json({ success: false, message: 'Server pembayaran sedang sibuk.' }, 503);
        }
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);

    // ==========================================
    // 8A. SKENARIO AUTO-LUNAS (TAGIHAN RP 0)
    // ==========================================
    if (finalAmount === 0) {
        // Catat order langsung jadi PROCESSING karena lunas tanpa bayar uang
        await db.prepare(
          `INSERT INTO orders (id, user_id, status, total_amount, points_used, coupon_code, coupon_discount, delivery_address, notes) 
           VALUES (?, ?, 'PROCESSING', ?, ?, ?, ?, ?, ?)`
        ).bind(orderId, user.id, baseTotal, pointsUsed, body.coupon_code || null, appliedCouponDiscount, body.address, body.notes).run();

        // Hitung selisih mutasi Poin (Poin didapat dari sisa kupon DIKURANGI poin yang dipakai)
        const netPointsChange = excessCouponValue - pointsUsed;
        
        if (netPointsChange !== 0) {
            await db.prepare(`
                INSERT INTO points (user_id, balance) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?
            `).bind(user.id, Math.max(0, netPointsChange), netPointsChange).run();
        }

        return c.json({ 
          success: true, 
          message: 'Pesanan berhasil dibuat dan Otomatis Lunas!', 
          data: { order_id: orderId, final_amount: 0 } 
        });
    }

    // ==========================================
    // 8B. SKENARIO BAYAR QRIS (TAGIHAN > RP 0)
    // ==========================================
    // Simpan pesanan sebagai PENDING
    await db.prepare(
      `INSERT INTO orders (id, user_id, status, total_amount, points_used, coupon_code, coupon_discount, delivery_address, notes) 
       VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`
    ).bind(orderId, user.id, baseTotal, pointsUsed, body.coupon_code || null, appliedCouponDiscount, body.address, body.notes).run();

    // Jika ada sisa Kupon (meskipun harusnya tidak mungkin masuk blok ini jika ada sisa, tapi kita amankan), berikan poinnya SEKARANG
    if (excessCouponValue > 0) {
        await db.prepare(`
            INSERT INTO points (user_id, balance) VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?
        `).bind(user.id, excessCouponValue, excessCouponValue).run();
    }
    // PERHATIAN: pointsUsed TIDAK dipotong sekarang, melainkan menunggu webhook settlement dari GoPay (agar tidak hangus jika pesanan batal)

    const nowTimestamp = Math.floor(Date.now() / 1000);
    const expiredAt = nowTimestamp + (30 * 60); // 30 Menit Expired
    
    // Inject Raw QRIS Lokal
    const rawQris = injectAmount(config.master_raw_qris, finalAmount);
    if (!rawQris) {
        return c.json({ success: false, message: 'Gagal membuat QRIS dinamis.' }, 500);
    }
    
    // Simpan ke Tabel Transaksi
    await db.prepare(
      `INSERT INTO transactions (order_id, amount, unique_code, final_amount, raw_qris, status, created_at, expired_at) 
       VALUES (?, ?, ?, ?, ?, 'UNPAID', ?, ?)`
    ).bind(orderId, baseTotal, uniqueCodeGenerated, finalAmount, rawQris, nowTimestamp, expiredAt).run();

    return c.json({ 
      success: true, 
      message: 'Pesanan berhasil dibuat!', 
      data: { order_id: orderId, final_amount: finalAmount } 
    });

  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal memproses pesanan: ' + error.message }, 500);
  }
});

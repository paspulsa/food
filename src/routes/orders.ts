import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const orderRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ... (Jika ada endpoint GET orders sebelumnya, biarkan di atas sini)

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

    // 2. Kalkulasi Subtotal dari Database (Untuk mencegah kecurangan dari frontend)
    let subtotal = 0;
    for (const item of body.cart) {
      const dbItem: any = await db.prepare('SELECT price, promo_price, is_promo FROM menu_items WHERE id = ?').bind(item.id).first();
      if (dbItem) {
        const itemPrice = dbItem.is_promo === 1 ? dbItem.promo_price : dbItem.price;
        subtotal += (itemPrice + (item.additional_price || 0)) * item.qty;
      }
    }

    // 3. Kalkulasi Diskon Kupon (Jika Ada)
    let couponDiscount = 0;
    if (body.coupon_code) {
      const coupon: any = await db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').bind(body.coupon_code).first();
      if (coupon && subtotal >= coupon.min_purchase) {
        if (coupon.discount_type === 'PERCENTAGE') {
          couponDiscount = Math.floor(subtotal * (coupon.discount_value / 100));
          if (coupon.max_discount > 0 && couponDiscount > coupon.max_discount) couponDiscount = coupon.max_discount;
        } else {
          couponDiscount = coupon.discount_value;
        }
        if (couponDiscount > subtotal) couponDiscount = subtotal; // Cegah diskon minus
        
        // Catat penggunaan kupon (tambah count)
        await db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').bind(coupon.code).run();
      }
    }

    // 4. Kalkulasi Total Dasar
    const deliveryFee = settings ? settings.mid_range_price : 10000; // Asumsi sederhana
    const serviceFee = 3000;
    let baseTotal = subtotal + deliveryFee + serviceFee - couponDiscount;
    if (baseTotal < 0) baseTotal = 0;

    // 5. Cek Saldo Point User
    const pointData: any = await db.prepare('SELECT balance FROM points WHERE user_id = ?').bind(user.id).first();
    const userPoints = pointData ? pointData.balance : 0;

    // ==========================================
    // 6. LOGIKA INTI: KODE UNIK vs POTONG POINT
    // ==========================================
    let finalAmount = baseTotal;
    let pointsUsed = 0;
    let uniqueCodeGenerated = 0;

    if (userPoints > 0 && baseTotal > 0) {
      // SKENARIO A: USER PUNYA POINT
      // Potong poin sebesar tagihan (maksimal sebesar poin yang dimiliki)
      pointsUsed = Math.min(userPoints, baseTotal);
      finalAmount = baseTotal - pointsUsed;
      // Jangan generate kode unik, karena hasil pengurangan (misal 41.000 - 123) sudah menghasilkan nominal unik (40.877)
    } else {
      // SKENARIO B: USER TIDAK PUNYA POINT ATAU POIN 0
      // Generate Kode Unik untuk Cashabck
      const min = config.unique_min || 1;
      const max = config.unique_max || 999;
      const now = Math.floor(Date.now() / 1000);
      
      let isCollision = true;
      let attempts = 0;
      
      while (isCollision && attempts < 15) {
        uniqueCodeGenerated = Math.floor(Math.random() * (max - min + 1)) + min;
        finalAmount = baseTotal + uniqueCodeGenerated;
        
        // Pastikan nominal ini belum ada yang pakai dan belum expired
        const exists = await db.prepare("SELECT id FROM transactions WHERE final_amount = ? AND status = 'UNPAID' AND expired_at > ?").bind(finalAmount, now).first();
        if (!exists) isCollision = false;
        attempts++;
      }
      
      if (isCollision) return c.json({ success: false, message: 'Server pembayaran sedang sibuk, coba lagi nanti.' }, 503);
    }

    // 7. Simpan Pesanan ke tabel `orders`
    const orderId = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
    await db.prepare(
      `INSERT INTO orders (id, user_id, status, total_amount, points_used, coupon_code, coupon_discount, delivery_address, notes) 
       VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`
    ).bind(
      orderId, user.id, baseTotal, pointsUsed, body.coupon_code || null, couponDiscount, body.address, body.notes
    ).run();

    // 8. Generate QRIS & Simpan Transaksi
    // Fungsi injectAmount dipanggil dari helper atau util Anda
    const nowTimestamp = Math.floor(Date.now() / 1000);
    const expiredAt = nowTimestamp + (30 * 60); // 30 Menit Expired
    
    // Asumsi: injectAmount sama dengan yang ada di index.ts
    // Jika tidak bisa import dari index.ts, copy fungsi injectAmount dan crc16_ccitt ke file helper terpisah
    const qrResponse = await fetch(c.req.url.split('/api')[0] + '/api/v1/trx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.api_key}` },
        body: JSON.stringify({ order_id: orderId, amount: baseTotal, points_used: pointsUsed, forced_unique: uniqueCodeGenerated })
    });
    // CATATAN: Untuk bersihnya, kita langsung insert ke DB saja:
    
    // Panggil fungsi inject QRIS (Pastikan fungsi parseTlv, crc16_ccitt, injectAmount diletakkan di file utils/qris.ts)
    // Untuk contoh ini, saya buat simulasi string QRIS karena keterbatasan import di satu snippet
    const rawQris = config.master_raw_qris; // TODO: Panggil fungsi injectAmount(rawQris, finalAmount)
    
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

import { createRoute } from 'honox/factory'

// Harus menggunakan export const POST agar HonoX tahu ini adalah endpoint API murni, bukan halaman HTML
export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  
  try {
    const body = await c.req.json();
    
    // Sesuaikan properti body.amount dengan payload dari Veritrans/Midtrans/Moota Anda.
    // Veritrans biasanya menggunakan gross_amount
    const amountPaid = body.gross_amount || body.amount || body.nominal; 
    
    if (!amountPaid) {
        return c.json({ success: false, message: 'Payload webhook tidak valid (Amount tidak ditemukan)' }, 400);
    }

    // 1. Cari transaksi UNPAID dengan final_amount persis sama dengan dana yang masuk
    // (Jika pakai sistem kode unik, pastikan amountPaid adalah nominal yang dicari)
    const tx: any = await db.prepare(
        `SELECT order_id FROM transactions WHERE final_amount = ? AND status = 'UNPAID'`
    ).bind(amountPaid).first();

    if (!tx) {
        // Abaikan & berikan status 200 (OK) agar bot Midtrans/Moota tidak menganggap server mati 
        // dan tidak melakukan "retry" terus menerus ke server kita.
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

    // 4. Update Status Pesanan Utama menjadi PROCESSING (Tanda Lunas & Masuk ke Dapur)
    await db.prepare(
        `UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(orderId).run();

    // 5. Potong Poin User (Dieksekusi HANYA SETELAH lunas agar poin tidak hangus duluan jika user tidak jadi bayar)
    if (order && order.points_used > 0) {
        await db.prepare(
            `UPDATE points SET balance = balance - ? WHERE user_id = ?`
        ).bind(order.points_used, order.user_id).run();
    }

    // Berikan respons 200 OK standar yang diharapkan oleh semua Payment Gateway
    return c.json({ success: true, message: 'Pembayaran berhasil diverifikasi secara otomatis' }, 200);

  } catch (e: any) {
    console.error("Webhook Error Processing:", e);
    // Jika JSON dari Midtrans gagal di-parse atau ada error lain
    return c.json({ success: false, message: 'Kesalahan Sistem Webhook Server' }, 500);
  }
});

import { createRoute } from 'honox/factory';

// MENGGUNAKAN createRoute TAPI DENGAN ASYNC DAN MENGEMBALIKAN c.json() MURNI
export const POST = createRoute(async (c) => {
    // Casting DB dari env HonoX
    const db = c.env.DB as D1Database;
    
    try {
        const body = await c.req.json();
        
        // 1. Parsing Nilai Tagihan (Veritrans / Midtrans / Moota)
        const rawAmount = body.gross_amount || body.amount || body.nominal; 
        
        // Jika body kosong atau tidak ada nilai
        if (!rawAmount && !body.order_id) {
            return c.json({ success: false, message: 'Payload tidak valid' }, 400);
        }

        // Midtrans mengirim string '41000.00', parse ke integer 41000
        const amountPaid = rawAmount ? Math.floor(parseFloat(rawAmount)) : 0;

        // 2. Verifikasi Status Pembayaran Sukses (Midtrans/Veritrans dkk)
        const isSuccess = body.transaction_status === 'settlement' || 
                          body.transaction_status === 'capture' || 
                          body.status === 'success' || 
                          body.status === 'paid';

        if (isSuccess) {
            let tx: any = null;

            // Cari Transaksi berdasarkan order_id (Standar Midtrans)
            if (body.order_id) {
                tx = await db.prepare(
                    `SELECT id, order_id FROM transactions WHERE order_id = ? AND status = 'UNPAID'`
                ).bind(body.order_id).first();
            }

            // Fallback: Lacak dari Nominal Unik (Jika platform tidak mengirimkan order_id)
            if (!tx && amountPaid > 0) {
                tx = await db.prepare(
                    `SELECT id, order_id FROM transactions WHERE CAST(final_amount AS INTEGER) = ? AND status = 'UNPAID'`
                ).bind(amountPaid).first();
            }

            if (tx) {
                const orderId = tx.order_id;

                // Ambil data order untuk mengecek poin yang harus dikurangi
                const order: any = await db.prepare(
                    `SELECT user_id, points_used FROM orders WHERE id = ?`
                ).bind(orderId).first();

                // UPDATE 1: Tandai LUNAS di transactions
                await db.prepare(
                    "UPDATE transactions SET status = 'PAID' WHERE id = ?"
                ).bind(tx.id).run();

                // UPDATE 2: Pesanan Masuk Dapur (PROCESSING)
                await db.prepare(
                    "UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(orderId).run();

                // UPDATE 3: Potong Poin User (Jika ada dan sudah fix lunas)
                if (order && order.points_used > 0) {
                    await db.prepare(
                        "UPDATE points SET balance = balance - ? WHERE user_id = ?"
                    ).bind(order.points_used, order.user_id).run();
                }
            }
        }

        // WAJIB MERESPON 200 OK (Agar Bot Veritrans berhenti 'spam' hit ke server)
        return c.json({ success: true, message: 'Webhook received' }, 200);
        
    } catch (error: any) { 
        console.error("Webhook Error processing payload:", error);
        // Error internal juga ditangkap dan diubah jadi format response json (500)
        return c.json({ success: false, message: 'Kesalahan Sistem Webhook Server' }, 500); 
    }
});

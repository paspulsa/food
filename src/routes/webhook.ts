import { Hono } from 'hono';

type Bindings = {
    DB: D1Database;
}

// Menggunakan instansiasi Hono murni sebagai sub-router agar kebal dari error Promise HonoX
const app = new Hono<{ Bindings: Bindings }>();

app.post('/', async (c) => {
    try {
        const rawPayload = await c.req.json();
        const payload = { ...rawPayload };
        
        // 1. Parsing Nilai Tagihan (Menyesuaikan standar Veritrans/Midtrans)
        // Midtrans mengirim gross_amount. Jika dari platform lain, kita sediakan fallback.
        const grossAmount = payload.gross_amount ? parseFloat(payload.gross_amount) : (payload.amount || payload.nominal || 0);
        const paidAmount = Math.round(grossAmount); 

        // 2. Verifikasi Status Sukses dari Payment Gateway
        // Midtrans menggunakan 'settlement' atau 'capture'
        const isSuccess = payload.transaction_status === 'settlement' || 
                          payload.transaction_status === 'capture' || 
                          payload.status === 'success' || 
                          payload.status === 'paid';

        if (isSuccess) {
            // 3. Lacak Transaksi Menggunakan CAST (Persis seperti contoh Anda)
            const trx: any = await c.env.DB.prepare(`
                SELECT * FROM transactions 
                WHERE CAST(final_amount AS INTEGER) = ? 
                AND status = 'UNPAID' 
                ORDER BY created_at DESC LIMIT 1
            `).bind(paidAmount).first();

            if (trx) {
                const orderId = trx.order_id;

                // Ambil data order untuk mengecek pemotongan Poin Cashback
                const order: any = await c.env.DB.prepare(
                    `SELECT user_id, points_used FROM orders WHERE id = ?`
                ).bind(orderId).first();

                // UPDATE 1: Tandai Transaksi Pembayaran LUNAS
                await c.env.DB.prepare(
                    "UPDATE transactions SET status = 'PAID' WHERE id = ?"
                ).bind(trx.id).run();

                // UPDATE 2: Ubah Status Pesanan Utama menjadi PROCESSING (Masuk ke Dapur)
                await c.env.DB.prepare(
                    "UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).bind(orderId).run();

                // UPDATE 3: Eksekusi Pemotongan Poin (Dilakukan HANYA setelah lunas agar poin tidak hangus sia-sia)
                if (order && order.points_used > 0) {
                    await c.env.DB.prepare(
                        "UPDATE points SET balance = balance - ? WHERE user_id = ?"
                    ).bind(order.points_used, order.user_id).run();
                }
            }
        }

        // 4. Selalu Balas 200 OK
        // Sangat penting agar bot Veritrans berhenti melakukan "spam retry" ke server
        return c.json({ status: 'ok' });
        
    } catch (e: any) { 
        console.error("Webhook Error:", e);
        // Jika JSON gagal diurai (bukan format bot Veritrans), balas 500
        return c.json({ status: 'error', message: e.message }, 500); 
    }
});

// Ekspor sebagai sub-router ke ekosistem HonoX
export default app;

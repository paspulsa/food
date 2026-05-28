import { Hono } from 'hono';
import { Bindings } from '../types';

// WAJIB: Mengekspor konstanta dengan nama "webhookRouter" agar tidak error saat di-import oleh src/index.ts
export const webhookRouter = new Hono<{ Bindings: Bindings }>();

webhookRouter.post('/', async (c) => {
    try {
        const rawPayload = await c.req.json();
        const payload = { ...rawPayload };
        
        // Membaca gross_amount dari Veritrans/Gopay
        const grossAmount = payload.gross_amount ? parseFloat(payload.gross_amount) : 0;
        const paidAmount = Math.round(grossAmount); 

        if (payload.transaction_status === 'settlement' || payload.transaction_status === 'capture') {
            const trx: any = await c.env.DB.prepare(`
                SELECT * FROM transactions 
                WHERE CAST(final_amount AS INTEGER) = ? 
                AND status = 'UNPAID' 
                ORDER BY created_at DESC LIMIT 1
            `).bind(paidAmount).first();

            if (trx) {
                // 1. Update status transaksi menjadi PAID
                await c.env.DB.prepare("UPDATE transactions SET status = 'PAID' WHERE id = ?").bind(trx.id).run();
                
                // 2. Update status order utama menjadi PROCESSING
                await c.env.DB.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(trx.order_id).run();
                
                // 3. Potong poin user jika pesanan menggunakan poin
                const order: any = await c.env.DB.prepare("SELECT user_id, points_used FROM orders WHERE id = ?").bind(trx.order_id).first();
                if (order && order.points_used > 0) {
                    await c.env.DB.prepare("UPDATE points SET balance = balance - ? WHERE user_id = ?").bind(order.points_used, order.user_id).run();
                }

                payload.custom_order_id = trx.order_id;
            }
        }

        // 4. (Opsional) Forward Webhook sesuai contoh asli Anda
        try {
            const { results } = await c.env.DB.prepare('SELECT url FROM webhook_targets').all();
            if (results && results.length > 0) {
                c.executionCtx.waitUntil(Promise.all(results.map((t: any) => 
                    fetch(t.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(e => console.error("Webhook Forwarding Error:", e))
                )));
            }
        } catch (e) {
            // Abaikan jika tabel webhook_targets belum dibuat
        }

        return c.json({ status: 'ok' });
    } catch (e: any) { 
        console.error("Webhook Error:", e);
        return c.json({ status: 'error' }, 500); 
    }
});

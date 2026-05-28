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
                
                // 2. Ambil data order untuk membedakan antara pesanan makanan dan voucher
                const order: any = await c.env.DB.prepare(
                    "SELECT user_id, points_used, order_type, notes FROM orders WHERE id = ?"
                ).bind(trx.order_id).first();

                if (order) {
                    // Jika Voucher langsung COMPLETED (karena otomatis terkirim), jika makanan PROCESSING (masuk dapur)
                    const nextStatus = order.order_type === 'VOUCHER' ? 'COMPLETED' : 'PROCESSING';
                    await c.env.DB.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(nextStatus, trx.order_id).run();
                    
                    // 3. Potong poin user jika pesanan menggunakan poin
                    if (order.points_used > 0) {
                        await c.env.DB.prepare("UPDATE points SET balance = balance - ? WHERE user_id = ?").bind(order.points_used, order.user_id).run();
                    }

                    // 4. LOGIKA AUTO-GENERATE VOUCHER KETIKA LUNAS
                    if (order.order_type === 'VOUCHER' && order.notes) {
                        try {
                            const vData = JSON.parse(order.notes);
                            if (vData.is_voucher) {
                                // Eksekusi looping sebanyak bulk_qty (Jika beli paketan grosir 10x, maka terbuat 10 kupon)
                                for(let i = 0; i < (vData.bulk_qty || 1); i++) {
                                    // Generate Prefix K + 9 Alphanumeric Capital (Total 10 digit)
                                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                    let code = 'K';
                                    for(let j = 0; j < 9; j++) {
                                        code += chars.charAt(Math.floor(Math.random() * chars.length));
                                    }
                                    
                                    // Insert ke tabel coupons sesuai revisi skema
                                    await c.env.DB.prepare(`
                                        INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, usage_limit, purchaser_id, order_id, is_voucher)
                                        VALUES (?, ?, 'FIXED', ?, 0, 1, ?, ?, 1)
                                    `).bind(
                                        crypto.randomUUID(), 
                                        code, 
                                        vData.voucher_value, 
                                        order.user_id, 
                                        trx.order_id
                                    ).run();
                                }
                            }
                        } catch(e) { 
                            console.error("Gagal memproses parsing notes untuk generate voucher:", e); 
                        }
                    }
                }

                payload.custom_order_id = trx.order_id;
            }
        }

        // 5. (Opsional) Forward Webhook sesuai contoh asli Anda
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

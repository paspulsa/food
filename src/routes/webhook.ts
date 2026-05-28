import { Hono } from 'hono';
import { Bindings } from '../types';

export const webhookRouter = new Hono<{ Bindings: Bindings }>();

webhookRouter.post('/', async (c) => {
    try {
        const rawPayload = await c.req.json();
        const payload = { ...rawPayload };
        
        // Membaca gross_amount dari Veritrans/Gopay/Moota
        const grossAmount = payload.gross_amount ? parseFloat(payload.gross_amount) : (payload.amount || payload.nominal || 0);
        const paidAmount = Math.round(grossAmount); 

        const isSuccess = payload.transaction_status === 'settlement' || 
                          payload.transaction_status === 'capture' || 
                          payload.status === 'success' || 
                          payload.status === 'paid';

        if (isSuccess) {
            let trx: any = null;

            // Cari berdasarkan order_id (Jika platform mengirimkannya)
            if (payload.order_id) {
                trx = await c.env.DB.prepare(`SELECT * FROM transactions WHERE order_id = ? AND status = 'UNPAID'`).bind(payload.order_id).first();
            }
            
            // Fallback: Cari dari nominal unik persis
            if (!trx && paidAmount > 0) {
                trx = await c.env.DB.prepare(`SELECT * FROM transactions WHERE CAST(final_amount AS INTEGER) = ? AND status = 'UNPAID' ORDER BY created_at DESC LIMIT 1`).bind(paidAmount).first();
            }

            if (trx) {
                const orderId = trx.order_id;
                
                // 1. UPDATE STATUS TRANSAKSI KE PAID
                // Menggunakan orderId agar tidak error karena tabel transactions mungkin tidak memiliki kolom 'id'
                await c.env.DB.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(orderId).run();
                
                // 2. AMBIL DATA ORDER
                const order: any = await c.env.DB.prepare(
                    "SELECT user_id, points_used, order_type, notes FROM orders WHERE id = ?"
                ).bind(orderId).first();

                if (order) {
                    // 3. UBAH STATUS PESANAN (Voucher lunas langsung COMPLETED)
                    const nextStatus = order.order_type === 'VOUCHER' ? 'COMPLETED' : 'PROCESSING';
                    await c.env.DB.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(nextStatus, orderId).run();
                    
                    // 4. POTONG POIN JIKA USER MENGGUNAKAN POIN SEBAGAI DISKON
                    if (order.points_used > 0) {
                        await c.env.DB.prepare("UPDATE points SET balance = balance - ? WHERE user_id = ?").bind(order.points_used, order.user_id).run();
                    }

                    // ========================================================
                    // 5. KEMBALIKAN KODE UNIK MENJADI POIN CASHBACK
                    // Inilah yang membuat tabel 'points' Anda akan terisi setiap kali user transfer!
                    // ========================================================
                    if (trx.unique_code > 0) {
                        await c.env.DB.prepare(`
                            INSERT INTO points (user_id, balance) 
                            VALUES (?, ?) 
                            ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?
                        `).bind(order.user_id, trx.unique_code, trx.unique_code).run();
                    }

                    // 6. GENERATE VOUCHER (KHUSUS ORDER VOUCHER DIGITAL)
                    if (order.order_type === 'VOUCHER' && order.notes) {
                        try {
                            const vData = JSON.parse(order.notes);
                            if (vData.is_voucher) {
                                for(let i = 0; i < (vData.bulk_qty || 1); i++) {
                                    // Generate Prefix K + 9 Alphanumeric (10 digit)
                                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                    let code = 'K';
                                    for(let j = 0; j < 9; j++) {
                                        code += chars.charAt(Math.floor(Math.random() * chars.length));
                                    }
                                    
                                    await c.env.DB.prepare(`
                                        INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, usage_limit, purchaser_id, order_id, is_voucher)
                                        VALUES (?, ?, 'FIXED', ?, 0, 1, ?, ?, 1)
                                    `).bind(
                                        crypto.randomUUID(), 
                                        code, 
                                        vData.voucher_value, 
                                        order.user_id, 
                                        orderId
                                    ).run();
                                }
                            }
                        } catch(e) { 
                            console.error("Gagal generate voucher:", e); 
                        }
                    }
                }

                payload.custom_order_id = orderId;
            }
        }

        // 7. FORWARD WEBHOOK KE TARGET LAIN JIKA ADA
        try {
            const { results } = await c.env.DB.prepare('SELECT url FROM webhook_targets').all();
            if (results && results.length > 0) {
                c.executionCtx.waitUntil(Promise.all(results.map((t: any) => 
                    fetch(t.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(e => console.error("Webhook Forwarding Error:", e))
                )));
            }
        } catch (e) { }

        // Membalas 200 OK agar bot tenang
        return c.json({ status: 'ok' });
        
    } catch (e: any) { 
        console.error("Webhook Error:", e);
        return c.json({ status: 'error' }, 500); 
    }
});

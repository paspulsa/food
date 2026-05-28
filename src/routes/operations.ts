import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const operationsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// ENDPOINT KASIR
// ==========================================
operationsRouter.post('/cashier/action', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  try {
    if (body.action === 'pay_cash') {
      await db.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(body.order_id).run();
      await db.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
      return c.json({ success: true, message: 'Pembayaran Lunas! Pesanan masuk ke dapur.' });
    } 
    else if (body.action === 'cancel_order') {
      const orderInfo: any = await db.prepare("SELECT table_id FROM orders WHERE id = ?").bind(body.order_id).first();
      await db.prepare("UPDATE orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
      if (orderInfo && orderInfo.table_id && orderInfo.table_id !== 'TAKEAWAY') {
          await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(orderInfo.table_id).run();
      }
      return c.json({ success: true, message: 'Pesanan berhasil dibatalkan.' });
    }
    else if (body.action === 'free_table') {
      await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(body.table_id).run();
      return c.json({ success: true, message: `Meja ${body.table_id} berhasil dikosongkan.` });
    }
    return c.json({ success: false, message: 'Aksi tidak valid.' }, 400);
  } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
});

// ==========================================
// ENDPOINT DAPUR (KDS)
// ==========================================
operationsRouter.post('/kitchen/action', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  try {
    if (body.action === 'cook') {
      await db.prepare("UPDATE orders SET kitchen_status = 'COOKING', status = 'PREPARING' WHERE id = ?").bind(body.order_id).run();
      return c.json({ success: true });
    } else if (body.action === 'ready') {
      await db.prepare("UPDATE orders SET kitchen_status = 'READY' WHERE id = ?").bind(body.order_id).run();
      return c.json({ success: true });
    }
    return c.json({ success: false, message: 'Aksi tidak valid.' }, 400);
  } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
});

// ==========================================
// ENDPOINT WAITER
// ==========================================
operationsRouter.post('/waiter/action', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  try {
    if (body.action === 'deliver') {
      await db.prepare("UPDATE orders SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
      if (body.table_id && body.table_id !== 'TAKEAWAY') {
          await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(body.table_id).run();
      }
      return c.json({ success: true, message: 'Pesanan diserahkan, meja telah dikosongkan!' });
    }
    return c.json({ success: false, message: 'Aksi tidak valid.' }, 400);
  } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
});

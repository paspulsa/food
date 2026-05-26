import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const orderRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Ambil Daftar Seluruh Pesanan (Untuk Monitoring Dashboard Admin)
orderRouter.get('/', async (c) => {
  const { current = '1', pageSize = '10', status = '' } = c.req.query();
  const limit = parseInt(pageSize);
  const offset = (parseInt(current) - 1) * limit;

  let countQuery = 'SELECT COUNT(*) as total FROM orders';
  let dataQuery = `
    SELECT o.*, u.name as user_name, r.name as restaurant_name 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN restaurants r ON o.restaurant_id = r.id
  `;
  
  const params: any[] = [];
  if (status) {
    countQuery += ' WHERE status = ?';
    dataQuery += ' WHERE o.status = ?';
    params.push(status);
  }

  dataQuery += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';

  const totalQuery = await c.env.DB.prepare(countQuery).bind(...params).first('total');
  
  const dataParams = [...params, limit, offset];
  const { results } = await c.env.DB.prepare(dataQuery).bind(...dataParams).all();

  return c.json({
    success: true,
    data: results,
    total: totalQuery,
    current: parseInt(current),
    pageSize: limit
  });
});

// Ambil Detail Spesifik Transaksi Beserta Snapshot Item Yang Dibeli
orderRouter.get('/:id', async (c) => {
  const id = c.req.param('id');

  const order = await c.env.DB.prepare(`
    SELECT o.*, u.name as user_name, u.phone as user_phone, r.name as restaurant_name 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.id = ?
  `).bind(id).first();

  if (!order) {
    return c.json({ success: false, message: 'Pesanan tidak ditemukan!' }, 404);
  }

  const { results: items } = await c.env.DB.prepare(`
    SELECT od.*, mi.name as item_name, mi.image as item_image
    FROM order_details od
    JOIN menu_items mi ON od.menu_item_id = mi.id
    WHERE od.order_id = ?
  `).bind(id).all();

  return c.json({
    success: true,
    data: {
      ...order,
      items: items
    }
  });
});

// CREATE NEW ORDER (Checkout dari Mobile App User)
orderRouter.post('/', async (c) => {
  const body = await c.req.json();
  const user = c.get('jwtPayload'); // Mendapatkan ID User dari Token JWT
  
  const orderId = crypto.randomUUID();
  const { restaurant_id, address, total_price, items } = body; 
  // items harus berbentuk array of object: [{ menu_item_id, quantity, price }]

  if (!items || items.length === 0) {
    return c.json({ success: false, message: 'Keranjang belanja kosong!' }, 400);
  }

  // 1. Siapkan Query untuk tabel utama Orders
  const insertOrderStmt = c.env.DB.prepare(
    `INSERT INTO orders (id, user_id, restaurant_id, total_price, address, status) VALUES (?, ?, ?, ?, ?, 'PENDING')`
  ).bind(orderId, user.id, restaurant_id, total_price, address);

  // 2. Siapkan barisan Query untuk tabel Order Details
  const insertDetailsStmts = items.map((item: any) => {
    return c.env.DB.prepare(
      `INSERT INTO order_details (id, order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), orderId, item.menu_item_id, item.quantity, item.price);
  });

  // 3. Eksekusi semua secara serentak (Database Transaction / Batch)
  try {
    await c.env.DB.batch([insertOrderStmt, ...insertDetailsStmts]);
    return c.json({ success: true, message: 'Pesanan berhasil dibuat!', data: { orderId } }, 201);
  } catch (error) {
    return c.json({ success: false, message: 'Gagal memproses pesanan.' }, 500);
  }
});

// Mengubah Status Pesanan (PENDING -> PREPARING -> DELIVERING -> COMPLETED / CANCELLED)
orderRouter.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  if (!['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return c.json({ success: false, message: 'Status tidak valid!' }, 400);
  }

  const { success } = await c.env.DB.prepare(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(status, id).run();

  if (!success) {
    return c.json({ success: false, message: 'Gagal memperbarui status transaksi' }, 500);
  }

  return c.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}` });
});

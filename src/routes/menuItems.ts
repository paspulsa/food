import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuItemRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// 1. PUBLIC API (UNTUK PELANGGAN / STORE WEB)
// ==========================================
menuItemRouter.get('/public', async (c) => {
  const category_id = c.req.query('category_id');
  let results = [];

  if (category_id) {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_items WHERE category_id = ? AND is_available = 1 ORDER BY created_at DESC'
    ).bind(category_id).all();
    results = query.results;
  } else {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY created_at DESC'
    ).all();
    results = query.results;
  }

  return c.json({ success: true, data: results });
});

// ==========================================
// 2. ADMIN API (UNTUK DASHBOARD ADMIN)
// ==========================================
menuItemRouter.get('/', async (c) => {
  const category_id = c.req.query('category_id');
  let results = [];

  if (category_id) {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_items WHERE category_id = ? ORDER BY created_at DESC'
    ).bind(category_id).all();
    results = query.results;
  } else {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_items ORDER BY created_at DESC'
    ).all();
    results = query.results;
  }

  return c.json({ success: true, data: results });
});

// Buat Item Produk Kuliner Baru
menuItemRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO menu_items (
      id, category_id, name, description, price, image, 
      is_available, stock, is_promo, promo_price, end_promo_time, hpp,
      is_custom, custom_options
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, 
    body.category_id, 
    body.name, 
    body.description || null, 
    body.price || 0, 
    body.image || null,
    body.is_available !== undefined ? body.is_available : 1,
    body.stock || 0,
    body.is_promo || 0,
    body.promo_price || 0,
    body.end_promo_time || null,
    body.hpp || 0,
    body.is_custom || 0,
    body.custom_options || '[]'
  ).run();

  return c.json({ success: true, message: 'Item menu berhasil ditambahkan', data: { id } }, 201);
});

// Update Item Produk Kuliner
menuItemRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  if (Object.keys(body).length === 1 && body.stock !== undefined) {
    await c.env.DB.prepare(
      `UPDATE menu_items SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(body.stock, id).run();
    return c.json({ success: true, message: 'Stok instan berhasil diperbarui' });
  }

  await c.env.DB.prepare(
    `UPDATE menu_items 
     SET category_id = ?, name = ?, description = ?, price = ?, image = ?, 
         is_available = ?, stock = ?, is_promo = ?, promo_price = ?, end_promo_time = ?, hpp = ?,
         is_custom = ?, custom_options = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(
    body.category_id,
    body.name, 
    body.description || null, 
    body.price || 0, 
    body.image || null,
    body.is_available !== undefined ? body.is_available : 1,
    body.stock || 0,
    body.is_promo || 0,
    body.promo_price || 0,
    body.end_promo_time || null,
    body.hpp || 0,
    body.is_custom || 0,
    body.custom_options || '[]',
    id
  ).run();

  return c.json({ success: true, message: 'Item menu berhasil diperbarui' });
});

// Hapus Item Produk Kuliner
menuItemRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Item menu berhasil dihapus' });
});

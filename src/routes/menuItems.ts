import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuItemRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// 1. PUBLIC API (UNTUK PELANGGAN / STORE WEB)
// ==========================================
// Hanya menampilkan produk yang is_available = 1 (Tersedia / Aktif)
menuItemRouter.get('/public', async (c) => {
  const { category_id } = c.req.query();

  if (!category_id) {
    return c.json({ success: false, message: 'Parameter category_id wajib diisi!' }, 400);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE category_id = ? AND is_available = 1 ORDER BY created_at DESC'
  ).bind(category_id).all();

  return c.json({ success: true, data: results });
});


// ==========================================
// 2. ADMIN API (UNTUK DASHBOARD ADMIN)
// ==========================================

// Ambil Semua Item Produk (Termasuk yang disembunyikan/arsip)
menuItemRouter.get('/', async (c) => {
  const { category_id } = c.req.query();

  if (!category_id) {
    return c.json({ success: false, message: 'Parameter category_id wajib diisi!' }, 400);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE category_id = ? ORDER BY created_at DESC'
  ).bind(category_id).all();

  return c.json({ success: true, data: results });
});

// Buat Item Produk Kuliner Baru
menuItemRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO menu_items (
      id, category_id, name, description, price, image, 
      is_available, stock, is_promo, promo_price, end_promo_time, hpp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    body.hpp || 0
  ).run();

  return c.json({ success: true, message: 'Item menu berhasil ditambahkan', data: { id } }, 201);
});

// Update Item Produk Kuliner
menuItemRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  // (Opsional) Deteksi jika yang diupdate HANYA stok saja dari tombol cepat Dashboard POS
  if (Object.keys(body).length === 1 && body.stock !== undefined) {
    await c.env.DB.prepare(
      `UPDATE menu_items SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(body.stock, id).run();
    return c.json({ success: true, message: 'Stok instan berhasil diperbarui' });
  }

  // Update keseluruhan form produk
  await c.env.DB.prepare(
    `UPDATE menu_items 
     SET category_id = ?, name = ?, description = ?, price = ?, image = ?, 
         is_available = ?, stock = ?, is_promo = ?, promo_price = ?, end_promo_time = ?, hpp = ?,
         updated_at = CURRENT_TIMESTAMP 
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

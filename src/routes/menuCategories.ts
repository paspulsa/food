import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuCategoryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// 1. PUBLIC API (Opsional, untuk dirender ke pelanggan)
// ==========================================
menuCategoryRouter.get('/public', async (c) => {
  const restaurant_id = c.req.query('restaurant_id');
  if (!restaurant_id) return c.json({ success: false, message: 'restaurant_id wajib diisi' }, 400);

  const query = await c.env.DB.prepare(
    'SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order ASC, created_at DESC'
  ).bind(restaurant_id).all();

  return c.json({ success: true, data: query.results });
});

// ==========================================
// 2. ADMIN API (Untuk Dashboard)
// ==========================================
menuCategoryRouter.get('/', async (c) => {
  const restaurant_id = c.req.query('restaurant_id');
  let results = [];

  if (restaurant_id) {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order ASC, created_at DESC'
    ).bind(restaurant_id).all();
    results = query.results;
  } else {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_categories ORDER BY created_at DESC'
    ).all();
    results = query.results;
  }

  return c.json({ success: true, data: results });
});

// Buat Kategori Baru (POST)
menuCategoryRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  // Ini bagian pentingnya: Menyimpan data teks beserta URL Cloudinary (image) ke D1
  await c.env.DB.prepare(
    `INSERT INTO menu_categories (
      id, restaurant_id, name, description, sort_order, is_active, image
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.restaurant_id,
    body.name,
    body.description || null,
    body.sort_order || 0,
    body.is_active !== undefined ? body.is_active : 1,
    body.image || null // <-- URL Gambar masuk ke sini
  ).run();

  return c.json({ success: true, message: 'Kategori berhasil ditambahkan', data: { id } }, 201);
});

// Update Kategori (PUT)
menuCategoryRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  // Update data beserta gambarnya
  await c.env.DB.prepare(
    `UPDATE menu_categories 
     SET name = ?, description = ?, sort_order = ?, is_active = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(
    body.name,
    body.description || null,
    body.sort_order || 0,
    body.is_active !== undefined ? body.is_active : 1,
    body.image || null, // <-- URL Gambar baru masuk ke sini jika diubah
    id
  ).run();

  return c.json({ success: true, message: 'Kategori berhasil diperbarui' });
});

// Hapus Kategori (DELETE)
menuCategoryRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM menu_categories WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Kategori berhasil dihapus' });
});

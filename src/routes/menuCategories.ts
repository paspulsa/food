import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuCategoryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// 1. PUBLIC API (UNTUK PELANGGAN / STORE WEB)
// ==========================================
menuCategoryRouter.get('/public', async (c) => {
  const restaurant_id = c.req.query('restaurant_id');
  let results = [];

  if (restaurant_id) {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order ASC, created_at DESC'
    ).bind(restaurant_id).all();
    results = query.results;
  } else {
    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_categories WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC'
    ).all();
    results = query.results;
  }

  return c.json({ success: true, data: results });
});

// ==========================================
// 2. ADMIN API (UNTUK DASHBOARD ADMIN)
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

// Buat Kategori Baru
menuCategoryRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO menu_categories (
        id, restaurant_id, name, description, sort_order, is_active, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.restaurant_id ?? '',
      body.name ?? '',
      body.description ?? null,
      body.sort_order ?? 0,
      body.is_active ?? 1,
      body.image ?? null
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil ditambahkan', data: { id } }, 201);
  } catch (err: any) {
    // Memotong bug RangeError Hono dengan mengirim Response native
    return new Response(JSON.stringify({ success: false, message: 'DB Error (POST): ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Update Kategori
menuCategoryRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    await c.env.DB.prepare(
      `UPDATE menu_categories 
       SET name = ?, description = ?, sort_order = ?, is_active = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(
      body.name ?? '',
      body.description ?? null,
      body.sort_order ?? 0,
      body.is_active ?? 1,
      body.image ?? null,
      id
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (err: any) {
    // Memotong bug RangeError Hono dengan mengirim Response native
    return new Response(JSON.stringify({ success: false, message: 'DB Error (PUT): ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Hapus Kategori
menuCategoryRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM menu_categories WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: 'DB Error (DELETE): ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

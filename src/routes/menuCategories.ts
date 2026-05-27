import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuCategoryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ==========================================
// 1. PUBLIC API (Untuk Pelanggan)
// ==========================================
menuCategoryRouter.get('/public', async (c) => {
  try {
    const restaurant_id = c.req.query('restaurant_id');
    if (!restaurant_id) return c.json({ success: false, message: 'restaurant_id wajib diisi' }, 400);

    const query = await c.env.DB.prepare(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order ASC, created_at DESC'
    ).bind(restaurant_id).all();

    return c.json({ success: true, data: query.results });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ==========================================
// 2. ADMIN API (Untuk Dashboard)
// ==========================================
menuCategoryRouter.get('/', async (c) => {
  try {
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
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Buat Kategori Baru (POST)
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
      body.restaurant_id ?? null,
      body.name ?? null,
      body.description ?? null,
      body.sort_order ?? 0,
      body.is_active ?? 1,
      body.image ?? null
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil ditambahkan', data: { id } }, 201);
  } catch (error: any) {
    console.error("D1 POST Error:", error);
    // Sekarang kalau error, statusnya pasti 500 (bukan RangeError lagi)
    return c.json({ success: false, message: 'Gagal simpan ke DB: ' + error.message }, 500);
  }
});

// Update Kategori (PUT)
menuCategoryRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    await c.env.DB.prepare(
      `UPDATE menu_categories 
       SET name = ?, description = ?, sort_order = ?, is_active = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(
      body.name ?? null,
      body.description ?? null,
      body.sort_order ?? 0,
      body.is_active ?? 1,
      body.image ?? null,
      id
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error: any) {
    console.error("D1 PUT Error:", error);
    // Menangkap D1 Error agar tidak merusak Server Hono
    return c.json({ success: false, message: 'Gagal update DB: ' + error.message }, 500);
  }
});

// Hapus Kategori (DELETE)
menuCategoryRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM menu_categories WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

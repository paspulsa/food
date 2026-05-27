import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

// INI BAGIAN YANG HILANG DAN BIKIN BUILD ERROR TADI
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
  const body = await c.req.json();
  const id = crypto.randomUUID();

  try {
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
      body.image || null
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil ditambahkan', data: { id } }, 201);
  } catch (error: any) {
    // --- LOGGING JELAS UNTUK POST ---
    console.error("=== D1 ERROR INSERT KATEGORI ===");
    console.error("Pesan Error D1:", error.message);
    console.error("Payload yang dikirim:", JSON.stringify(body, null, 2));
    console.error("================================");
    
    return c.json({ success: false, message: 'Gagal insert: ' + error.message }, 500);
  }
});

// Update Kategori
menuCategoryRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    await c.env.DB.prepare(
      `UPDATE menu_categories 
       SET name = ?, description = ?, sort_order = ?, is_active = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(
      body.name,
      body.description || null,
      body.sort_order || 0,
      body.is_active !== undefined ? body.is_active : 1,
      body.image || null,
      id
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error: any) {
    // --- LOGGING JELAS UNTUK PUT ---
    console.error("=== D1 ERROR UPDATE KATEGORI ===");
    console.error("Target ID:", id);
    console.error("Pesan Error D1:", error.message);
    console.error("Payload yang dikirim:", JSON.stringify(body, null, 2));
    console.error("================================");
    
    return c.json({ success: false, message: 'Gagal update: ' + error.message }, 500);
  }
});

// Hapus Kategori
menuCategoryRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM menu_categories WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Kategori berhasil dihapus' });
});

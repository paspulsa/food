import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Ambil Kategori Menu Berdasarkan Restaurant ID
menuRouter.get('/', async (c) => {
  const { restaurant_id } = c.req.query();
  
  if (!restaurant_id) {
    return c.json({ success: false, message: 'Parameter restaurant_id wajib diisi!' }, 400);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM menus WHERE restaurant_id = ? ORDER BY created_at ASC'
  ).bind(restaurant_id).all();

  return c.json({ success: true, data: results });
});

// Tambah Kategori Menu Baru
menuRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  if (!body.restaurant_id || !body.name) {
    return c.json({ success: false, message: 'Data tidak lengkap!' }, 400);
  }

  await c.env.DB.prepare(
    'INSERT INTO menus (id, restaurant_id, name, description) VALUES (?, ?, ?, ?)'
  ).bind(id, body.restaurant_id, body.name, body.description || null).run();

  return c.json({ success: true, message: 'Kategori menu berhasil ditambahkan', data: { id } }, 201);
});

// Update Kategori Menu
menuRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE menus SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(body.name, body.description || null, id).run();

  return c.json({ success: true, message: 'Kategori menu berhasil diperbarui' });
});

// Hapus Kategori Menu (Mengaktifkan ON DELETE CASCADE ke Menu Items)
menuRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM menus WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Kategori menu berhasil dihapus beserta produk di dalamnya' });
});
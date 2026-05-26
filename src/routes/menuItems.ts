import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuItemRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Ambil Semua Item Produk Berdasarkan Kategori Menu ID
menuItemRouter.get('/', async (c) => {
  const { menu_id } = c.req.query();

  if (!menu_id) {
    return c.json({ success: false, message: 'Parameter menu_id wajib diisi!' }, 400);
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE menu_id = ? ORDER BY created_at DESC'
  ).bind(menu_id).all();

  return c.json({ success: true, data: results });
});

// Buat Item Produk Kuliner Baru
menuItemRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO menu_items (id, menu_id, name, description, price, image) 
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    id, 
    body.menu_id, 
    body.name, 
    body.description || null, 
    body.price, 
    body.image || null
  ).run();

  return c.json({ success: true, message: 'Item menu berhasil ditambahkan', data: { id } }, 201);
});

// Update Item Produk Kuliner
menuItemRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE menu_items 
     SET name = ?, description = ?, price = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(body.name, body.description || null, body.price, body.image || null, id).run();

  return c.json({ success: true, message: 'Item menu berhasil diperbarui' });
});

// Hapus Item Produk Kuliner
menuItemRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM menu_items WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Item menu berhasil dihapus' });
});
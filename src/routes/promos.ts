import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const promoRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Ambil semua promo
promoRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM app_promos ORDER BY created_at DESC'
  ).all();
  
  return c.json({ success: true, data: results }, 200);
});

// Buat Promo Baru (Banner / Modal)
promoRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(
    'INSERT INTO app_promos (id, type, image, action_url, is_active) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    id, 
    body.type, 
    body.image, 
    body.action_url || null, 
    body.is_active !== undefined ? body.is_active : 1
  ).run();
  
  return c.json({ success: true, message: 'Promo berhasil ditambahkan', data: { id } }, 201);
});

// Update Status Aktif/Non-Aktif
promoRouter.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await c.env.DB.prepare(
    'UPDATE app_promos SET is_active = ? WHERE id = ?'
  ).bind(body.is_active, id).run();
  
  return c.json({ success: true, message: 'Status promo berhasil diubah' }, 200);
});

// Hapus Promo Permanen
promoRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  
  await c.env.DB.prepare(
    'DELETE FROM app_promos WHERE id = ?'
  ).bind(id).run();
  
  return c.json({ success: true, message: 'Promo berhasil dihapus' }, 200);
});

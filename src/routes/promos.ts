import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const promoRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Buat Promo Baru
promoRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  await c.env.DB.prepare(
    'INSERT INTO app_promos (id, type, image, action_url, is_active) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, body.type, body.image, body.action_url || null, 1).run();
  
  return c.json({ success: true, message: 'Promo ditambahkan' });
});

// Update Status Aktif/Non-Aktif
promoRouter.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { is_active } = await c.req.json();
  
  await c.env.DB.prepare('UPDATE app_promos SET is_active = ? WHERE id = ?').bind(is_active, id).run();
  return c.json({ success: true });
});

// Hapus Promo Permanen
promoRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  
  await c.env.DB.prepare('DELETE FROM app_promos WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

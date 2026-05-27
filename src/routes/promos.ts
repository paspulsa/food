import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const promoRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Ambil semua promo
promoRouter.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM app_promos ORDER BY created_at DESC').all();
  return c.json({ success: true, data: results });
});

// Tambah promo baru (Banner/Modal)
promoRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO app_promos (id, type, image, action_url, is_active) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, body.type, body.image, body.action_url, body.is_active).run();
  return c.json({ success: true, message: 'Promo ditambahkan' });
});

// Update status aktif/non-aktif
promoRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const { is_active } = await c.req.json();
  await c.env.DB.prepare('UPDATE app_promos SET is_active = ? WHERE id = ?').bind(is_active, id).run();
  return c.json({ success: true });
});

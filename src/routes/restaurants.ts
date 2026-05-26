import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const restaurantRouter = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// GET ALL (Mendukung Pagination & Search UI UmiJS)
restaurantRouter.get('/', async (c) => {
  const { current = '1', pageSize = '10', name = '' } = c.req.query();
  const limit = parseInt(pageSize);
  const offset = (parseInt(current) - 1) * limit;

  const totalQuery = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM restaurants WHERE name LIKE ?'
  ).bind(`%${name}%`).first('total');

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM restaurants WHERE name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(`%${name}%`, limit, offset).all();

  // Konversi isActive dari 1/0 (SQLite) ke true/false (Frontend JSON)
  const formattedResults = results.map((row: any) => ({
    ...row,
    isActive: row.isActive === 1
  }));

  return c.json({
    success: true,
    data: formattedResults,
    total: totalQuery,
    current: parseInt(current),
    pageSize: limit
  });
});

// GET DETAIL BY ID
restaurantRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const restaurant: any = await c.env.DB.prepare('SELECT * FROM restaurants WHERE id = ?').bind(id).first();
  
  if (!restaurant) {
    return c.json({ success: false, message: 'Restoran tidak ditemukan' }, 404);
  }

  restaurant.isActive = restaurant.isActive === 1;
  return c.json({ success: true, data: restaurant });
});

// CREATE NEW RESTAURANT
restaurantRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  const isActiveInt = body.isActive === false ? 0 : 1; // Default true sesuai schema
  const rating = body.rating || 0.0;

  await c.env.DB.prepare(
    `INSERT INTO restaurants (id, name, address, phone, email, image, rating, isActive) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, 
    body.name, 
    body.address, 
    body.phone || null, 
    body.email || null, 
    body.image || null, 
    rating, 
    isActiveInt
  ).run();

  return c.json({ success: true, message: 'Restoran berhasil ditambahkan', data: { id } }, 201);
});

// UPDATE RESTAURANT
restaurantRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const isActiveInt = body.isActive ? 1 : 0;

  const { success } = await c.env.DB.prepare(
    `UPDATE restaurants 
     SET name = ?, address = ?, phone = ?, email = ?, image = ?, rating = ?, isActive = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(
    body.name, 
    body.address, 
    body.phone || null, 
    body.email || null, 
    body.image || null, 
    body.rating, 
    isActiveInt, 
    id
  ).run();

  if (!success) {
    return c.json({ success: false, message: 'Gagal memperbarui restoran atau ID tidak ditemukan' }, 500);
  }
  return c.json({ success: true, message: 'Restoran berhasil diperbarui' });
});

// DELETE RESTAURANT
restaurantRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  
  const { success } = await c.env.DB.prepare('DELETE FROM restaurants WHERE id = ?').bind(id).run();
  
  if (!success) {
    return c.json({ success: false, message: 'Gagal menghapus restoran' }, 500);
  }
  return c.json({ success: true, message: 'Restoran berhasil dihapus' });
});
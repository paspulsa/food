import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const restaurantRouter = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// GET ALL (Mendukung Pagination & Search)
restaurantRouter.get('/', async (c) => {
  try {
    const { current = '1', pageSize = '10', name = '' } = c.req.query();
    const limit = parseInt(pageSize);
    const offset = (parseInt(current) - 1) * limit;

    const totalQuery = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM restaurants WHERE name LIKE ?'
    ).bind(`%${name}%`).first('total');

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM restaurants WHERE name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(`%${name}%`, limit, offset).all();

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
    }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan internal server saat mengambil data gerai.' }, 500);
  }
});

// GET DETAIL BY ID
restaurantRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const restaurant: any = await c.env.DB.prepare('SELECT * FROM restaurants WHERE id = ?').bind(id).first();
    
    if (!restaurant) {
      return c.json({ success: false, message: 'Restoran/Gerai tidak ditemukan' }, 404);
    }

    restaurant.isActive = restaurant.isActive === 1;
    return c.json({ success: true, data: restaurant }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan sistem.' }, 500);
  }
});

// CREATE NEW RESTAURANT (Multi-Tenant & Geo-Location Ready)
restaurantRouter.post('/', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak. Otorisasi JWT tidak ditemukan.' }, 401);

  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    
    const isActiveInt = body.isActive === false ? 0 : 1; 
    const rating = body.rating || 0.0;
    
    // Injeksi Sistem Multi-Tenant, Koordinat GPS, dan Konfigurasi Tema
    const tenant_code = body.tenant_code || `TN-${crypto.randomUUID().substring(0,6).toUpperCase()}`;
    const owner_id = body.owner_id || payload.id;
    const theme_color = body.theme_color || '#E61010'; // Sesuai schema Anda
    
    // Penanganan Koordinat
    const lat = body.latitude ? parseFloat(body.latitude) : null;
    const lng = body.longitude ? parseFloat(body.longitude) : null;

    await c.env.DB.prepare(
      `INSERT INTO restaurants (id, name, address, phone, email, image, rating, isActive, latitude, longitude, theme_color, tenant_code, owner_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 
      body.name, 
      body.address, 
      body.phone || null, 
      body.email || null, 
      body.image || null, 
      rating, 
      isActiveInt,
      lat,
      lng,
      theme_color,
      tenant_code,
      owner_id
    ).run();

    return c.json({ success: true, message: 'Restoran berhasil didaftarkan', data: { id, tenant_code } }, 201);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Gagal. Kode Tenant sudah dipakai.' }, 400);
    }
    return c.json({ success: false, message: 'Kesalahan sistem saat menyimpan restoran: ' + error.message }, 500);
  }
});

// UPDATE RESTAURANT (Update Koordinat & Tema)
restaurantRouter.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak.' }, 401);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const isActiveInt = body.isActive ? 1 : 0;
    const theme_color = body.theme_color || '#E61010';
    const lat = body.latitude ? parseFloat(body.latitude) : null;
    const lng = body.longitude ? parseFloat(body.longitude) : null;

    const result = await c.env.DB.prepare(
      `UPDATE restaurants 
       SET name = ?, address = ?, phone = ?, email = ?, image = ?, rating = ?, isActive = ?, latitude = ?, longitude = ?, theme_color = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(
      body.name, 
      body.address, 
      body.phone || null, 
      body.email || null, 
      body.image || null, 
      body.rating || 0, 
      isActiveInt,
      lat,
      lng,
      theme_color,
      id
    ).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'ID Restoran tidak ditemukan' }, 404);
    }
    return c.json({ success: true, message: 'Informasi gerai restoran berhasil diperbarui' }, 200);
  } catch (error: any) {
    return c.json({ success: false, message: 'Terjadi kesalahan sistem: ' + error.message }, 500);
  }
});

// DELETE RESTAURANT
restaurantRouter.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak.' }, 401);

  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare('DELETE FROM restaurants WHERE id = ?').bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Restoran tidak ditemukan' }, 404);
    }
    return c.json({ success: true, message: 'Restoran berhasil dihapus permanen' }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan sistem saat menghapus data.' }, 500);
  }
});

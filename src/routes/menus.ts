import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET KATEGORI (Mendukung Filter Multi-Tenant berdasarkan restaurant_id)
menuRouter.get('/', async (c) => {
  try {
    const restaurant_id = c.req.query('restaurant_id');
    
    let query = 'SELECT * FROM menus';
    let params: any[] = [];

    // Tampilkan hanya kategori milik gerai tertentu
    if (restaurant_id) {
      query += ' WHERE restaurant_id = ? ORDER BY created_at ASC';
      params.push(restaurant_id);
    } else {
      query += ' ORDER BY created_at ASC';
    }

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: results }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan internal saat mengambil data katalog.' }, 500);
  }
});

// TAMBAH KATEGORI (Proteksi Area Admin & Validasi Gerai)
menuRouter.post('/', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak. Silakan login!' }, 401);

  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    if (!body.restaurant_id || !body.name) {
      return c.json({ success: false, message: 'ID Gerai dan Nama Kategori wajib diisi!' }, 400);
    }

    // Pengecekan eksistensi gerai agar data tidak yatim piatu
    const checkResto = await c.env.DB.prepare('SELECT id FROM restaurants WHERE id = ?').bind(body.restaurant_id).first();
    if (!checkResto) {
      return c.json({ success: false, message: 'Gagal! Gerai / Restoran tujuan tidak ditemukan.' }, 404);
    }

    await c.env.DB.prepare(
      'INSERT INTO menus (id, restaurant_id, name, description) VALUES (?, ?, ?, ?)'
    ).bind(id, body.restaurant_id, body.name, body.description || null).run();

    return c.json({ 
      success: true, 
      message: 'Kategori menu berhasil ditambahkan ke gerai.', 
      data: { id, restaurant_id: body.restaurant_id } 
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Kesalahan sistem saat menyimpan kategori.' }, 500);
  }
});

// UPDATE KATEGORI MENU (Proteksi Area Admin)
menuRouter.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak.' }, 401);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!body.name) {
      return c.json({ success: false, message: 'Nama kategori tidak boleh dikosongkan!' }, 400);
    }

    const result = await c.env.DB.prepare(
      'UPDATE menus SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(body.name, body.description || null, id).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Kategori tidak ditemukan.' }, 404);
    }

    return c.json({ success: true, message: 'Informasi kategori berhasil diperbarui.' }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan sistem saat memperbarui data.' }, 500);
  }
});

// HAPUS KATEGORI (Proteksi Area Admin)
menuRouter.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak.' }, 401);

  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare('DELETE FROM menus WHERE id = ?').bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Kategori tidak ditemukan.' }, 404);
    }

    return c.json({ success: true, message: 'Kategori menu dan seluruh produk di dalamnya berhasil dihapus.' }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan sistem saat menghapus data.' }, 500);
  }
});

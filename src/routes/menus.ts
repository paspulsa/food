import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const menuRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. GET: Ambil Kategori Menu (Publik & Admin)
menuRouter.get('/', async (c) => {
  try {
    const restaurant_id = c.req.query('restaurant_id');
    
    let query = 'SELECT * FROM menus';
    let params: any[] = [];

    // Filter by Tenant (Gerai)
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

// 2. POST: Tambah Kategori Menu Baru
menuRouter.post('/', async (c) => {
  // KEAMANAN TINGKAT TINGGI: Pastikan endpoint ini diakses via area terproteksi
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak. Otorisasi tidak valid!' }, 401);

  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    if (!body.restaurant_id || !body.name) {
      return c.json({ success: false, message: 'ID Gerai dan Nama Kategori wajib diisi!' }, 400);
    }

    // VALIDASI MULTI-TENANT: Pastikan gerai yang dimaksud benar-benar eksis
    const checkResto = await c.env.DB.prepare('SELECT id FROM restaurants WHERE id = ?').bind(body.restaurant_id).first();
    if (!checkResto) {
      return c.json({ success: false, message: 'Gagal! Gerai / Restoran tidak ditemukan di basis data.' }, 404);
    }

    await c.env.DB.prepare(
      'INSERT INTO menus (id, restaurant_id, name, description) VALUES (?, ?, ?, ?)'
    ).bind(id, body.restaurant_id, body.name, body.description || null).run();

    return c.json({ 
      success: true, 
      message: 'Kategori menu berhasil ditambahkan ke gerai.', 
      data: { id, restaurant_id: body.restaurant_id, name: body.name } 
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: 'Kesalahan saat menyimpan kategori: ' + error.message }, 500);
  }
});

// 3. PUT: Perbarui Kategori Menu
menuRouter.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak.' }, 401);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!body.name) {
      return c.json({ success: false, message: 'Nama kategori tidak boleh kosong!' }, 400);
    }

    const result = await c.env.DB.prepare(
      'UPDATE menus SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(body.name, body.description || null, id).run();

    // Verifikasi apakah data benar-benar terupdate
    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Kategori tidak ditemukan atau sudah dihapus.' }, 404);
    }

    return c.json({ success: true, message: 'Informasi kategori berhasil diperbarui.' }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Kesalahan sistem saat memperbarui kategori.' }, 500);
  }
});

// 4. DELETE: Hapus Kategori Menu beserta Isi Produknya
menuRouter.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) return c.json({ success: false, message: 'Akses ditolak.' }, 401);

  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare('DELETE FROM menus WHERE id = ?').bind(id).run();
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, message: 'Kategori tidak ditemukan.' }, 404);
    }

    return c.json({ success: true, message: 'Kategori menu dan seluruh produk di dalamnya berhasil dihapus (Cascade).' }, 200);
  } catch (error) {
    return c.json({ success: false, message: 'Terjadi kesalahan sistem saat proses penghapusan.' }, 500);
  }
});

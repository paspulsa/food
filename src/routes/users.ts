import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const userRouter = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Konfigurasi Role yang diizinkan di seluruh sistem
const allowedRoles = ['ADMIN', 'CASHIER', 'KITCHEN', 'WAITER', 'USER'];

// GET ALL USERS (Mendukung Pagination & Search)
userRouter.get('/', async (c) => {
  const { current = '1', pageSize = '10', email = '' } = c.req.query();
  const limit = parseInt(pageSize);
  const offset = (parseInt(current) - 1) * limit;

  const totalQuery = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM users WHERE email LIKE ?'
  ).bind(`%${email}%`).first('total');

  const { results } = await c.env.DB.prepare(
    'SELECT id, name, email, age, gender, address, role, phone, avatar, isActive, accountType, codeId, codeExpired, created_at, updated_at FROM users WHERE email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(`%${email}%`, limit, offset).all();

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

// GET USER DETAIL BY ID
userRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user: any = await c.env.DB.prepare(
    'SELECT id, name, email, age, gender, address, role, phone, avatar, isActive, accountType, codeId, codeExpired, created_at, updated_at FROM users WHERE id = ?'
  ).bind(id).first();
  
  if (!user) {
    return c.json({ success: false, message: 'Pengguna tidak ditemukan' }, 404);
  }

  user.isActive = user.isActive === 1;
  return c.json({ success: true, data: user });
});

// CREATE NEW USER (Biasanya dipanggil oleh Admin Area)
userRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();
  
  // Konfigurasi Nilai Default & VALIDASI ROLE
  const gender = body.gender || 'UNKNOWN';
  const avatar = body.avatar || 'default-user.png';
  const isActiveInt = body.isActive ? 1 : 0;
  const accountType = body.accountType || 'LOCAL';
  
  // Pengecekan ketat: Jika role yang dikirim tidak ada di allowedRoles, paksa jadi 'USER'
  const roleInput = body.role ? body.role.toUpperCase() : 'USER';
  const finalRole = allowedRoles.includes(roleInput) ? roleInput : 'USER';

  try {
    await c.env.DB.prepare(
      `INSERT INTO users (id, name, email, password, age, gender, address, role, phone, avatar, isActive, accountType, codeId, codeExpired) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 
      body.name, 
      body.email, 
      body.password, // Pastikan di encrypt (Hash) di tahap produksi
      body.age || null, 
      gender, 
      body.address || null, 
      finalRole, 
      body.phone || null, 
      avatar, 
      isActiveInt, 
      accountType,
      body.codeId || null,
      body.codeExpired || null
    ).run();

    return c.json({ success: true, message: 'Pengguna berhasil ditambahkan', data: { id } }, 201);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Email sudah terdaftar!' }, 400);
    }
    return c.json({ success: false, message: 'Terjadi kesalahan server' }, 500);
  }
});

// UPDATE USER FULL DATA
userRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const isActiveInt = body.isActive ? 1 : 0;

  // Pengecekan ketat: Jika role yang dikirim tidak ada di allowedRoles, paksa jadi 'USER'
  const roleInput = body.role ? body.role.toUpperCase() : 'USER';
  const finalRole = allowedRoles.includes(roleInput) ? roleInput : 'USER';

  const { success } = await c.env.DB.prepare(
    `UPDATE users 
     SET name = ?, email = ?, age = ?, gender = ?, address = ?, role = ?, phone = ?, avatar = ?, isActive = ?, accountType = ?, codeId = ?, codeExpired = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  ).bind(
    body.name, 
    body.email, 
    body.age || null, 
    body.gender || 'UNKNOWN', 
    body.address || null, 
    finalRole, 
    body.phone || null, 
    body.avatar || 'default-user.png', 
    isActiveInt, 
    body.accountType || 'LOCAL',
    body.codeId || null,
    body.codeExpired || null,
    id
  ).run();

  if (!success) {
    return c.json({ success: false, message: 'Gagal memperbarui pengguna' }, 500);
  }
  return c.json({ success: true, message: 'Pengguna berhasil diperbarui' });
});

// ==========================================
// ENDPOINT KHUSUS UBAH ROLE (DARI DASHBOARD ADMIN HTML)
// ==========================================
userRouter.put('/:id/role', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const roleInput = body.role ? body.role.toUpperCase() : '';
  
  if (!allowedRoles.includes(roleInput)) {
      return c.json({ success: false, message: 'Role yang dikirim tidak valid.' }, 400);
  }

  const { success } = await c.env.DB.prepare(
    `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(roleInput, id).run();

  if (!success) {
    return c.json({ success: false, message: 'Gagal mengubah Role pengguna. ID tidak ditemukan.' }, 500);
  }
  return c.json({ success: true, message: `Akses berhasil diubah menjadi ${roleInput}` });
});

// DELETE USER
userRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const { success } = await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  
  if (!success) {
    return c.json({ success: false, message: 'Gagal menghapus pengguna' }, 500);
  }
  return c.json({ success: true, message: 'Pengguna berhasil dihapus' });
});

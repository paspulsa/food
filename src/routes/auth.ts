import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { Bindings } from '../types';

export const authRouter = new Hono<{ Bindings: Bindings }>();

// Logika Login Admin & User
authRouter.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first<any>();

  if (!user) {
    return c.json({ success: false, message: 'Email atau password salah!' }, 401);
  }

  // Verifikasi password langsung (Sesuai dengan data teks murni bawaan skema)
  if (user.password !== password) {
    return c.json({ success: false, message: 'Email atau password salah!' }, 401);
  }

  if (user.isActive === 0) {
    return c.json({ success: false, message: 'Akun Anda belum aktif!' }, 403);
  }

  // Membuat Payload JWT dengan waktu kedaluwarsa 24 Jam
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
  };

  const token = await sign(payload, c.env.JWT_SECRET, 'HS256');

  return c.json({
    success: true,
    status: 'ok',
    type: 'account',
    currentAuthority: user.role,
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      gender: user.gender,
      accountType: user.accountType
    }
  });
});

// Logika Registrasi User Baru (Mengakomodasi field default Mongoose)
authRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  try {
    await c.env.DB.prepare(
      `INSERT INTO users (id, name, email, password, age, gender, address, role, phone, avatar, isActive, accountType) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'LOCAL')`
    ).bind(
      id,
      body.name,
      body.email,
      body.password,
      body.age || null,
      body.gender || 'UNKNOWN',
      body.address || null,
      'USER',
      body.phone || null,
      'default-user.png'
    ).run();

    return c.json({ success: true, message: 'Registrasi berhasil, silakan tunggu aktivasi admin.' }, 201);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Email sudah terdaftar!' }, 400);
    }
    return c.json({ success: false, message: 'Terjadi kesalahan internal server' }, 500);
  }
});
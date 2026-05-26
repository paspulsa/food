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

  if (user.password !== password) {
    return c.json({ success: false, message: 'Email atau password salah!' }, 401);
  }

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
    currentAuthority: user.role,
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// Logika Registrasi yang sudah disesuaikan dengan skema tabel terbaru
authRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  try {
    // Hanya memasukkan kolom yang ada di database. Role otomatis 'USER' sesuai DEFAULT.
    await c.env.DB.prepare(
      `INSERT INTO users (id, name, email, password, avatar) VALUES (?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.name,
      body.email,
      body.password,
      'default-user.png'
    ).run();

    return c.json({ success: true, message: 'Registrasi berhasil, silakan login.' }, 201);
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Email sudah terdaftar!' }, 400);
    }
    return c.json({ success: false, message: 'Terjadi kesalahan internal server' }, 500);
  }
});

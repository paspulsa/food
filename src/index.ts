import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { Bindings, Variables } from './types';

// Import Seluruh Router Komponen
import { authRouter } from './routes/auth';
import { restaurantRouter } from './routes/restaurants';
import { userRouter } from './routes/users';
import { menuRouter } from './routes/menus';
import { menuItemRouter } from './routes/menuItems';
import { orderRouter } from './routes/orders';
import { uploadRouter } from './routes/uploads';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/v1');

// Middleware Global
app.use('*', logger());
app.use('*', cors({
  origin: '*', // Di produksi, ganti dengan domain spesifik Cloudflare Pages Admin Anda
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Rute Publik (Tanpa Autentikasi)
app.route('/auth', authRouter);
app.route('/public/restaurants', restaurantRouter);
app.route('/public/menus', menuRouter);
app.route('/public/menu-items', menuItemRouter);

// Middleware Proteksi JWT HS256 untuk Area Admin
app.use('/admin/*', async (c, next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return middleware(c, next);
});

// Middleware Validasi Role ADMIN (Role Guard)
app.use('/admin/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN') {
    return c.json({ success: false, message: 'Akses ditolak. Anda bukan Admin!' }, 403);
  }
  await next();
});

// Registrasi Rute Terproteksi Admin (CRUD Lengkap)
app.route('/admin/restaurants', restaurantRouter);
app.route('/admin/users', userRouter);
app.route('/admin/menus', menuRouter);
app.route('/admin/menu-items', menuItemRouter);
app.route('/admin/orders', orderRouter);
app.route('/admin/uploads', uploadRouter);

export default app;
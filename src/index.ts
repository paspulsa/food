import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { Bindings, Variables } from './types';

// Import Seluruh Router Komponen secara Lengkap
import { authRouter } from './routes/auth';
import { restaurantRouter } from './routes/restaurants';
import { userRouter } from './routes/users';
import { menuRouter } from './routes/menus';
import { menuItemRouter } from './routes/menuItems';
import { orderRouter } from './routes/orders';
import { uploadRouter } from './routes/uploads';
import { menuCategoryRouter } from './routes/menuCategories';
import { promoRouter } from './routes/promos';

// Inisialisasi Aplikasi Hono dengan Base Path
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/v1');

// Middleware Global
app.use('*', logger());
app.use('*', cors({
  origin: '*', // Di produksi, ganti dengan domain spesifik Cloudflare Pages Admin Anda
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================================
// 1. RUTE PUBLIK (Dapat diakses tanpa login)
// ==========================================
app.route('/auth', authRouter);
app.route('/public/restaurants', restaurantRouter);
app.route('/public/menus', menuRouter);
app.route('/public/menu-items', menuItemRouter);
app.route('/public/menu-categories', menuCategoryRouter);

// ==========================================
// 2. MIDDLEWARE JWT GLOBAL (Area Terproteksi)
// ==========================================
// Semua request yang mengarah ke path /protected/* wajib memiliki Token JWT yang valid
app.use('/protected/*', async (c, next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return middleware(c, next);
});

// ==========================================
// 3. RUTE KHUSUS USER (Aplikasi Mobile)
// ==========================================
// Rute ini hanya membutuhkan token JWT valid (Role USER maupun ADMIN bisa akses)
app.route('/protected/user/orders', orderRouter);
app.route('/protected/user/profile', userRouter);

// ==========================================
// 4. ROLE GUARD (Khusus Area Admin)
// ==========================================
// Middleware ini memblokir siapapun yang rolenya bukan ADMIN
app.use('/protected/admin/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN') {
    return c.json({ success: false, message: 'Akses ditolak. Anda bukan Admin!' }, 403);
  }
  await next();
});

// ==========================================
// 5. RUTE KHUSUS ADMIN (Web Dashboard)
// ==========================================
app.route('/protected/admin/restaurants', restaurantRouter);
app.route('/protected/admin/users', userRouter);
app.route('/protected/admin/menu-categories', menuCategoryRouter);
app.route('/protected/admin/menu-items', menuItemRouter);
app.route('/protected/admin/orders', orderRouter);
app.route('/protected/admin/uploads', uploadRouter);
app.route('/protected/admin/promos', promoRouter);

export default app;

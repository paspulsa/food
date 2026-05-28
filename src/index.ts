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
import { couponRouter } from './routes/coupons';
import { gobizRouter } from './routes/gobiz';
import { webhookRouter } from './routes/webhook'; // <--- IMPORT ROUTER BARU

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware Global
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================================
// 0. ENDPOINT WEBHOOK (Paling Luar)
// ==========================================
// Mendaftarkan Webhook secara langsung di root API agar urlnya menjadi:
// https://domainanda.com/webhook
app.route('/webhook', webhookRouter);

// ==========================================
// 1. RUTE PUBLIK (Dapat diakses tanpa login)
// ==========================================
// Mengelompokkan semua API utama ke dalam /api/v1
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

api.route('/auth', authRouter);
api.route('/public/restaurants', restaurantRouter);
api.route('/public/menus', menuRouter);
api.route('/public/menu-items', menuItemRouter);
api.route('/public/menu-categories', menuCategoryRouter);
api.route('/public/coupons', couponRouter);

// ==========================================
// 2. MIDDLEWARE JWT GLOBAL (Area Terproteksi)
// ==========================================
api.use('/protected/*', async (c, next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return middleware(c, next);
});

// ==========================================
// 3. RUTE KHUSUS USER (Aplikasi Mobile)
// ==========================================
api.route('/protected/user/orders', orderRouter);
api.route('/protected/user/profile', userRouter);

// ==========================================
// 4. ROLE GUARD (Khusus Area Admin)
// ==========================================
api.use('/protected/admin/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN') {
    return c.json({ success: false, message: 'Akses ditolak. Anda bukan Admin!' }, 403);
  }
  await next();
});

// ==========================================
// 5. RUTE KHUSUS ADMIN (Web Dashboard)
// ==========================================
api.route('/protected/admin/restaurants', restaurantRouter);
api.route('/protected/admin/users', userRouter);
api.route('/protected/admin/menu-categories', menuCategoryRouter);
api.route('/protected/admin/menu-items', menuItemRouter);
api.route('/protected/admin/orders', orderRouter);
api.route('/protected/admin/uploads', uploadRouter);
api.route('/protected/admin/promos', promoRouter);
api.route('/protected/admin/coupons', couponRouter);
api.route('/protected/admin/gobiz', gobizRouter);

// Pasang sub-router api ke root aplikasi
app.route('/api/v1', api);

export default app;

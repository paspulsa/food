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
import { webhookRouter } from './routes/webhook';
import { operationsRouter } from './routes/operations';

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
app.route('/webhook', webhookRouter);

// ==========================================
// 1. RUTE PUBLIK (Dapat diakses tanpa login)
// ==========================================
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
// 4. ROLE GUARD BERLAPIS (Proteksi Semua Role)
// ==========================================

// Guard Khusus Admin
api.use('/protected/admin/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN') {
    return c.json({ success: false, message: 'Akses ditolak. Khusus Admin!' }, 403);
  }
  await next();
});

// Guard Khusus Kasir (Admin juga diizinkan)
api.use('/protected/ops/cashier/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN' && payload.role !== 'CASHIER') {
    return c.json({ success: false, message: 'Akses ditolak. Khusus Kasir!' }, 403);
  }
  await next();
});

// Guard Khusus Dapur (Admin juga diizinkan)
api.use('/protected/ops/kitchen/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN' && payload.role !== 'KITCHEN') {
    return c.json({ success: false, message: 'Akses ditolak. Khusus Dapur!' }, 403);
  }
  await next();
});

// Guard Khusus Waiter (Admin juga diizinkan)
api.use('/protected/ops/waiter/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.role !== 'ADMIN' && payload.role !== 'WAITER') {
    return c.json({ success: false, message: 'Akses ditolak. Khusus Pelayan!' }, 403);
  }
  await next();
});

// ==========================================
// 5. RUTE KHUSUS ADMIN & OPERASIONAL
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

// Mendaftarkan Rute Operasional yang tadi Error 500
api.route('/protected/ops', operationsRouter);

app.route('/api/v1', api);

export default app;

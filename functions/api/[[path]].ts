import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { Bindings, Variables } from '../../src/types';

// Import Seluruh Router Komponen secara Utuh
import { authRouter } from '../../src/routes/auth';
import { restaurantRouter } from '../../src/routes/restaurants';
import { userRouter } from '../../src/routes/users';
import { menuRouter } from '../../src/routes/menus';
import { menuItemRouter } from '../../src/routes/menuItems';
import { orderRouter } from '../../src/routes/orders';
import { uploadRouter } from '../../src/routes/uploads';

// Inisialisasi Aplikasi Hono untuk Pages Functions
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api/v1');

// Middleware Global
app.use('*', logger());
app.use('*', cors({
  origin: '*',
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

// ==========================================
// 2. MIDDLEWARE JWT GLOBAL (Area Terproteksi)
// ==========================================
app.use('/protected/*', async (c, next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return middleware(c, next);
});

// ==========================================
// 3. RUTE KHUSUS USER (Aplikasi Mobile)
// ==========================================
app.route('/protected/user/orders', orderRouter);
app.route('/protected/user/profile', userRouter);

// ==========================================
// 4. ROLE GUARD (Khusus Area Admin)
// ==========================================
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
app.route('/protected/admin/menus', menuRouter);
app.route('/protected/admin/menu-items', menuItemRouter);
app.route('/protected/admin/orders', orderRouter);
app.route('/protected/admin/uploads', uploadRouter);

// Handler khusus ekspor untuk runtime Cloudflare Pages Functions
export const onRequest = handle(app);

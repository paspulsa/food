import { createRoute } from 'honox/factory'
import { deleteCookie } from 'hono/cookie'

export default createRoute((c) => {
  // MENGHAPUS COOKIE YANG BENAR (admin_token)
  deleteCookie(c, 'admin_token', { path: '/' });
  
  // Membersihkan sesi shift kasir agar tidak menyangkut
  deleteCookie(c, 'current_shift_id', { path: '/' });

  // Mengarahkan kembali ke halaman login operasional
  return c.redirect('/login');
})

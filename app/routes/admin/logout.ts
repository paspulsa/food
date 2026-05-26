import { createRoute } from 'honox/factory'
import { deleteCookie } from 'hono/cookie'

export default createRoute((c) => {
  // Menghapus cookie yang menyimpan token JWT Admin
  deleteCookie(c, 'token', { 
    path: '/',
    secure: true,
    httpOnly: true
  });

  // Mengarahkan admin kembali ke halaman login
  return c.redirect('/login');
})

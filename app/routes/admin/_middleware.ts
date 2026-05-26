import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c, next) => {
  const token = getCookie(c, 'admin_token')
  
  if (!token) {
    return c.redirect('/login')
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (payload.role !== 'ADMIN') {
      return c.text('Forbidden: Akses ditolak', 403)
    }
    c.set('jwtPayload', payload)
    await next()
  } catch (err) {
    return c.redirect('/login')
  }
})

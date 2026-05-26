import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Admin Dashboard - KPKembar'}</title>
        
        {/* Menggunakan murni Tailwind CDN sesuai instruksi Anda */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Suntik konfigurasi warna kustom langsung ke CDN */}
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: '#ee4d2d',
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
})

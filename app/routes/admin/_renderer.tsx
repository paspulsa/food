import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Admin Dashboard - KPKembar'}</title>
        
        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
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
        <div class="flex h-screen bg-gray-50 overflow-hidden relative">
          
          {/* Trik Checkbox untuk Toggle Sidebar Mobile Tanpa JS */}
          <input type="checkbox" id="sidebar-toggle" class="peer hidden" />

          {/* Overlay Gelap Mobile */}
          <label 
            for="sidebar-toggle" 
            class="fixed inset-0 bg-slate-950/50 z-20 transition-opacity duration-300 md:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto"
          ></label>

          {/* --- SIDEBAR KIRI --- */}
          <aside class="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 flex flex-col shadow-xl transform -translate-x-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 peer-checked:translate-x-0">
            <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
              <h1 class="text-xl font-black text-orange-500 tracking-wider">KPKembar</h1>
              <label for="sidebar-toggle" class="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer md:hidden">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </label>
            </div>
            
            <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <p class="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Utama</p>
              <a href="/admin" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">Dashboard</a>
              <a href="/admin/restaurants" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">Restoran</a>
              <a href="/admin/menus" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">Katalog Menu</a>
              <a href="/admin/orders" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">Pesanan</a>
              <a href="/admin/users" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">Pengguna</a>
            </nav>
            
            <div class="p-4 border-t border-slate-800 bg-slate-950">
              <a href="/admin/logout" class="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md">Keluar</a>
            </div>
          </aside>

          {/* --- KONTEN UTAMA KANAN --- */}
          <div class="flex-1 flex flex-col min-w-0">
            <header class="h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-gray-200 shadow-sm z-10 gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <label for="sidebar-toggle" class="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer md:hidden select-none">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </label>
                <span class="text-xs md:text-sm font-medium text-gray-500 truncate">Panel Serverless</span>
              </div>
              <div class="flex items-center gap-2 md:gap-3 flex-shrink-0">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-bold text-gray-700 leading-none">Super Admin</p>
                </div>
                <img class="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-200" src="https://ui-avatars.com/api/?name=Admin&background=ee4d2d&color=fff" alt="Avatar" />
              </div>
            </header>

            {/* Render Halaman Asli di Sini */}
            <main class="flex-1 overflow-auto p-4 md:p-8">
              <div class="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>

        </div>
      </body>
    </html>
  )
})

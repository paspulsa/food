import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Admin Dashboard - KPKembar'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: { primary: '#ee4d2d' },
                  animation: { 'fade-in': 'fadeIn 0.3s ease-in-out' },
                  keyframes: {
                    fadeIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased">
        <div class="flex h-screen overflow-hidden relative">
          
          <input type="checkbox" id="sidebar-toggle" class="peer hidden" />
          <label for="sidebar-toggle" class="fixed inset-0 bg-slate-950/50 z-20 transition-opacity duration-300 md:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto"></label>

          {/* SIDEBAR */}
          <aside class="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 flex flex-col shadow-2xl transform -translate-x-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 peer-checked:translate-x-0">
            <div class="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
              <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-primary tracking-wide">KPKembar</h1>
              <label for="sidebar-toggle" class="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer md:hidden">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </label>
            </div>
            
            <nav id="admin-nav" class="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
              <p class="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Menu Utama</p>
              <a href="/admin" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium nav-link">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Dashboard
              </a>
              <a href="/admin/restaurants" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium nav-link">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                Restoran
              </a>
              <a href="/admin/menus" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium nav-link">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                Katalog Menu
              </a>
              <a href="/admin/orders" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium nav-link">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                Pesanan
              </a>
              <a href="/admin/users" class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium nav-link">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Pengguna
              </a>
            </nav>
            
            <div class="p-4 bg-slate-950/30">
              <a href="/admin/logout" class="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-all shadow border border-slate-700 hover:border-red-500">Keluar Sistem</a>
            </div>
          </aside>

          {/* KONTEN UTAMA */}
          <div class="flex-1 flex flex-col min-w-0">
            <header class="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm z-10 sticky top-0">
              <div class="flex items-center gap-3 min-w-0">
                <label for="sidebar-toggle" class="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer md:hidden select-none">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </label>
                <span class="text-sm font-semibold text-gray-500 uppercase tracking-widest hidden sm:block">Panel Kontrol</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-bold text-gray-800 leading-none">Administrator</p>
                  <p class="text-xs text-green-500 font-medium mt-1">● Online</p>
                </div>
                <img class="w-10 h-10 rounded-full border-2 border-primary shadow-sm" src="https://ui-avatars.com/api/?name=Admin&background=ee4d2d&color=fff&bold=true" alt="Avatar" />
              </div>
            </header>

            <main class="flex-1 overflow-auto p-6 md:p-10 bg-[#f8fafc]">
              <div class="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Script Injeksi untuk Active State Menu Sidebar */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', () => {
              const currentPath = window.location.pathname;
              const links = document.querySelectorAll('.nav-link');
              links.forEach(link => {
                const href = link.getAttribute('href');
                if(href === currentPath || (currentPath.startsWith(href) && href !== '/admin')) {
                  link.classList.remove('text-slate-400', 'hover:bg-slate-800');
                  link.classList.add('bg-gradient-to-r', 'from-primary', 'to-orange-500', 'text-white', 'shadow-lg', 'shadow-primary/30');
                }
              });
            });
          `
        }} />
      </body>
    </html>
  )
})

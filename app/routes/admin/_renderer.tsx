import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children }) => {
  return (
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- SIDEBAR KIRI --- */}
      <aside class="w-64 bg-slate-900 text-slate-200 flex flex-col shadow-xl">
        {/* Logo Area */}
        <div class="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-950">
          <h1 class="text-xl font-black text-orange-500 tracking-wider">KPKembar Admin</h1>
        </div>
        
        {/* Menu Navigasi */}
        <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p class="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Utama</p>
          
          <a href="/admin" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Dashboard
          </a>
          
          <a href="/admin/restaurants" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            Restoran
          </a>
          
          <a href="/admin/menus" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Katalog Menu
          </a>
          
          <a href="/admin/orders" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Pesanan
          </a>

          <a href="/admin/users" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Pengguna
          </a>

          <p class="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pt-6">Keamanan & Akun</p>

          <a href="/admin/change-password" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-medium">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
            Ubah Password
          </a>
        </nav>
        
        {/* Tombol Keluar / Logout */}
        <div class="p-4 border-t border-slate-800 bg-slate-950">
          <a href="/admin/logout" class="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors shadow-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Keluar Aplikasi
          </a>
        </div>
      </aside>

      {/* --- KONTEN UTAMA KANAN --- */}
      <div class="flex-1 flex flex-col min-w-0">
        {/* Header Atas */}
        <header class="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-sm z-10">
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-500">Panel Kendali Serverless</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-sm font-bold text-gray-700 leading-none">Super Admin</p>
              <p class="text-xs text-gray-500 mt-1">Administrator</p>
            </div>
            <img class="w-9 h-9 rounded-full border border-gray-200" src="https://ui-avatars.com/api/?name=Admin&background=ee4d2d&color=fff" alt="Admin Avatar" />
          </div>
        </header>

        {/* Render Konten Halaman */}
        <main class="flex-1 overflow-auto p-8">
          <div class="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
})

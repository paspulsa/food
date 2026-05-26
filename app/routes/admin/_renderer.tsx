import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children }) => {
  return (
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- SIDEBAR KIRI --- */}
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Logo Area */}
        <div class="h-16 flex items-center justify-center border-b border-gray-100">
          <h1 class="text-2xl font-black text-primary tracking-tight">KPKembar</h1>
        </div>
        
        {/* Menu Navigasi */}
        <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu Utama</p>
          
          <a href="/admin" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-primary transition-colors font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Dashboard
          </a>
          
          <a href="/admin/restaurants" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-primary transition-colors font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            Restoran
          </a>
          
          <a href="/admin/menus" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-primary transition-colors font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Katalog Menu
          </a>
          
          <a href="/admin/orders" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-primary transition-colors font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            Pesanan
          </a>

          <a href="/admin/users" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-primary transition-colors font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Pengguna
          </a>
        </nav>
        
        {/* Tombol Logout */}
        <div class="p-4 border-t border-gray-100">
          <a href="/logout" class="flex items-center gap-3 text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Keluar
          </a>
        </div>
      </aside>

      {/* --- KONTEN UTAMA KANAN --- */}
      <div class="flex-1 flex flex-col min-w-0">
        
        {/* Header Atas */}
        <header class="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-sm z-10">
          <div class="flex items-center">
            <h2 class="text-lg font-semibold text-gray-800">Admin Area</h2>
          </div>
          
          <div class="flex items-center gap-4">
            <button class="text-gray-400 hover:text-gray-600 relative">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div class="h-6 w-px bg-gray-200"></div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-sm font-bold text-gray-700 leading-none">Super Admin</p>
                <p class="text-xs text-gray-500 mt-1">Administrator</p>
              </div>
              <img class="w-9 h-9 rounded-full border border-gray-200" src="https://ui-avatars.com/api/?name=Admin&background=ee4d2d&color=fff" alt="Admin Avatar" />
            </div>
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

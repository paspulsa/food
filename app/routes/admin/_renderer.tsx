import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id" class="dark"> {/* Default Dark Mode */}
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Dashboard SPOS Modern'}</title>
        
        {/* Font & Icons */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* Tailwind & Chart.js */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

        {/* Konfigurasi Tema Dinamis */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --color-primary: 16 185 129; /* Default Emerald */
            }
            .theme-emerald { --color-primary: 16 185 129; }
            .theme-blue { --color-primary: 59 130 246; }
            .theme-orange { --color-primary: 238 77 45; }
            .theme-purple { --color-primary: 139 92 246; }
            
            body { font-family: 'Inter', sans-serif; }
            
            /* Custom Scrollbar */
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
          `
        }} />

        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    primary: 'rgb(var(--color-primary) / <alpha-value>)',
                    darkbg: '#111827',
                    darkpanel: '#1f2937',
                    darkborder: '#374151'
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body class="bg-gray-50 text-gray-900 dark:bg-darkbg dark:text-gray-100 antialiased transition-colors duration-300">
        <div class="flex h-screen overflow-hidden relative">
          
          <input type="checkbox" id="sidebar-toggle" class="peer hidden" />
          <label for="sidebar-toggle" class="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto"></label>

          {/* SIDEBAR */}
          <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-darkpanel border-r border-gray-200 dark:border-darkborder flex flex-col transform -translate-x-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 peer-checked:translate-x-0">
            {/* Logo */}
            <div class="h-20 flex items-center justify-center border-b border-gray-100 dark:border-darkborder">
              <div class="text-center">
                <h1 class="text-3xl font-black text-primary flex items-center justify-center gap-2">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  SPOS
                </h1>
                <p class="text-[10px] tracking-widest text-gray-400 font-semibold uppercase mt-1">— Smart POS Modern —</p>
              </div>
            </div>
            
            {/* Navigasi Utama */}
            <nav id="admin-nav" class="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <p class="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-4">Menu Utama</p>
              
              <a href="/admin" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-medium text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Dashboard
              </a>
              
              <a href="/admin/orders" class="nav-link flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-medium text-sm">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                  Transaksi (POS)
                </div>
              </a>

              <a href="/admin/menus" class="nav-link flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-medium text-sm">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  Produk & Stok
                </div>
              </a>

              <a href="/admin/users" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-medium text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Pelanggan (CRM)
              </a>

              <a href="/admin/restaurants" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-medium text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                Mitra Restoran
              </a>

              <p class="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-6">Pengaturan</p>
              
              <a href="/admin/change-password" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-medium text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Ubah Password
              </a>
            </nav>
            
            {/* Support Widget */}
            <div class="p-4">
              <div class="bg-gray-50 dark:bg-darkbg rounded-xl p-4 text-center border border-gray-100 dark:border-darkborder">
                <button class="w-full bg-darkpanel dark:bg-gray-800 text-white font-medium py-2 rounded-lg text-sm mb-2 hover:bg-gray-700 transition-colors shadow-sm">
                  Chat Me
                </button>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Have a problem? <strong class="text-gray-700 dark:text-gray-300">DON'T WORRY</strong> please contact us.
                </p>
              </div>
              <p class="text-[10px] text-gray-400 text-center mt-4 mb-2">SPOS - Smart POS Modern<br/>© 2026 All Rights Reserved.</p>
              
              <a href="/admin/logout" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Keluar
              </a>
            </div>
          </aside>

          {/* KONTEN UTAMA */}
          <div class="flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-[#0B1120]">
            <header class="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-darkborder bg-white dark:bg-darkpanel z-10">
              <div class="flex items-center gap-3 min-w-0">
                <label for="sidebar-toggle" class="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer md:hidden">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </label>
              </div>
              
              {/* Toolbar Kanan */}
              <div class="flex items-center gap-4">
                {/* Switcher Tema (Warna) */}
                <select id="theme-color-select" class="bg-gray-50 dark:bg-darkbg text-xs border border-gray-200 dark:border-darkborder rounded-lg px-2 py-1.5 outline-none cursor-pointer dark:text-white">
                  <option value="theme-emerald">Emerald (Green)</option>
                  <option value="theme-blue">Blue Ocean</option>
                  <option value="theme-orange">Shopee Orange</option>
                  <option value="theme-purple">Royal Purple</option>
                </select>

                {/* Switcher Dark/Light */}
                <button id="theme-toggle" class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
                  <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                  <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>
                </button>
                
                <div class="h-6 w-px bg-gray-200 dark:bg-darkborder"></div>
                
                <div class="flex items-center gap-2 cursor-pointer">
                  <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">A</div>
                  <span class="text-sm font-medium hidden sm:block dark:text-gray-200">Admin</span>
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </header>

            <main class="flex-1 overflow-auto p-4 md:p-6">
              <div class="max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Script UI Interaktif (Menu Active State & Theme Toggle) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', () => {
              // 1. Setup Menu Aktif
              const currentPath = window.location.pathname;
              const links = document.querySelectorAll('.nav-link');
              links.forEach(link => {
                const href = link.getAttribute('href');
                if(href === currentPath || (currentPath.startsWith(href) && href !== '/admin')) {
                  link.classList.add('bg-primary/10', 'text-primary', 'dark:bg-primary/20', 'dark:text-primary');
                  link.classList.remove('text-gray-600', 'dark:text-gray-400');
                }
              });

              // 2. Setup Mode Terang/Gelap
              const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
              const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
              
              if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                themeToggleLightIcon.classList.remove('hidden');
              } else {
                document.documentElement.classList.remove('dark');
                themeToggleDarkIcon.classList.remove('hidden');
              }

              document.getElementById('theme-toggle').addEventListener('click', function() {
                themeToggleDarkIcon.classList.toggle('hidden');
                themeToggleLightIcon.classList.toggle('hidden');
                if (localStorage.getItem('color-theme')) {
                  if (localStorage.getItem('color-theme') === 'light') {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                  }
                } else {
                  if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                  }
                }
              });

              // 3. Setup Tema Warna
              const colorSelect = document.getElementById('theme-color-select');
              const savedColorTheme = localStorage.getItem('app-color-theme') || 'theme-emerald';
              document.documentElement.classList.add(savedColorTheme);
              colorSelect.value = savedColorTheme;

              colorSelect.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                document.documentElement.classList.remove('theme-emerald', 'theme-blue', 'theme-orange', 'theme-purple');
                document.documentElement.classList.add(newTheme);
                localStorage.setItem('app-color-theme', newTheme);
                
                // Trigger event untuk Chart.js agar merender ulang dengan warna baru
                window.dispatchEvent(new Event('theme-changed'));
              });
            });
          `
        }} />
      </body>
    </html>
  )
})

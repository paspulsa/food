import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="id" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'Sistem Kasir - SPOS Modern'}</title>
        
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

        <style dangerouslySetInnerHTML={{
          __html: `
            :root { --color-primary: 238 77 45; }
            .theme-emerald { --color-primary: 16 185 129; }
            .theme-blue { --color-primary: 59 130 246; }
            .theme-orange { --color-primary: 238 77 45; }
            .theme-purple { --color-primary: 139 92 246; }
            .theme-ruby { --color-primary: 224 17 95; }
            
            body { font-family: 'Inter', sans-serif; }
            ::-webkit-scrollbar { width: 6px; height: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
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
      <body class="bg-gray-50 text-gray-900 dark:bg-darkbg dark:text-gray-100 antialiased transition-colors duration-300 overflow-hidden">
        <div class="flex h-screen w-full relative">
          
          <input type="checkbox" id="sidebar-toggle" class="peer hidden" />
          <label for="sidebar-toggle" class="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto"></label>

          {/* SIDEBAR */}
          <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-darkpanel border-r border-gray-200 dark:border-darkborder flex flex-col transform -translate-x-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 peer-checked:translate-x-0">
            <div class="h-20 flex items-center justify-center border-b border-gray-100 dark:border-darkborder">
              <div class="text-center">
                <h1 class="text-3xl font-black text-primary flex items-center justify-center gap-2">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  POS
                </h1>
                <p class="text-[10px] tracking-widest text-gray-400 font-bold uppercase mt-1">— Terminal Kasir —</p>
              </div>
            </div>
            
            <nav id="cashier-nav" class="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <p class="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-2">Operasional</p>
              
              <a href="/cashier" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-bold text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Dashboard Shift
              </a>
              <a href="/cashier/tables" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-bold text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Manajemen Meja
              </a>
              <a href="/cashier/stocks" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-bold text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                Cek Stok & Aset
              </a>

              <p class="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-4">Rekapitulasi</p>
              
              {/* PERBAIKAN: MENU LAPORAN DIKEMBALIKAN KE SINI */}
              <a href="/cashier/report" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-primary dark:hover:text-primary transition-all font-bold text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Laporan Penjualan
              </a>

            </nav>

            <div class="p-4 border-t border-gray-100 dark:border-darkborder">
              <a href="/admin/logout" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Keluar (Logout)
              </a>
            </div>
          </aside>

          {/* KONTEN UTAMA */}
          <div class="flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-[#0B1120]">
            <header class="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-darkborder bg-white dark:bg-darkpanel z-10 shrink-0">
              <div class="flex items-center gap-4 min-w-0">
                <label for="sidebar-toggle" class="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer md:hidden">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </label>
                <span class="font-bold text-gray-700 dark:text-gray-200 hidden sm:block">Layar Operasional Kasir</span>
              </div>
              
              <div class="flex items-center gap-4">
                <select id="theme-color-select" class="bg-gray-50 dark:bg-darkbg text-xs border border-gray-200 dark:border-darkborder rounded-lg px-2 py-1.5 outline-none cursor-pointer dark:text-white font-bold">
                  <option value="theme-orange">Shopee Orange (Default)</option>
                  <option value="theme-emerald">Emerald Green</option>
                  <option value="theme-blue">Blue Ocean</option>
                  <option value="theme-purple">Royal Purple</option>
                  <option value="theme-ruby">Ruby Red</option>
                </select>

                <button id="theme-toggle" class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
                  <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                  <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>
                </button>
              </div>
            </header>

            <main class="flex-1 overflow-y-auto p-4 md:p-6">
              <div class="max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', () => {
              const currentPath = window.location.pathname;
              const links = document.querySelectorAll('.nav-link');
              links.forEach(link => {
                const href = link.getAttribute('href');
                if(href === currentPath || (currentPath.startsWith(href) && href !== '/cashier')) {
                  link.classList.add('bg-primary/10', 'text-primary', 'dark:bg-primary/20', 'dark:text-primary');
                  link.classList.remove('text-gray-600', 'dark:text-gray-400');
                }
              });

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

              const colorSelect = document.getElementById('theme-color-select');
              const savedColorTheme = localStorage.getItem('cashier-color-theme') || 'theme-orange';
              document.documentElement.classList.add(savedColorTheme);
              colorSelect.value = savedColorTheme;

              colorSelect.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                document.documentElement.classList.remove('theme-emerald', 'theme-blue', 'theme-orange', 'theme-purple', 'theme-ruby');
                document.documentElement.classList.add(newTheme);
                localStorage.setItem('cashier-color-theme', newTheme);
              });
            });
          `
        }} />
      </body>
    </html>
  )
})

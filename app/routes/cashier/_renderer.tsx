import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: '<!DOCTYPE html>' }} />
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{title || 'Sistem Kasir - KPKembar'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          <script dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: { extend: { colors: { primary: '#eab308' } } }
              }
            `
          }} />
        </head>
        <body class="bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden">
          <div class="flex h-screen w-full relative">
            
            <input type="checkbox" id="sidebar-toggle" class="peer hidden" />
            <label for="sidebar-toggle" class="fixed inset-0 bg-black/60 z-40 md:hidden opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity"></label>

            <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform -translate-x-full md:relative md:translate-x-0 peer-checked:translate-x-0 transition-transform duration-300">
              <div class="h-20 flex items-center justify-center border-b border-gray-100">
                <h1 class="text-2xl font-black text-yellow-500 flex items-center gap-2">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  POS Kasir
                </h1>
              </div>
              
              <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                <p class="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Menu Operasional</p>
                
                <a href="/cashier" class="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 font-bold text-sm transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                  Dashboard Shift
                </a>
                <a href="/cashier/tables" class="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 font-bold text-sm transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  Manajemen Meja
                </a>
                <a href="/cashier/stocks" class="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 font-bold text-sm transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                  Cek Stok & Aset
                </a>
              </nav>
            </aside>

            <div class="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
              <header class="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 z-10 shrink-0">
                <div class="flex items-center gap-4">
                  <label for="sidebar-toggle" class="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer md:hidden">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </label>
                  <span class="font-bold text-gray-700 hidden sm:block">Layar Operasional Kasir</span>
                </div>
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-black">K</div>
                </div>
              </header>

              <main class="flex-1 overflow-y-auto p-4 md:p-6">
                <div class="max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>

          </div>
        </body>
      </html>
    </>
  )
})

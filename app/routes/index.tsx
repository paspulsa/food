import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Ornamen Latar Belakang (Aksen) */}
      <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#ee4d2d] opacity-[0.03] dark:opacity-[0.02] rounded-full blur-3xl"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 opacity-[0.03] dark:opacity-[0.02] rounded-full blur-3xl"></div>

      {/* Header Logo & Judul */}
      <div class="text-center mb-12 relative z-10">
        <div class="w-24 h-24 bg-[#ee4d2d] rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-[#ee4d2d]/30 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <h1 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">KPKembar <span class="text-[#ee4d2d]">RMS</span></h1>
        <p class="text-gray-500 dark:text-gray-400 font-bold mt-3 uppercase tracking-widest text-sm">Restaurant Management System</p>
      </div>

      {/* Grid Portal Utama */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl relative z-10">
        
        {/* 1. Portal Admin */}
        <a href="/admin" class="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-b-4 border-blue-500 hover:border-blue-600 flex flex-col items-center text-center">
           <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
             <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
           </div>
           <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">Backoffice Admin</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Kelola menu, pengguna, promo, serta laporan penjualan harian.</p>
        </a>

        {/* 2. Portal Kasir */}
        <a href="/cashier" class="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-b-4 border-yellow-500 hover:border-yellow-600 flex flex-col items-center text-center">
           <div class="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
             <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           </div>
           <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">Layar Kasir</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Verifikasi pembayaran tunai & kelola antrean uang masuk.</p>
        </a>

        {/* 3. Portal Dapur (KDS) */}
        <a href="/kitchen" class="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-b-4 border-[#ee4d2d] hover:border-orange-600 flex flex-col items-center text-center">
           <div class="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 text-[#ee4d2d] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
             <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
           </div>
           <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">Kitchen (KDS)</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Layar antrean rincian masakan khusus untuk para Koki (Chef).</p>
        </a>

        {/* 4. Portal Waiter */}
        <a href="/waiter" class="group bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-b-4 border-green-500 hover:border-green-600 flex flex-col items-center text-center">
           <div class="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
             <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
           </div>
           <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">Portal Waiter</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Pantau pesanan yang siap & konfirmasi pengantaran ke meja.</p>
        </a>

      </div>

      {/* Footer Info */}
      <div class="mt-16 text-center relative z-10">
        <p class="text-xs font-bold text-gray-400 dark:text-gray-600 flex items-center justify-center gap-2">
           <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           Seluruh sistem operasi sedang berjalan normal
        </p>
        <p class="text-[10px] font-bold text-gray-400 dark:text-gray-600 mt-2">
           &copy; 2026 Kedai Pangsit Kembar 88. Terproteksi Otorisasi Karyawan.
        </p>
      </div>

    </div>,
    { title: 'Portal Utama - KPKembar RMS' }
  )
})

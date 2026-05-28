import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'

export default createRoute(async (c) => {
  const shiftActive = getCookie(c, 'shift_cashier');
  if (!shiftActive) return c.redirect('/cashier');

  const db = c.env.DB;
  const { results: todaySales } = await db.prepare(`
    SELECT payment_method, total_price, status 
    FROM orders 
    WHERE date(created_at, '+8 hours') = date('now', '+8 hours') 
    AND status NOT IN ('CANCELLED', 'PENDING')
  `).all();

  let totalCash = 0; let totalQris = 0; let totalOrdersToday = todaySales.length;
  todaySales.forEach((sale: any) => {
      if (sale.payment_method === 'CASH') totalCash += sale.total_price;
      if (sale.payment_method === 'QRIS') totalQris += sale.total_price;
  });

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* NAVBAR PWA */}
      <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
         <div class="flex items-center gap-6">
            <h1 class="font-black text-xl text-yellow-600 flex items-center gap-2">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               Super Kasir
            </h1>
            <div class="hidden md:flex gap-2">
               <a href="/cashier" class="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors">Antrean Bayar</a>
               <a href="/cashier/tables" class="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors">Manajemen Meja</a>
               <a href="/cashier/report" class="px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 font-bold border border-yellow-200 dark:border-yellow-800">Laporan Keuangan</a>
            </div>
         </div>
         <button onclick="endShift()" class="text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">Akhiri Shift</button>
      </nav>

      <div class="max-w-7xl mx-auto px-6 py-8">
         <div class="mb-8">
           <h2 class="text-2xl font-black text-gray-800 dark:text-white">📊 Rekap Shift Hari Ini</h2>
           <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Uang yang harus disetorkan dari laci dan total pesanan yang sukses diproses.</p>
         </div>

         <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
               <svg class="absolute -bottom-4 -right-4 w-40 h-40 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
               <p class="font-black text-green-100 mb-2 uppercase tracking-widest text-sm">Uang Tunai Laci (Wajib Setor)</p>
               <h3 class="text-5xl font-black">{formatter.format(totalCash)}</h3>
            </div>

            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
               <svg class="absolute -bottom-4 -right-4 w-40 h-40 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               <p class="font-black text-blue-100 mb-2 uppercase tracking-widest text-sm">Pemasukan QRIS (Online)</p>
               <h3 class="text-5xl font-black">{formatter.format(totalQris)}</h3>
            </div>

            <div class="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
               <p class="font-black text-gray-400 mb-2 uppercase tracking-widest text-sm">Total Transaksi Sukses</p>
               <h3 class="text-5xl font-black text-gray-900 dark:text-white">{totalOrdersToday} <span class="text-xl font-bold text-gray-400">Order</span></h3>
            </div>
         </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function endShift() {
           await fetch('/cashier', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action: 'end_shift'}) });
           window.location.href = '/cashier';
        }
      `}} />
    </div>
  , { title: 'Laporan - PWA Kasir' })
})

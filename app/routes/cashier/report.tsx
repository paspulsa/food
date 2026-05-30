import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // ==========================================
  // 1. PROTEKSI OTORISASI (PERBAIKAN FATAL)
  // ==========================================
  const token = getCookie(c, 'admin_token');
  if (!token) return c.redirect('/login');

  let currentRole = '';
  let cashierName = '';

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    // PERBAIKAN: Berikan izin akses untuk CASHIER agar tidak ditendang ke /login!
    if (payload.role !== 'ADMIN' && payload.role !== 'CASHIER') {
        return c.redirect('/login');
    }
    currentRole = payload.role as string;
    cashierName = payload.name as string;
  } catch (e) {
    return c.redirect('/login');
  }

  const db = c.env.DB;
  
  // ==========================================
  // 2. AMBIL DATA LAPORAN HARI INI
  // ==========================================
  let completedOrders: any[] = [];
  let totalRevenue = 0;
  let totalCash = 0;
  let totalDigital = 0;
  let totalOrders = 0;

  try {
      // Mengambil transaksi yang sudah selesai (COMPLETED) pada hari ini
      const { results } = await db.prepare(`
         SELECT id, COALESCE(guest_name, 'Tamu') as customer_name, total_price, payment_method, updated_at 
         FROM orders 
         WHERE status = 'COMPLETED' AND date(created_at) = date('now', 'localtime')
         ORDER BY updated_at DESC
      `).all();
      
      completedOrders = results || [];
      totalOrders = completedOrders.length;
      
      completedOrders.forEach((o: any) => {
          const price = Number(o.total_price) || 0;
          totalRevenue += price;
          if(String(o.payment_method).toUpperCase() === 'CASH') {
              totalCash += price;
          } else {
              totalDigital += price;
          }
      });
  } catch (e) {
      console.error("Gagal memuat laporan kasir:", e);
  }

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 pb-12">
       {/* HEADER LAPORAN */}
       <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder">
          <div>
             <h2 class="text-2xl font-black text-gray-800 dark:text-white">Laporan Penjualan Harian</h2>
             <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                Dicetak oleh: <span class="font-bold text-primary">{cashierName}</span> ({currentRole})
             </p>
          </div>
          <button onclick="window.print()" class="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
             Cetak Laporan
          </button>
       </div>

       {/* KARTU STATISTIK */}
       <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder relative overflow-hidden">
             <div class="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full"></div>
             <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pendapatan</p>
             <p class="text-3xl font-black text-primary mt-2">{formatter.format(totalRevenue)}</p>
          </div>
          
          <div class="bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder relative overflow-hidden">
             <div class="absolute -right-4 -top-4 w-16 h-16 bg-green-500/10 rounded-full"></div>
             <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Uang Fisik (Cash)</p>
             <p class="text-3xl font-black text-green-500 mt-2">{formatter.format(totalCash)}</p>
          </div>
          
          <div class="bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder relative overflow-hidden">
             <div class="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full"></div>
             <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Uang Digital (QRIS)</p>
             <p class="text-3xl font-black text-blue-500 mt-2">{formatter.format(totalDigital)}</p>
          </div>

          <div class="bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder relative overflow-hidden">
             <div class="absolute -right-4 -top-4 w-16 h-16 bg-gray-500/10 rounded-full"></div>
             <p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pesanan Sukses</p>
             <p class="text-3xl font-black text-gray-800 dark:text-gray-100 mt-2">{totalOrders} <span class="text-base text-gray-400 font-medium">Order</span></p>
          </div>
       </div>

       {/* TABEL RINCIAN TRANSAKSI */}
       <div class="bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder">
          <h3 class="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
             <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             Riwayat Transaksi Sukses (Hari Ini)
          </h3>
          <div class="overflow-x-auto min-h-[300px]">
             <table class="w-full text-left whitespace-nowrap">
                <thead>
                   <tr class="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">
                      <th class="px-4 py-3 rounded-tl-lg font-bold">Detail Pelanggan</th>
                      <th class="px-4 py-3 font-bold">Waktu Selesai</th>
                      <th class="px-4 py-3 font-bold text-center">Metode Pembayaran</th>
                      <th class="px-4 py-3 rounded-tr-lg font-bold text-right">Nominal</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                   {completedOrders.length === 0 ? (
                      <tr><td colspan="4" class="px-4 py-16 text-center text-gray-400 font-bold italic">Belum ada transaksi sukses yang tercatat hari ini.</td></tr>
                   ) : completedOrders.map((o: any) => {
                      const isCash = String(o.payment_method).toUpperCase() === 'CASH';
                      return (
                      <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                         <td class="px-4 py-4">
                            <p class="font-black text-gray-800 dark:text-gray-200 text-xs">{o.customer_name}</p>
                            <p class="font-mono text-[9px] text-gray-400 mt-0.5">{o.id}</p>
                         </td>
                         <td class="px-4 py-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {new Date(o.updated_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                         </td>
                         <td class="px-4 py-4 text-center">
                            <span class={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${isCash ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-800'}`}>
                               {o.payment_method}
                            </span>
                         </td>
                         <td class="px-4 py-4 text-right font-black text-primary text-sm">
                            {formatter.format(o.total_price)}
                         </td>
                      </tr>
                   )})}
                </tbody>
             </table>
          </div>
       </div>

       {/* Kustomisasi gaya saat di-print */}
       <style dangerouslySetInnerHTML={{ __html: `
          @media print {
             body { background-color: white !important; }
             nav, aside, button, select { display: none !important; }
             .shadow-sm, .shadow-md, .shadow-2xl { box-shadow: none !important; }
             .border-gray-100 { border-color: #e5e7eb !important; }
             * { color: black !important; }
             .text-primary, .text-green-500, .text-blue-500 { color: black !important; }
          }
       `}} />
    </div>
  , { title: 'Laporan Penjualan - Terminal Kasir' })
})

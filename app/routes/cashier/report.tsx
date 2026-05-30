import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // ==========================================
  // 1. PROTEKSI OTORISASI
  // ==========================================
  const token = getCookie(c, 'admin_token');
  if (!token) return c.redirect('/login');

  let currentRole = '';
  let cashierName = '';

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
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
    <div class="space-y-6 pb-12 w-full max-w-full">
       
       {/* CSS KHUSUS PRINT MODE (MEMBONGKAR LAYOUT WEB MENJADI KERTAS A4) */}
       <style dangerouslySetInnerHTML={{ __html: `
          @media print {
             @page { size: A4 portrait; margin: 15mm; }
             
             /* 1. HANCURKAN RESTRUKTURISASI TAMPILAN WEB (Scroll & Fixed Heights dari Renderer) */
             html, body, .h-screen, main, .overflow-hidden, .overflow-y-auto {
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
                position: static !important;
                width: 100% !important;
             }
             
             /* 2. SEMBUNYIKAN ELEMEN YANG TIDAK PERLU DI KERTAS */
             aside, header, button, .md\\:hidden { 
                display: none !important; 
             }

             /* 3. RESET WARNA KE HITAM PUTIH STANDAR KERTAS & HAPUS BACKGROUND GELAP */
             body, main, .bg-gray-100, .bg-gray-50, .dark\\:bg-darkbg, .dark\\:bg-\\[\\#0B1120\\] { background: white !important; }
             .bg-white, .dark\\:bg-darkpanel { background: white !important; border: 1px solid #e5e7eb !important; }
             
             /* 4. MENGHILANGKAN EFEK BAYANGAN DAN MEMAKSA TEKS HITAM PADA AREA LAPORAN */
             * { color: black !important; text-shadow: none !important; box-shadow: none !important; }

             /* 5. FORMAT KARTU STATISTIK AGAR TERTATA RAPI (Grid 2 Kolom di Kertas) */
             .grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; page-break-inside: avoid; }
             .rounded-2xl { border-radius: 8px !important; }

             /* 6. BIKIN TABEL BISA MULTI-PAGE & LEBAR PENUH */
             .overflow-x-auto { overflow: visible !important; }
             table { width: 100% !important; border-collapse: collapse !important; margin-top: 20px !important; }
             thead { display: table-header-group !important; }
             tr { page-break-inside: avoid !important; }
             th, td { border-bottom: 1px solid #ccc !important; padding: 12px 8px !important; white-space: normal !important; text-align: left !important; }
             th { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold !important; border-bottom: 2px solid #000 !important; }
             
             /* 7. SEMBUNYIKAN BACKGROUND HIASAN DI POJOK KARTU */
             .absolute.w-16.h-16 { display: none !important; }
          }
       `}} />

       {/* HEADER LAPORAN */}
       <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder print:border-none print:p-0 print:mb-6">
          <div class="w-full">
             <h2 class="text-2xl font-black text-gray-800 dark:text-white print:text-3xl print:text-center print:border-b-2 print:border-black print:pb-4">Laporan Penjualan Harian</h2>
             <div class="flex justify-between items-center w-full mt-2 print:mt-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                   Dicetak oleh: <span class="font-bold text-primary">{cashierName}</span> ({currentRole})
                </p>
                <p class="text-sm font-bold text-gray-500 hidden print:block">
                   Tanggal: {new Date().toLocaleDateString('id-ID')}
                </p>
             </div>
          </div>
          <button onclick="window.print()" class="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 text-sm flex-shrink-0">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
             Cetak PDF
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
       <div class="bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder mt-6">
          <h3 class="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2 print:text-xl print:mt-4 print:mb-6">
             <svg class="w-5 h-5 text-primary print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             Riwayat Transaksi Sukses (Hari Ini)
          </h3>
          <div class="overflow-x-auto min-h-[300px] w-full">
             <table class="w-full text-left whitespace-nowrap table-auto">
                <thead>
                   <tr class="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">
                      <th class="px-4 py-3 rounded-tl-lg font-bold">ID Transaksi</th>
                      <th class="px-4 py-3 font-bold">Pelanggan</th>
                      <th class="px-4 py-3 font-bold">Waktu Selesai</th>
                      <th class="px-4 py-3 font-bold text-center">Metode Pembayaran</th>
                      <th class="px-4 py-3 rounded-tr-lg font-bold text-right">Nominal</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                   {completedOrders.length === 0 ? (
                      <tr><td colspan="5" class="px-4 py-16 text-center text-gray-400 font-bold italic border-b-0">Belum ada transaksi sukses yang tercatat hari ini.</td></tr>
                   ) : completedOrders.map((o: any) => {
                      const isCash = String(o.payment_method).toUpperCase() === 'CASH';
                      return (
                      <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors break-inside-avoid">
                         <td class="px-4 py-4 align-middle">
                            <p class="font-mono text-[10px] text-gray-500 dark:text-gray-400">{o.id}</p>
                         </td>
                         <td class="px-4 py-4 align-middle">
                            <p class="font-black text-gray-800 dark:text-gray-200 text-xs">{o.customer_name}</p>
                         </td>
                         <td class="px-4 py-4 text-xs text-gray-500 dark:text-gray-400 font-medium align-middle">
                            {new Date(o.updated_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                         </td>
                         <td class="px-4 py-4 text-center align-middle">
                            <span class={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider print:border-none print:bg-transparent ${isCash ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-800'}`}>
                               {o.payment_method}
                            </span>
                         </td>
                         <td class="px-4 py-4 text-right font-black text-primary text-sm align-middle print:text-black">
                            {formatter.format(o.total_price)}
                         </td>
                      </tr>
                   )})}
                </tbody>
             </table>
          </div>
       </div>

    </div>
  , { title: 'Laporan Penjualan - Terminal Kasir' })
})

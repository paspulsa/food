import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'

export default createRoute(async (c) => {
  const db = c.env.DB;
  const shiftId = getCookie(c, 'current_shift_id');

  // ==========================================
  // UI 1: LOCK SCREEN (BUKA SHIFT & ABSENSI)
  // ==========================================
  if (!shiftId) {
    const { results: staffList } = await db.prepare("SELECT id, name, role FROM users WHERE role IN ('KITCHEN', 'WAITER') ORDER BY role ASC").all();

    return c.render(
      <div class="h-full flex items-center justify-center p-4 py-10">
        <div class="bg-white dark:bg-darkpanel p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-darkborder max-w-4xl w-full flex flex-col md:flex-row gap-8 overflow-hidden relative">
           
           {/* Kiri: Modal Kas */}
           <div class="flex-1 space-y-6 relative z-10">
             <div class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 shadow-sm">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             </div>
             <div>
               <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Terminal Kasir</h2>
               <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Masukkan modal awal dan catat absensi pekerja shift ini.</p>
             </div>
             
             <div class="space-y-4">
               <div>
                 <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Uang Fisik Laci (Tunai)</label>
                 <div class="relative">
                   <span class="absolute inset-y-0 left-4 flex items-center text-gray-500 dark:text-gray-400 font-bold">Rp</span>
                   <input type="number" id="start-cash" value="0" class="w-full bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-xl font-black text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                 </div>
               </div>
               <div>
                 <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Saldo Digital (QRIS/E-Wallet)</label>
                 <div class="relative">
                   <span class="absolute inset-y-0 left-4 flex items-center text-gray-500 dark:text-gray-400 font-bold">Rp</span>
                   <input type="number" id="start-app" value="0" class="w-full bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-xl font-black text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all" />
                 </div>
               </div>
             </div>
           </div>

           {/* Kanan: Checklist Absensi */}
           <div class="flex-1 bg-gray-50 dark:bg-darkbg p-6 rounded-2xl border border-gray-200 dark:border-gray-700 h-[380px] overflow-y-auto flex flex-col relative z-10 hide-scrollbar">
             <div class="sticky top-0 bg-gray-50 dark:bg-darkbg pb-3 border-b border-gray-200 dark:border-gray-700 mb-3 z-20">
                <h3 class="font-black text-sm text-gray-800 dark:text-gray-200">Absensi Pegawai Shift Ini</h3>
             </div>
             
             <div class="space-y-3" id="staff-checklist">
               {staffList.length === 0 ? (
                 <p class="text-xs text-gray-400 italic text-center py-5">Tidak ada staf Waiter/Kitchen yang terdaftar.</p>
               ) : staffList.map((s: any) => (
                 <label class="flex items-center gap-4 p-4 bg-white dark:bg-darkpanel border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary dark:hover:border-primary shadow-sm transition-colors group">
                   <input type="checkbox" value={s.id} class="w-5 h-5 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary dark:bg-gray-800" />
                   <div>
                     <p class="font-bold text-sm text-gray-900 dark:text-white leading-none">{s.name}</p>
                     <p class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 mt-1">{s.role}</p>
                   </div>
                 </label>
               ))}
             </div>
           </div>
           
           <div class="w-full pt-6 border-t border-gray-100 dark:border-darkborder mt-4 col-span-full md:absolute md:bottom-8 md:left-8 md:right-8 md:w-auto md:border-none md:mt-0 md:pt-0 pointer-events-none hidden md:block">
           </div>

        </div>
        
        {/* Tombol Utama Buka Shift */}
        <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-6 z-50">
            <button onclick="startShift()" class="w-full bg-primary hover:opacity-90 text-white text-lg font-black py-4 rounded-2xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Buka Shift & Mulai Sistem
            </button>
        </div>
        
        <script dangerouslySetInnerHTML={{ __html: `
          async function startShift() {
             const startCash = document.getElementById('start-cash').value;
             const startApp = document.getElementById('start-app').value;
             const checkedBoxes = document.querySelectorAll('#staff-checklist input:checked');
             const activeStaff = Array.from(checkedBoxes).map(cb => cb.value);

             Swal.fire({
               title: 'Mulai Shift?',
               text: 'Sistem akan merekam modal kas dan snapshot bahan baku secara otomatis.',
               icon: 'info', 
               showCancelButton: true, 
               confirmButtonColor: 'var(--color-primary, #eab308)', 
               confirmButtonText: 'Mulai Sekarang',
               background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
               color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
             }).then(async (result) => {
                if(result.isConfirmed) {
                  const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
                  if (!token) return Swal.fire('Error', 'Sesi login kedaluwarsa.', 'error');

                  Swal.fire({ title: 'Memproses...', allowOutsideClick: false, background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff', didOpen: () => { Swal.showLoading() } });

                  try {
                      // TEMBAK KE API BACKEND
                      const res = await fetch('/api/v1/protected/ops/shift/start', { 
                        method: 'POST', 
                        headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }, 
                        body: JSON.stringify({ start_cash: startCash, start_app: startApp, active_staff: activeStaff }) 
                      });
                      const data = await res.json();
                      
                      if(data.success) {
                         // Set cookie shift manual di frontend untuk memicu reload page ke Dashboard Shift
                         document.cookie = "current_shift_id=" + data.shift_id + "; path=/; max-age=86400;";
                         window.location.reload();
                      } else {
                         Swal.fire('Gagal', data.message, 'error');
                      }
                  } catch(e) {
                      Swal.fire('Error', 'Gangguan koneksi ke server.', 'error');
                  }
                }
             })
          }
        `}} />
      </div>
    , { title: 'Buka Shift - Terminal Kasir' })
  }

  // ==========================================
  // UI 2: DASHBOARD (SHIFT AKTIF)
  // ==========================================
  const { results: activeOrders } = await db.prepare(`SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.total_price, o.payment_method, o.status, o.kitchen_status FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.status != 'COMPLETED' AND o.status != 'CANCELLED' ORDER BY o.created_at ASC`).all();
  
  const { results: activeAttendance } = await db.prepare(`SELECT * FROM shift_attendance WHERE shift_id = ? AND status = 'ACTIVE'`).bind(shiftId).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 pb-12">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder">
         <div>
            <h2 class="text-2xl font-black text-gray-800 dark:text-white">Dashboard Shift Aktif</h2>
            <p class="text-sm font-bold text-primary mt-1 font-mono tracking-wider">ID SESI: {shiftId}</p>
         </div>
         <button onclick="closeShift()" class="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Tutup Sesi (End Shift)
         </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
         {/* KIRI: PEGAWAI AKTIF */}
         <div class="xl:col-span-1 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder self-start">
            <h3 class="text-lg font-black text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
               <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
               Pegawai On-Duty
            </h3>
            <div class="space-y-3">
               {activeAttendance.length === 0 ? <p class="text-xs text-gray-400 font-bold italic text-center py-4">Tidak ada staf yang diabsen.</p> : activeAttendance.map((a: any) => (
                  <div class="flex justify-between items-center bg-gray-50 dark:bg-darkbg p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                     <div>
                       <p class="font-bold text-sm text-gray-800 dark:text-gray-200">{a.staff_name}</p>
                       <p class="text-[9px] font-black uppercase text-green-500 mt-0.5">{a.role} • Masuk: {new Date(a.clock_in).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                     </div>
                     <button onclick={`kickStaff('${a.id}', '${a.staff_name}')`} class="bg-red-50 dark:bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Keluarkan
                     </button>
                  </div>
               ))}
            </div>
         </div>

         {/* KANAN: ORDER AKTIF */}
         <div class="xl:col-span-2 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder">
            <h3 class="text-lg font-black text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
               <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
               Kendali Transaksi & Dapur
            </h3>
            <div class="overflow-x-auto min-h-[300px]">
              <table class="w-full text-left whitespace-nowrap">
                <thead>
                  <tr class="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider">
                    <th class="px-4 py-3 rounded-tl-lg font-bold">Pesanan</th>
                    <th class="px-4 py-3 font-bold">Tagihan / Tipe</th>
                    <th class="px-4 py-3 font-bold">Status Utama</th>
                    <th class="px-4 py-3 rounded-tr-lg font-bold text-right">Aksi Terusan</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  {activeOrders.length === 0 ? (
                    <tr><td colspan="4" class="px-4 py-10 text-center text-gray-400 font-bold italic">Sistem bersih, tidak ada order aktif.</td></tr>
                  ) : activeOrders.map((o: any) => {
                     const isUnpaidCash = o.payment_method === 'CASH' && o.status === 'PENDING';
                     const isProcessing = o.status === 'PROCESSING';
                     const isReady = o.kitchen_status === 'READY';
                     const isDelivering = o.status === 'DELIVERING';

                     return (
                       <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                         <td class="px-4 py-4">
                            <p class="font-black text-gray-800 dark:text-gray-200 text-xs">{o.customer_name}</p>
                            <p class="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold font-mono">{o.id}</p>
                         </td>
                         <td class="px-4 py-4">
                            <p class="font-black text-primary text-xs">{formatter.format(o.total_price)}</p>
                            <p class="text-[9px] text-gray-500 dark:text-gray-400 font-bold mt-0.5">{o.table_id || 'Bawa Pulang'} • {o.payment_method}</p>
                         </td>
                         <td class="px-4 py-4">
                            {/* BADGE STATUS UTAMA */}
                            {isUnpaidCash ? (
                               <span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/50">MENUNGGU UANG (CASH)</span>
                            ) : isProcessing ? (
                               <span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shadow-sm border border-yellow-100 dark:border-yellow-900/50">DAPUR: {o.kitchen_status}</span>
                            ) : isDelivering ? (
                               <span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/50">SEDANG DIANTAR</span>
                            ) : (
                               <span class="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600">{o.status}</span>
                            )}
                         </td>
                         <td class="px-4 py-4">
                            <div class="flex gap-1.5 justify-end items-center">
                               {/* 1. TOMBOL TERIMA UANG (CASH) */}
                               {isUnpaidCash && (
                                  <button onclick={`verifyPayment('${o.id}')`} class="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1">
                                     <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> 
                                     Terima Uang
                                  </button>
                               )}

                               {/* 2. TOMBOL KIRIM KE DAPUR (JIKA KITCHEN_STATUS MASIH WAITING) */}
                               {isProcessing && o.kitchen_status === 'WAITING' && (
                                  <button onclick={`forceStatus('${o.id}', 'PROCESSING', 'PREPARING')`} class="bg-yellow-500 hover:bg-yellow-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1">
                                     <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"></path></svg>
                                     Masak
                                  </button>
                               )}

                               {/* 3. TOMBOL SAJIKAN/ANTAR (JIKA DAPUR SUDAH READY) */}
                               {isProcessing && isReady && (
                                  <button onclick={`forceStatus('${o.id}', 'DELIVERING', 'READY')`} class="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1">
                                     <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 
                                     Antar / Sajikan
                                  </button>
                               )}

                               {/* 4. TOMBOL SELESAI (JIKA SUDAH DIANTAR) */}
                               {isDelivering && (
                                  <button onclick={`forceStatus('${o.id}', 'COMPLETED', 'READY')`} class="bg-gray-800 dark:bg-gray-600 hover:bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1">
                                     <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 
                                     Selesaikan
                                  </button>
                               )}

                               {/* OPSI LAINNYA (DROPDOWN) */}
                               <div class="relative group">
                                  <button class="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                     <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                  </button>
                                  <div class="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 hidden group-hover:block z-50 overflow-hidden text-left">
                                     <button onclick={`forceStatus('${o.id}', 'CANCELLED', 'WAITING')`} class="w-full text-left px-4 py-2.5 text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-b border-gray-50 dark:border-gray-700">Batalkan Pesanan</button>
                                     <button onclick={`forceStatus('${o.id}', 'COMPLETED', 'READY')`} class="w-full text-left px-4 py-2.5 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Selesaikan Paksa</button>
                                  </div>
                               </div>
                            </div>
                         </td>
                       </tr>
                     )
                  })}
                </tbody>
              </table>
            </div>
         </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // HELPER FUNGSI UNTUK MENGAMBIL TEMA (DARK/LIGHT) BUAT SWEETALERT
        function getSwalTheme() {
            return {
               background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
               color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
            };
        }

        // FUNGSI HELPER UNTUK REQUEST API BACKEND
        async function apiRequest(endpoint, bodyData) {
            const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
            if (!token) {
               Swal.fire('Error', 'Sesi kedaluwarsa. Silakan muat ulang halaman.', 'error');
               return { success: false };
            }
            try {
               const res = await fetch('/api/v1/protected/ops' + endpoint, { 
                   method: 'POST', 
                   headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token }, 
                   body: JSON.stringify(bodyData) 
               });
               return await res.json();
            } catch(e) {
               Swal.fire('Error', 'Gangguan koneksi ke server.', 'error');
               return { success: false };
            }
        }

        function kickStaff(attId, name) {
           const theme = getSwalTheme();
           Swal.fire({
             title: 'Izin Keluar Sesi',
             text: \`Alasan \${name} pulang lebih awal?\`,
             input: 'text',
             inputPlaceholder: 'Cth: Sakit, Urusan Keluarga...',
             showCancelButton: true, confirmButtonColor: '#eab308',
             background: theme.background, color: theme.color,
             inputValidator: (value) => { if (!value) return 'Wajib isi alasan!' }
           }).then(async (result) => {
             if (result.isConfirmed) {
                const data = await apiRequest('/shift/kick-staff', { attendance_id: attId, reason: result.value });
                if(data.success) window.location.reload();
             }
           });
        }

        function closeShift() {
           const theme = getSwalTheme();
           Swal.fire({
             title: 'Tutup Sesi & Shift?',
             text: 'Sistem akan membuat laporan penutupan (Semua pekerja aktif akan otomatis di-clock out).',
             icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Tutup Shift Sekarang',
             background: theme.background, color: theme.color
           }).then(async (result) => {
             if (result.isConfirmed) {
                Swal.fire({ title: 'Memproses...', text: 'Membuat laporan akhir...', allowOutsideClick: false, background: theme.background, color: theme.color, didOpen: () => { Swal.showLoading() } });
                
                const shiftId = document.cookie.split('; ').find(row => row.startsWith('current_shift_id='))?.split('=')[1];
                const data = await apiRequest('/shift/close', { shift_id: shiftId });
                
                if(data.success) {
                   document.cookie = "current_shift_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                   Swal.fire({title: 'Selesai', text: data.message, icon: 'success', background: theme.background, color: theme.color}).then(() => window.location.reload());
                } else { 
                   Swal.fire({title: 'Error', text: data.message, icon: 'error', background: theme.background, color: theme.color}); 
                }
             }
           });
        }

        // --- FUNGSI UPDATE STATUS PESANAN BARU ---
        
        function verifyPayment(orderId) {
          const theme = getSwalTheme();
          Swal.fire({
            title: 'Uang Pas Diterima?',
            text: 'Pesanan akan otomatis masuk ke antrean dapur.',
            icon: 'question', showCancelButton: true, confirmButtonColor: '#22c55e', confirmButtonText: 'Ya, Uang Pas!',
            background: theme.background, color: theme.color
          }).then(async (result) => {
            if (result.isConfirmed) {
              const data = await apiRequest('/transactions/pay-cash', { order_id: orderId });
              if(data.success) window.location.reload();
            }
          });
        }

        function forceStatus(orderId, newStatus, newKitchen) {
           const theme = getSwalTheme();
           
           let titleTxt = 'Ubah Status?';
           let colorBtn = '#3b82f6';
           
           if(newStatus === 'CANCELLED') { titleTxt = 'Batalkan Pesanan?'; colorBtn = '#ef4444'; }
           if(newStatus === 'COMPLETED') { titleTxt = 'Selesaikan Pesanan?'; colorBtn = '#1f2937'; }
           if(newStatus === 'DELIVERING') { titleTxt = 'Antar Pesanan?'; colorBtn = '#3b82f6'; }

           Swal.fire({
             title: titleTxt,
             icon: 'warning', showCancelButton: true, confirmButtonColor: colorBtn, confirmButtonText: 'Ya, Lanjutkan',
             background: theme.background, color: theme.color
           }).then(async (result) => {
              if (result.isConfirmed) {
                 const data = await apiRequest('/transactions/force-status', { order_id: orderId, new_status: newStatus, new_kitchen: newKitchen });
                 if(data.success) window.location.reload();
              }
           })
        }
      `}} />
    </div>
  , { title: 'Dashboard Kasir - Aktif' })
})

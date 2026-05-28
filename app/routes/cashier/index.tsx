import { createRoute } from 'honox/factory'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const token = getCookie(c, 'admin_token');
  let cashierName = 'Kasir';
  try { const payload = await verify(token, c.env.JWT_SECRET, 'HS256'); cashierName = payload.name as string; } catch(e){}

  try {
    // 1. BUKA SHIFT & ABSENSI STAF
    if (body.action === 'start_shift') {
      const shiftId = 'SHF-' + crypto.randomUUID().substring(0,8).toUpperCase();
      
      // Catat Sesi Kasir & Modal Awal
      await db.prepare(`INSERT INTO cashier_shifts (id, cashier_name, starting_cash, starting_app_balance) VALUES (?, ?, ?, ?)`).bind(shiftId, cashierName, body.start_cash, body.start_app).run();
      
      // Catat Absensi Staf Terpilih
      if (body.active_staff && Array.isArray(body.active_staff)) {
         for (const staffId of body.active_staff) {
            const staffInfo: any = await db.prepare("SELECT name, role FROM users WHERE id = ?").bind(staffId).first();
            if(staffInfo) {
               await db.prepare("INSERT INTO shift_attendance (id, shift_id, staff_id, staff_name, role) VALUES (?, ?, ?, ?, ?)")
                     .bind(crypto.randomUUID(), shiftId, staffId, staffInfo.name, staffInfo.role).run();
            }
         }
      }

      // Generate Otomatis Snapshot Stok Awal
      await db.prepare(`INSERT INTO shift_stock_snapshots (id, shift_id, snapshot_type, menu_item_id, item_name, stock_quantity) SELECT lower(hex(randomblob(16))), ?, 'START', id, name, stock FROM menu_items`).bind(shiftId).run();

      setCookie(c, 'current_shift_id', shiftId, { path: '/', maxAge: 86400 });
      return c.json({ success: true, message: 'Shift berhasil dibuka!' });
    }

    // 2. KELUARKAN STAF (IZIN PULANG AWAL)
    if (body.action === 'kick_staff') {
      await db.prepare("UPDATE shift_attendance SET clock_out = CURRENT_TIMESTAMP, reason_left = ?, status = 'ENDED' WHERE id = ?")
            .bind(body.reason, body.attendance_id).run();
      return c.json({ success: true, message: 'Staf berhasil diizinkan pulang.' });
    }

    // 3. TUTUP SHIFT & GENERATE LAPORAN
    if (body.action === 'close_shift') {
      const shiftId = getCookie(c, 'current_shift_id');
      
      // Bebaskan sisa staf yang masih aktif
      await db.prepare("UPDATE shift_attendance SET clock_out = CURRENT_TIMESTAMP, reason_left = 'Shift Ditutup Kasir', status = 'ENDED' WHERE shift_id = ? AND status = 'ACTIVE'").bind(shiftId).run();
      
      // Buat Snapshot Stok Akhir
      await db.prepare(`INSERT INTO shift_stock_snapshots (id, shift_id, snapshot_type, menu_item_id, item_name, stock_quantity) SELECT lower(hex(randomblob(16))), ?, 'END', id, name, stock FROM menu_items`).bind(shiftId).run();
      
      // Tutup Sesi Kasir
      await db.prepare("UPDATE cashier_shifts SET end_time = CURRENT_TIMESTAMP, status = 'CLOSED' WHERE id = ?").bind(shiftId).run();
      
      deleteCookie(c, 'current_shift_id', { path: '/' });
      return c.json({ success: true, message: 'Laporan Penutupan Sesi berhasil di-generate!' });
    }

    // 4. TERIMA UANG & UBAH STATUS PAKSA (Orderan)
    if (body.action === 'pay_cash') {
      await db.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(body.order_id).run();
      await db.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
      return c.json({ success: true });
    }
    if (body.action === 'update_order_status') {
      await db.prepare("UPDATE orders SET status = ?, kitchen_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.new_status, body.new_kitchen, body.order_id).run();
      return c.json({ success: true });
    }

    return c.json({ success: false }, 400);
  } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
});

export default createRoute(async (c) => {
  const db = c.env.DB;
  const shiftId = getCookie(c, 'current_shift_id');

  // ==========================================
  // UI 1: LOCK SCREEN (BUKA SHIFT & ABSENSI)
  // ==========================================
  if (!shiftId) {
    const { results: staffList } = await db.prepare("SELECT id, name, role FROM users WHERE role IN ('KITCHEN', 'WAITER') ORDER BY role ASC").all();

    return c.render(
      <div class="h-screen bg-gray-50 flex items-center justify-center p-6">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <div class="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full flex flex-col md:flex-row gap-8">
           
           {/* Kiri: Modal Kas */}
           <div class="flex-1 space-y-4">
             <div class="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
               <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             </div>
             <h2 class="text-2xl font-black text-gray-800">Buka Shift Kasir</h2>
             <p class="text-sm font-medium text-gray-500 mb-4">Masukkan data finansial & absensi sebelum melayani.</p>
             
             <div>
               <label class="block text-xs font-bold text-gray-500 mb-1">Modal Uang di Laci (Tunai)</label>
               <input type="number" id="start-cash" value="0" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-black focus:border-yellow-500 focus:outline-none" />
             </div>
             <div>
               <label class="block text-xs font-bold text-gray-500 mb-1">Saldo Saldo Aplikasi (QRIS/E-Wallet)</label>
               <input type="number" id="start-app" value="0" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-black focus:border-yellow-500 focus:outline-none" />
             </div>
           </div>

           {/* Kanan: Checklist Absensi */}
           <div class="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100 h-[320px] overflow-y-auto">
             <h3 class="font-black text-sm text-gray-800 mb-3 sticky top-0 bg-gray-50 pb-2 border-b border-gray-200">Siapa saja yang masuk shift ini?</h3>
             <div class="space-y-2" id="staff-checklist">
               {staffList.map((s: any) => (
                 <label class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-yellow-500 transition-colors">
                   <input type="checkbox" value={s.id} class="w-5 h-5 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500" />
                   <div>
                     <p class="font-bold text-sm text-gray-800 leading-none">{s.name}</p>
                     <p class="text-[10px] font-black uppercase text-gray-400 mt-1">{s.role}</p>
                   </div>
                 </label>
               ))}
             </div>
           </div>

        </div>
        <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-6">
            <button onclick="startShift()" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-black py-4 rounded-2xl shadow-xl shadow-yellow-500/30 active:scale-95 transition-all">
              Catat Absensi, Buat Snapshot Stok & Buka Shift
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
               icon: 'info', showCancelButton: true, confirmButtonColor: '#eab308', confirmButtonText: 'Mulai Sekarang'
             }).then(async (result) => {
                if(result.isConfirmed) {
                  const res = await fetch('/cashier', { 
                    method: 'POST', headers:{'Content-Type':'application/json'}, 
                    body: JSON.stringify({action: 'start_shift', start_cash: startCash, start_app: startApp, active_staff: activeStaff}) 
                  });
                  const data = await res.json();
                  if(data.success) window.location.reload();
                }
             })
          }
        `}} />
      </div>
    , { title: 'Buka Shift - Kasir' })
  }

  // ==========================================
  // UI 2: DASHBOARD (SHIFT AKTIF)
  // ==========================================
  const { results: activeOrders } = await db.prepare(`SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.total_price, o.payment_method, o.status, o.kitchen_status FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.status != 'COMPLETED' AND o.status != 'CANCELLED' ORDER BY o.created_at ASC`).all();
  
  const { results: activeAttendance } = await db.prepare(`SELECT * FROM shift_attendance WHERE shift_id = ? AND status = 'ACTIVE'`).bind(shiftId).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6">
      <div class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
         <div>
            <h2 class="text-2xl font-black text-gray-800">Dashboard Shift Aktif</h2>
            <p class="text-sm font-bold text-gray-500 mt-1 font-mono">ID Sesi: {shiftId}</p>
         </div>
         <button onclick="closeShift()" class="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all">
            Akhiri Shift & Cetak Laporan
         </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
         {/* KIRI: PEGAWAI AKTIF */}
         <div class="xl:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 self-start">
            <h3 class="text-lg font-black text-gray-800 mb-4 border-b border-gray-100 pb-2">Pegawai On-Duty</h3>
            <div class="space-y-3">
               {activeAttendance.length === 0 ? <p class="text-xs text-gray-400 font-bold">Tidak ada staf yang diabsen.</p> : activeAttendance.map((a: any) => (
                  <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                     <div>
                       <p class="font-bold text-sm text-gray-800">{a.staff_name}</p>
                       <p class="text-[9px] font-black uppercase text-green-500 mt-0.5">{a.role} • Masuk: {new Date(a.clock_in).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                     </div>
                     <button onclick={`kickStaff('${a.id}', '${a.staff_name}')`} class="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Keluarkan
                     </button>
                  </div>
               ))}
            </div>
         </div>

         {/* KANAN: ORDER AKTIF */}
         <div class="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 class="text-lg font-black text-gray-800 mb-4 border-b border-gray-100 pb-2">Kendali Transaksi & Dapur</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left whitespace-nowrap">
                <thead>
                  <tr class="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                    <th class="px-4 py-3 rounded-tl-lg">Pelanggan</th>
                    <th class="px-4 py-3">Tagihan</th>
                    <th class="px-4 py-3">Status Saat Ini</th>
                    <th class="px-4 py-3 rounded-tr-lg">Aksi Kasir</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm">
                  {activeOrders.length === 0 ? (
                    <tr><td colspan="4" class="px-4 py-8 text-center text-gray-400 font-bold">Tidak ada order aktif.</td></tr>
                  ) : activeOrders.map((o: any) => {
                     const isUnpaidCash = o.payment_method === 'CASH' && o.status === 'PENDING';
                     return (
                       <tr class="hover:bg-gray-50">
                         <td class="px-4 py-3">
                            <p class="font-black text-gray-800 text-xs">{o.customer_name}</p>
                            <p class="text-[10px] text-gray-500 mt-0.5">{o.table_id}</p>
                         </td>
                         <td class="px-4 py-3 font-black text-yellow-600 text-xs">{formatter.format(o.total_price)}</td>
                         <td class="px-4 py-3">
                            <span class={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${isUnpaidCash ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                               {isUnpaidCash ? 'BELUM BAYAR (CASH)' : o.status}
                            </span>
                         </td>
                         <td class="px-4 py-3 flex gap-2">
                            {isUnpaidCash ? (
                               <button onclick={`verifyPayment('${o.id}')`} class="bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-green-600">Terima Uang</button>
                            ) : (
                               <>
                                 <button onclick={`forceStatus('${o.id}', 'COMPLETED', 'READY')`} class="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-blue-100">Set Selesai</button>
                                 <button onclick={`forceStatus('${o.id}', 'CANCELLED', 'WAITING')`} class="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded hover:bg-red-100">Batalkan</button>
                               </>
                            )}
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
        function kickStaff(attId, name) {
           Swal.fire({
             title: 'Izin Keluar Sesi',
             text: \`Alasan \${name} pulang lebih awal?\`,
             input: 'text',
             inputPlaceholder: 'Cth: Sakit, Urusan Keluarga...',
             showCancelButton: true, confirmButtonColor: '#eab308',
             inputValidator: (value) => { if (!value) return 'Wajib isi alasan!' }
           }).then(async (result) => {
             if (result.isConfirmed) {
                const res = await fetch('/cashier', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'kick_staff', attendance_id: attId, reason: result.value }) });
                const data = await res.json();
                if(data.success) window.location.reload();
             }
           });
        }

        function closeShift() {
           Swal.fire({
             title: 'Tutup Sesi & Shift?',
             text: 'Sistem akan melakukan snapshot stok akhir dan membuat laporan penutupan (Semua pekerja aktif akan otomatis di-clock out).',
             icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Tutup Shift Sekarang'
           }).then(async (result) => {
             if (result.isConfirmed) {
                const res = await fetch('/cashier', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'close_shift' }) });
                const data = await res.json();
                if(data.success) {
                   Swal.fire('Selesai', data.message, 'success').then(() => window.location.reload());
                } else { Swal.fire('Error', data.message, 'error'); }
             }
           });
        }

        function verifyPayment(orderId) {
          Swal.fire({
            title: 'Uang Pas Diterima?',
            icon: 'question', showCancelButton: true, confirmButtonColor: '#22c55e', confirmButtonText: 'Ya, Lunas!'
          }).then(async (result) => {
            if (result.isConfirmed) {
              const res = await fetch('/cashier', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'pay_cash', order_id: orderId }) });
              const data = await res.json();
              if(data.success) window.location.reload();
            }
          });
        }

        function forceStatus(orderId, newStatus, newKitchen) {
           Swal.fire({
             title: 'Ubah Status Paksa?',
             text: 'Tindakan ini akan memotong alur dapur secara paksa.',
             icon: 'warning', showCancelButton: true, confirmButtonColor: '#3b82f6', confirmButtonText: 'Ya, Ubah!'
           }).then(async (result) => {
              if (result.isConfirmed) {
                 const res = await fetch('/cashier', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'update_order_status', order_id: orderId, new_status: newStatus, new_kitchen: newKitchen }) });
                 const data = await res.json();
                 if(data.success) window.location.reload();
              }
           })
        }
      `}} />
    </div>
  , { title: 'Dashboard Kasir - Aktif' })
})

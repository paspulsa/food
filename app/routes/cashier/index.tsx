import { createRoute } from 'honox/factory'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  try {
    const body = await c.req.json();
    
    // Manajemen Shift
    if (body.action === 'start_shift') {
      setCookie(c, 'shift_cashier', 'active', { path: '/', maxAge: 43200 }); // Sesi 12 Jam
      return c.json({ success: true });
    }
    if (body.action === 'end_shift') {
      deleteCookie(c, 'shift_cashier', { path: '/' });
      return c.json({ success: true });
    }

    // Aksi Kasir
    if (body.action === 'pay_cash') {
      await db.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(body.order_id).run();
      await db.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
      return c.json({ success: true, message: 'Pembayaran Lunas! Pesanan masuk ke dapur.' });
    }
    if (body.action === 'cancel_order') {
      const orderInfo: any = await db.prepare("SELECT table_id FROM orders WHERE id = ?").bind(body.order_id).first();
      await db.prepare("UPDATE orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
      if (orderInfo && orderInfo.table_id && orderInfo.table_id !== 'TAKEAWAY') {
          await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(orderInfo.table_id).run();
      }
      return c.json({ success: true, message: 'Pesanan berhasil dibatalkan.' });
    }

    return c.json({ success: false, message: 'Aksi tidak valid.' }, 400);
  } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
});

export default createRoute(async (c) => {
  const shiftActive = getCookie(c, 'shift_cashier');
  
  // =====================================
  // UI 1: LOCK SCREEN (SHIFT BELUM MULAI)
  // =====================================
  if (!shiftActive) {
    return c.render(
      <div class="h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div class="bg-gray-800 p-10 rounded-3xl shadow-2xl text-center border border-gray-700 max-w-md w-full relative z-10">
           <div class="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
             <svg class="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
           </div>
           <h2 class="text-3xl font-black text-white mb-2">POS Kasir Terkunci</h2>
           <p class="text-gray-400 mb-8 font-medium">Sistem siap. Silakan buka laci kas Anda dan mulai shift kerja untuk hari ini.</p>
           <button onclick="startShift()" class="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-lg font-black py-4 rounded-xl transition-transform active:scale-95 shadow-lg">
             Mulai Kerja (Buka Shift)
           </button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          async function startShift() {
             await fetch('/cashier', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action: 'start_shift'}) });
             window.location.reload();
          }
        `}} />
      </div>
    , { title: 'Mulai Shift - Kasir' })
  }

  // =====================================
  // UI 2: HALAMAN ANTREAN (SHIFT AKTIF)
  // =====================================
  const db = c.env.DB;
  const { results: pendingOrders } = await db.prepare(`
    SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.total_price, o.order_type, o.created_at
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE o.payment_method = 'CASH' AND o.status = 'PENDING'
    ORDER BY o.created_at ASC
  `).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      
      {/* NAVBAR PWA */}
      <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
         <div class="flex items-center gap-6">
            <h1 class="font-black text-xl text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               Super Kasir
            </h1>
            <div class="hidden md:flex gap-2">
               <a href="/cashier" class="px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 font-bold border border-yellow-200 dark:border-yellow-800">Antrean Bayar</a>
               <a href="/cashier/tables" class="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors">Manajemen Meja</a>
               <a href="/cashier/report" class="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors">Laporan Keuangan</a>
            </div>
         </div>
         <button onclick="endShift()" class="text-red-600 dark:text-red-400 font-bold text-sm bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 transition-colors">Akhiri Shift</button>
      </nav>

      {/* KONTEN HALAMAN */}
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex justify-between items-end mb-6">
           <div>
             <h2 class="text-2xl font-black text-gray-800 dark:text-white">🧾 Antrean Pembayaran Tunai</h2>
             <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Verifikasi pembayaran sebelum dikirim ke dapur.</p>
           </div>
           <button onclick="window.location.reload()" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50">🔄 Segarkan</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {pendingOrders.length === 0 ? (
            <div class="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
               <div class="text-5xl mb-4 opacity-50">💸</div>
               <p class="text-gray-500 dark:text-gray-400 font-bold text-lg">Semua tagihan tunai sudah lunas.</p>
            </div>
          ) : pendingOrders.map((o: any) => (
            <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col justify-between">
               <div>
                 <div class="flex justify-between items-start mb-4">
                   <span class="text-xs font-mono font-bold text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">#{o.id.substring(0,8)}</span>
                   <span class="text-[10px] font-black uppercase px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{o.order_type}</span>
                 </div>
                 <h3 class="text-xl font-black text-gray-800 dark:text-white leading-tight">{o.customer_name}</h3>
                 <p class="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">{o.table_id !== 'TAKEAWAY' ? `Lokasi: Meja ${o.table_id}` : 'Bawa Pulang (Takeaway)'}</p>
                 
                 <div class="mt-5 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 text-center">
                   <p class="text-xs text-yellow-700 dark:text-yellow-500 uppercase tracking-widest font-black">Tagihan</p>
                   <p class="text-3xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{formatter.format(o.total_price)}</p>
                 </div>
               </div>
               
               <div class="mt-6 flex gap-3">
                 <button onclick={`cancelOrder('${o.id}', '${o.customer_name.replace(/'/g, "\\'")}')`} class="w-1/3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 font-bold py-3.5 rounded-xl transition-all active:scale-95 text-xs border border-gray-200 dark:border-gray-600">
                   Batalkan
                 </button>
                 <button onclick={`verifyPayment('${o.id}', '${o.customer_name.replace(/'/g, "\\'")}', '${formatter.format(o.total_price)}')`} class="w-2/3 bg-yellow-500 hover:bg-yellow-600 text-white font-black py-3.5 rounded-xl shadow-lg active:scale-95 transition-all">
                   Lunas
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // Script Aksi dengan URL folder ini
        setInterval(() => window.location.reload(), 15000);

        async function endShift() {
           await fetch('/cashier', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action: 'end_shift'}) });
           window.location.reload();
        }

        function verifyPayment(orderId, customer, amount) {
          Swal.fire({
            title: 'Terima Uang Tunai?',
            html: \`Pastikan menerima <br><b class="text-2xl text-green-600 mt-2 block">\${amount}</b><br> dari \${customer}.\`,
            icon: 'question', showCancelButton: true, confirmButtonColor: '#eab308',
            confirmButtonText: 'Ya, Lunas!'
          }).then(async (result) => {
            if (result.isConfirmed) {
              const res = await fetch('/cashier', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'pay_cash', order_id: orderId }) });
              const data = await res.json();
              if(data.success) { Swal.fire('Lunas!', data.message, 'success').then(()=>window.location.reload()); }
            }
          });
        }

        function cancelOrder(orderId, customer) {
          Swal.fire({
            title: 'Batalkan Pesanan?',
            text: \`Batalkan pesanan \${customer} secara permanen?\`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Batalkan!'
          }).then(async (result) => {
            if (result.isConfirmed) {
              const res = await fetch('/cashier', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'cancel_order', order_id: orderId }) });
              const data = await res.json();
              if(data.success) { Swal.fire('Dibatalkan', data.message, 'success').then(()=>window.location.reload()); }
            }
          });
        }
      `}} />
    </div>
  , { title: 'Antrean - PWA Kasir' })
})

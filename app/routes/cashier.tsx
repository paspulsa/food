import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // ==========================================
  // PROTEKSI HALAMAN (WAJIB LOGIN ADMIN/CASHIER)
  // ==========================================
  const token = getCookie(c, 'admin_token');
  if (!token) return c.redirect('/login');
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    // Kasir atau Admin boleh masuk
    if (payload.role !== 'ADMIN' && payload.role !== 'CASHIER') return c.redirect('/login');
  } catch (e) { return c.redirect('/login'); }

  const db = c.env.DB;

  // ==========================================
  // HANDLER POST: KONTROL SUPER KASIR
  // ==========================================
  if (c.req.method === 'POST') {
    try {
      const body = await c.req.json();
      
      // Aksi 1: Terima Uang Tunai
      if (body.action === 'pay_cash') {
        await db.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(body.order_id).run();
        await db.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
        return c.json({ success: true, message: 'Pembayaran Lunas! Pesanan masuk ke dapur.' });
      } 
      
      // Aksi 2: Batalkan Pesanan (Jika tamu kabur / salah pesan)
      else if (body.action === 'cancel_order') {
        const orderInfo: any = await db.prepare("SELECT table_id FROM orders WHERE id = ?").bind(body.order_id).first();
        await db.prepare("UPDATE orders SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
        // Jika batal, bebaskan mejanya sekalian
        if (orderInfo && orderInfo.table_id && orderInfo.table_id !== 'TAKEAWAY') {
            await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(orderInfo.table_id).run();
        }
        return c.json({ success: true, message: 'Pesanan berhasil dibatalkan.' });
      }
      
      // Aksi 3: Paksa Kosongkan Meja (Matikan Session Guest)
      else if (body.action === 'free_table') {
        await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(body.table_id).run();
        return c.json({ success: true, message: `Meja ${body.table_id} berhasil dikosongkan.` });
      }

    } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
  }

  // ==========================================
  // FETCH DATA: MULTI-DIMENSI UNTUK KASIR
  // ==========================================
  
  // 1. Antrean Pembayaran Tunai
  const { results: pendingOrders } = await db.prepare(`
    SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.total_price, o.order_type, o.created_at
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE o.payment_method = 'CASH' AND o.status = 'PENDING'
    ORDER BY o.created_at ASC
  `).all();

  // 2. Status Semua Meja
  const { results: tables } = await db.prepare(`SELECT id, name, status FROM tables ORDER BY name ASC`).all();

  // 3. Rekap Shift Keuangan Hari Ini (Menggunakan Date SQLite)
  const { results: todaySales } = await db.prepare(`
    SELECT payment_method, total_price, status 
    FROM orders 
    WHERE date(created_at, '+8 hours') = date('now', '+8 hours') 
    AND status NOT IN ('CANCELLED', 'PENDING')
  `).all();

  // Kalkulasi Keuangan
  let totalCash = 0;
  let totalQris = 0;
  let totalOrdersToday = todaySales.length;

  todaySales.forEach((sale: any) => {
      if (sale.payment_method === 'CASH') totalCash += sale.total_price;
      if (sale.payment_method === 'QRIS') totalQris += sale.total_price;
  });

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 pb-10 max-w-7xl mx-auto px-4 mt-6">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      
      {/* HEADER KASIR */}
      <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-3">
             <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             Super Kasir
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">Sistem Kontrol Transaksi, Meja, dan Rekap Pendapatan.</p>
        </div>
        <button onclick="window.location.reload()" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
           Segarkan Data
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div class="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
         <button onclick="switchTab('antrean')" id="tab-antrean" class="pb-3 text-sm font-black border-b-4 border-yellow-500 text-yellow-600 dark:text-yellow-500 transition-colors flex items-center gap-2">
            🧾 Antrean Bayar <span class="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full text-[10px]">{pendingOrders.length}</span>
         </button>
         <button onclick="switchTab('meja')" id="tab-meja" class="pb-3 text-sm font-black border-b-4 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors flex items-center gap-2">
            🍽️ Manajemen Meja
         </button>
         <button onclick="switchTab('laporan')" id="tab-laporan" class="pb-3 text-sm font-black border-b-4 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors flex items-center gap-2">
            📊 Rekap Keuangan
         </button>
      </div>

      {/* =======================================================
          TAB 1: ANTREAN PEMBAYARAN TUNAI
          ======================================================= */}
      <div id="panel-antrean" class="block animate-fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingOrders.length === 0 ? (
            <div class="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
               <div class="text-5xl mb-4 opacity-50">💸</div>
               <p class="text-gray-500 dark:text-gray-400 font-bold text-lg">Tidak ada antrean pembayaran tunai.</p>
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
                   <p class="text-xs text-yellow-700 dark:text-yellow-500 uppercase tracking-widest font-black">Total Harus Dibayar</p>
                   <p class="text-3xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{formatter.format(o.total_price)}</p>
                 </div>
               </div>
               
               <div class="mt-6 flex gap-3">
                 <button onclick={`cancelOrder('${o.id}', '${o.customer_name.replace(/'/g, "\\'")}')`} class="w-1/3 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 text-gray-600 dark:text-gray-300 font-bold py-3.5 rounded-xl transition-all active:scale-95 text-xs border border-gray-200 dark:border-gray-600">
                   Batalkan
                 </button>
                 <button onclick={`verifyPayment('${o.id}', '${o.customer_name.replace(/'/g, "\\'")}', '${formatter.format(o.total_price)}')`} class="w-2/3 bg-yellow-500 hover:bg-yellow-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-yellow-500/30 active:scale-95 transition-all">
                   Terima Uang
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* =======================================================
          TAB 2: MANAJEMEN MEJA (KICK GUEST SESSION)
          ======================================================= */}
      <div id="panel-meja" class="hidden animate-fade-in">
         <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-6">
            <p class="text-xs text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Jika tamu sudah pulang namun meja masih berstatus "Terisi" di sistem, klik Kosongkan agar bisa dipakai tamu lain.
            </p>
         </div>

         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map((t: any) => {
               const isOccupied = t.status === 'OCCUPIED';
               return (
                 <div class={`p-5 rounded-2xl border-2 transition-all ${isOccupied ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                    <div class={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isOccupied ? 'bg-red-100 dark:bg-red-900/50 text-red-500' : 'bg-green-100 dark:bg-green-900/50 text-green-500'}`}>
                       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white">{t.name}</h3>
                    <p class={`text-xs font-bold mt-1 ${isOccupied ? 'text-red-500' : 'text-green-500'}`}>
                       {isOccupied ? 'Terisi / Dipesan' : 'Kosong (Tersedia)'}
                    </p>
                    
                    {isOccupied && (
                       <button onclick={`freeTable('${t.id}', '${t.name}')`} class="mt-4 w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm">
                         Kosongkan Meja
                       </button>
                    )}
                 </div>
               )
            })}
         </div>
      </div>

      {/* =======================================================
          TAB 3: LAPORAN KEUANGAN SHIFT
          ======================================================= */}
      <div id="panel-laporan" class="hidden animate-fade-in">
         <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
               <svg class="absolute -bottom-4 -right-4 w-32 h-32 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
               <p class="font-bold text-green-100 mb-1 uppercase tracking-wider text-xs">Uang Tunai di Laci (Hari Ini)</p>
               <h3 class="text-4xl font-black">{formatter.format(totalCash)}</h3>
               <p class="text-xs font-medium text-green-100 mt-4">Wajib disetorkan saat tutup shift.</p>
            </div>

            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
               <svg class="absolute -bottom-4 -right-4 w-32 h-32 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               <p class="font-bold text-blue-100 mb-1 uppercase tracking-wider text-xs">Pemasukan QRIS (Online)</p>
               <h3 class="text-4xl font-black">{formatter.format(totalQris)}</h3>
               <p class="text-xs font-medium text-blue-100 mt-4">Masuk otomatis ke rekening.</p>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
               <p class="font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider text-xs">Total Pesanan Sukses</p>
               <h3 class="text-4xl font-black text-gray-900 dark:text-white">{totalOrdersToday} <span class="text-lg font-bold text-gray-400">Trx</span></h3>
               <div class="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
                  <div class="bg-primary h-full rounded-full w-full"></div>
               </div>
            </div>

         </div>
      </div>

      {/* SCRIPT KONTROL UI & LOGIKA */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Auto-refresh hanya jika berada di Tab Antrean
        let refreshInterval = setInterval(() => window.location.reload(), 15000);

        function switchTab(tabName) {
           ['antrean', 'meja', 'laporan'].forEach(t => {
              document.getElementById('panel-' + t).style.display = (t === tabName) ? 'block' : 'none';
              const btn = document.getElementById('tab-' + t);
              if (t === tabName) {
                 btn.classList.add('border-yellow-500', 'text-yellow-600', 'dark:text-yellow-500');
                 btn.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
              } else {
                 btn.classList.remove('border-yellow-500', 'text-yellow-600', 'dark:text-yellow-500');
                 btn.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
              }
           });

           // Matikan auto-refresh jika sedang buka laporan atau meja agar tidak mengganggu klik
           if(tabName !== 'antrean') { clearInterval(refreshInterval); }
           else { refreshInterval = setInterval(() => window.location.reload(), 15000); }
        }

        function verifyPayment(orderId, customer, amount) {
          Swal.fire({
            title: 'Terima Uang Tunai?',
            html: \`Pastikan Anda sudah menerima uang sebesar <br><b class="text-2xl text-green-600 mt-2 block">\${amount}</b><br> dari \${customer}.\`,
            icon: 'question', showCancelButton: true, confirmButtonColor: '#eab308', cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Ya, Uang Pas / Lunas!', cancelButtonText: 'Batal'
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const res = await fetch('/cashier', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'pay_cash', order_id: orderId })
                });
                const data = await res.json();
                if(data.success) { Swal.fire('Lunas!', data.message, 'success').then(()=>window.location.reload()); }
                else { Swal.fire('Error', data.message, 'error'); }
              } catch(e) { Swal.fire('Error', 'Gangguan jaringan.', 'error'); }
            }
          });
        }

        function cancelOrder(orderId, customer) {
          Swal.fire({
            title: 'Batalkan Pesanan?',
            text: \`Anda yakin ingin membatalkan pesanan dari \${customer} secara permanen?\`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Ya, Batalkan!', cancelButtonText: 'Kembali'
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const res = await fetch('/cashier', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'cancel_order', order_id: orderId })
                });
                const data = await res.json();
                if(data.success) { Swal.fire('Dibatalkan!', data.message, 'success').then(()=>window.location.reload()); }
                else { Swal.fire('Error', data.message, 'error'); }
              } catch(e) { Swal.fire('Error', 'Gangguan jaringan.', 'error'); }
            }
          });
        }

        function freeTable(tableId, tableName) {
          Swal.fire({
            title: 'Kosongkan Meja?',
            text: \`Sistem akan mematikan sesi tamu di \${tableName}. Lanjutkan?\`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#3b82f6', cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Ya, Kosongkan!', cancelButtonText: 'Batal'
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const res = await fetch('/cashier', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'free_table', table_id: tableId })
                });
                const data = await res.json();
                if(data.success) { Swal.fire('Berhasil!', data.message, 'success').then(()=>window.location.reload()); }
                else { Swal.fire('Error', data.message, 'error'); }
              } catch(e) { Swal.fire('Error', 'Gangguan jaringan.', 'error'); }
            }
          });
        }
      `}} />
    </div>
  , { title: 'Super Kasir - Kedai Pangsit Kembar 88' })
})

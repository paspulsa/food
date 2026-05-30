import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // ==========================================
  // PROTEKSI HALAMAN (WAJIB LOGIN ADMIN/WAITER)
  // ==========================================
  const token = getCookie(c, 'admin_token');
  if (!token) return c.redirect('/login');
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    // PERBAIKAN: Berikan izin akses untuk WAITER (tidak hanya ADMIN)
    if (payload.role !== 'ADMIN' && payload.role !== 'WAITER') return c.redirect('/login');
  } catch (e) { return c.redirect('/login'); }

  const db = c.env.DB;

  if (c.req.method === 'POST') {
    try {
      const body = await c.req.json();
      if (body.action === 'deliver') {
        await db.prepare("UPDATE orders SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
        
        if (body.table_id && body.table_id !== 'TAKEAWAY') {
            await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(body.table_id).run();
        }
        return c.json({ success: true, message: 'Pesanan diserahkan, meja telah dikosongkan!' });
      }
    } catch (e: any) { return c.json({ success: false, message: e.message }, 500); }
  }

  const { results: orders } = await db.prepare(`
    SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.order_type
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE o.kitchen_status = 'READY' AND o.status != 'COMPLETED'
    ORDER BY o.updated_at ASC
  `).all();

  return c.render(
    <div class="space-y-6 pb-10 max-w-7xl mx-auto px-4 mt-6">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <div class="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">🏃‍♂️ Portal Waiter</h2>
          <p class="text-gray-500 text-sm mt-1">Antar makanan yang sudah selesai dimasak oleh dapur.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-bold border border-green-200">
            Siap Antar: {orders.length}
          </div>
          {/* PERBAIKAN: Penambahan Tombol Keluar (Logout) untuk Waiter */}
          <a href="/admin/logout" class="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold transition-colors border border-red-200 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Keluar
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.length === 0 ? (
          <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
             <div class="text-4xl mb-3 opacity-50">😴</div>
             <p class="text-gray-400 font-bold">Belum ada pesanan yang selesai dimasak.</p>
          </div>
        ) : orders.map((o: any) => {
          const isTakeaway = o.table_id === 'TAKEAWAY';
          return (
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg flex flex-col justify-between relative overflow-hidden group">
               <div class={`absolute top-0 left-0 w-full h-2 ${isTakeaway ? 'bg-purple-500' : 'bg-green-500'}`}></div>
               <div class="mb-6 text-center mt-2">
                 <div class={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isTakeaway ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                   {isTakeaway ? (
                     <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                   ) : (
                     <span class="text-2xl font-black">{o.table_id}</span>
                   )}
                 </div>
                 <h3 class="text-2xl font-black text-gray-900 mb-1">
                   {isTakeaway ? 'TAKEAWAY' : `MEJA ${o.table_id}`}
                 </h3>
                 <p class="text-sm font-bold text-gray-500 bg-gray-50 py-1.5 rounded-lg inline-block px-4">
                   Tamu: {o.customer_name}
                 </p>
               </div>
               <button onclick={`deliverOrder('${o.id}', '${o.table_id}')`} class={`w-full text-white font-black py-4 rounded-xl shadow-md transition-transform active:scale-95 ${isTakeaway ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/30' : 'bg-[#ee4d2d] hover:bg-orange-600 shadow-orange-500/30'}`}>
                 {isTakeaway ? 'Serahkan ke Pelanggan' : 'Selesai Diantar ke Meja'}
               </button>
            </div>
          )
        })}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        setInterval(() => window.location.reload(), 15000); 
        function deliverOrder(orderId, tableId) {
          const isTake = tableId === 'TAKEAWAY';
          Swal.fire({
            title: isTake ? 'Serahkan Bungkusan?' : 'Konfirmasi Pengantaran',
            text: isTake ? 'Pastikan pelanggan sudah menerima bungkusannya.' : 'Apakah makanan sudah ditaruh di meja pelanggan?',
            icon: 'info', showCancelButton: true, confirmButtonColor: '#ee4d2d', cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Ya, Selesai!', cancelButtonText: 'Batal'
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const res = await fetch('/waiter', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'deliver', order_id: orderId, table_id: tableId })
                });
                const data = await res.json();
                if(data.success) { Swal.fire('Mantap!', data.message, 'success').then(()=>window.location.reload()); }
                else { Swal.fire('Error', data.message, 'error'); }
              } catch(e) { Swal.fire('Error', 'Gangguan jaringan', 'error'); }
            }
          });
        }
      `}} />
    </div>
  , { title: 'Portal Waiter - RMS' })
})

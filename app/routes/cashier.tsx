import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB;

  // ==========================================
  // HANDLER POST: VERIFIKASI PEMBAYARAN TUNAI
  // ==========================================
  if (c.req.method === 'POST') {
    try {
      const body = await c.req.json();
      if (body.action === 'pay_cash') {
        // 1. Ubah Transaksi jadi PAID
        await db.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(body.order_id).run();
        // 2. Loloskan pesanan ke Dapur (PROCESSING)
        await db.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
        return c.json({ success: true, message: 'Pembayaran Lunas! Pesanan masuk ke dapur.' });
      }
    } catch (e: any) {
      return c.json({ success: false, message: e.message }, 500);
    }
  }

  // ==========================================
  // FETCH DATA: PESANAN CASH YANG BELUM LUNAS
  // ==========================================
  const { results: orders } = await db.prepare(`
    SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.total_price, o.order_type, o.created_at
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE o.payment_method = 'CASH' AND o.status = 'PENDING'
    ORDER BY o.created_at ASC
  `).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 pb-10 max-w-7xl mx-auto px-4 mt-6">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">💰 Layar Kasir</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Verifikasi uang tunai agar pesanan masuk ke dapur.</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-xl font-bold border border-orange-200 dark:border-orange-800">
          Antrean Tunai: {orders.length}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {orders.length === 0 ? (
          <div class="col-span-full py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
             <p class="text-gray-400 font-bold">Tidak ada antrean pembayaran tunai saat ini.</p>
          </div>
        ) : orders.map((o: any) => (
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
             <div>
               <div class="flex justify-between items-start mb-3">
                 <span class="text-xs font-mono font-bold text-gray-400">#{o.id.substring(0,8)}</span>
                 <span class="text-[10px] font-black uppercase px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{o.order_type}</span>
               </div>
               <h3 class="text-lg font-black text-gray-800 dark:text-white leading-tight">{o.customer_name}</h3>
               <p class="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">{o.table_id !== 'TAKEAWAY' ? `Meja: ${o.table_id}` : 'Takeaway'}</p>
               
               <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                 <p class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Tagihan</p>
                 <p class="text-2xl font-black text-[#ee4d2d] mt-1">{formatter.format(o.total_price)}</p>
               </div>
             </div>
             <button onclick={`verifyPayment('${o.id}', '${o.customer_name.replace(/'/g, "\\'")}', '${formatter.format(o.total_price)}')`} class="w-full mt-5 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all">
               Terima Uang & Lunasi
             </button>
          </div>
        ))}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        setInterval(() => window.location.reload(), 15000);

        function verifyPayment(orderId, customer, amount) {
          Swal.fire({
            title: 'Terima Pembayaran?',
            html: \`Pastikan Anda menerima tunai sebesar <b>\${amount}</b> dari \${customer}.\`,
            icon: 'question', showCancelButton: true, confirmButtonColor: '#22c55e', cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Ya, Lunasi!', cancelButtonText: 'Batal'
          }).then(async (result) => {
            if (result.isConfirmed) {
              try {
                const res = await fetch('/cashier', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ action: 'pay_cash', order_id: orderId })
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
  , { title: 'Portal Kasir - RMS' })
})

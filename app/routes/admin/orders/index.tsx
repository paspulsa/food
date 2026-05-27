import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const { results: orders } = await c.env.DB.prepare(`
    SELECT o.id, o.total_price, o.status, o.created_at, u.name as user_name, r.name as restaurant_name 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN restaurants r ON o.restaurant_id = r.id
    ORDER BY o.created_at DESC LIMIT 100
  `).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Manajemen Alur Distribusi Pesanan</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Pantau dan ubah status siklus pemrosesan serta pengantaran pesanan kuliner secara real-time.</p>
        </div>
      </div>

      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/70 dark:bg-darkbg/50 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
                <th class="px-6 py-4 font-semibold">ID Transaksi</th>
                <th class="px-6 py-4 font-semibold">Detail Entitas</th>
                <th class="px-6 py-4 font-semibold">Total Tagihan</th>
                <th class="px-6 py-4 font-semibold">Alur Status</th>
                <th class="px-6 py-4 text-right font-semibold">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-darkborder text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic bg-white dark:bg-darkpanel">
                    Tidak ada riwayat transaksi masuk.
                  </td>
                </tr>
              ) : orders.map((order: any) => (
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4">
                  <a href={`/admin/orders/${order.id}`} class="font-bold font-mono text-xs text-primary hover:underline"> #{order.id.substring(0,8)}</a></td>
                  <td class="px-6 py-4">
                    <div class="font-semibold text-gray-800 dark:text-gray-200">{order.user_name}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.restaurant_name}</div>
                  </td>
                  <td class="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{formatter.format(order.total_price)}</td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      order.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20' :
                      order.status === 'PENDING' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20' :
                      order.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' : 
                      'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                    }`}>{order.status}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <select 
                      class="text-xs font-bold border border-gray-200 dark:border-darkborder rounded-xl p-2 bg-gray-50 dark:bg-darkbg text-gray-800 dark:text-white focus:outline-none focus:border-primary cursor-pointer transition-colors"
                      onchange={`changeStatusTrx('${order.id}', this.value)`}
                    >
                      {['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'].map((st) => (
                        <option value={st} selected={order.status === st}>{st}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function changeStatusTrx(orderId, nextStatus) {
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          if (!token) return alert('Otorisasi kedaluwarsa.');
          
          try {
            const res = await fetch('/api/v1/protected/admin/orders/' + orderId + '/status', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ status: nextStatus })
            });
            const data = await res.json();
            if(data.success) window.location.reload();
            else alert(data.message || 'Gagal mengubah status.');
          } catch(e) {
            alert('Gangguan komunikasi dengan serverless cluster.');
          }
        }
      `}} />
    </div>
  , { title: 'Manajemen Transaksi - SPOS' })
})

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
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Manajemen Distribusi Pesanan</h2>
        <p class="text-gray-500 text-sm mt-1">Perbarui siklus proses pengiriman pesanan kuliner secara real-time.</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="px-6 py-4 font-semibold">ID Transaksi</th>
              <th class="px-6 py-4 font-semibold">Detail Entitas</th>
              <th class="px-6 py-4 font-semibold">Total Tagihan</th>
              <th class="px-6 py-4 font-semibold">Alur Status</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 text-sm">
            {orders.map((order: any) => (
              <tr class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4 font-bold font-mono text-xs text-gray-600">#{order.id.substring(0,8)}</td>
                <td class="px-6 py-4">
                  <div class="font-semibold text-gray-800">{order.user_name}</div>
                  <div class="text-xs text-gray-400 mt-0.5">{order.restaurant_name}</div>
                </td>
                <td class="px-6 py-4 font-extrabold text-gray-800">{formatter.format(order.total_price)}</td>
                <td class="px-6 py-4">
                  <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-black ${
                    order.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border border-green-100' :
                    order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                    order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>{order.status}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <select 
                    class="text-xs font-bold border border-gray-200 rounded-lg p-1.5 bg-white focus:outline-none focus:border-primary"
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
  , { title: 'Manajemen Transaksi' })
})

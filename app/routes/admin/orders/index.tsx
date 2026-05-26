import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Query Join untuk mendapatkan nama relasi
  const { results: orders } = await c.env.DB.prepare(`
    SELECT o.id, o.total_price, o.status, o.created_at, 
           u.name as user_name, r.name as restaurant_name 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN restaurants r ON o.restaurant_id = r.id
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

  // Fungsi utilitas warna badge status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING': return 'bg-blue-100 text-blue-800';
      case 'DELIVERING': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return c.render(
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Riwayat Pesanan</h2>
      </div>

      <div class="bg-white rounded shadow overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Trx</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pembeli</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {orders.map((order: any) => (
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500" title={order.id}>
                  {order.id.substring(0, 8)}...
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.user_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.restaurant_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {formatter.format(order.total_price)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <a href={`/admin/orders/${order.id}`} class="text-indigo-600 hover:text-indigo-900">Detail</a>
                  {/* Di sisi client nanti (React/Alpine), tombol ini akan memanggil API: PUT /api/v1/protected/admin/orders/:id/status */}
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <button class="text-blue-600 hover:text-blue-900">Ubah Status</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { title: 'Manajemen Pesanan' }
  )
})

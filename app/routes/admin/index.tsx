import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const [usersCount, restaurantsCount, ordersCount, revenue, recentOrders] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as t FROM users'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM restaurants'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM orders'),
    c.env.DB.prepare("SELECT SUM(total_price) as t FROM orders WHERE status = 'COMPLETED'"),
    c.env.DB.prepare(`
      SELECT o.id, o.total_price, o.status, u.name as user_name, r.name as restaurant_name 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN restaurants r ON o.restaurant_id = r.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `)
  ]);

  const totalUsers = usersCount.results[0]?.t || 0;
  const totalRestos = restaurantsCount.results[0]?.t || 0;
  const totalOrders = ordersCount.results[0]?.t || 0;
  const totalRevenue = revenue.results[0]?.t || 0;

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 animate-fade-in">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Ringkasan Hari Ini</h2>
        <p class="text-gray-500 text-sm mt-1">Pantau performa operasional ekosistem KPKembar Anda secara aktual.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Pesanan', value: totalOrders.toLocaleString('id-ID'), icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pendapatan Bersih', value: formatter.format(totalRevenue as number), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Restoran Aktif', value: totalRestos.toLocaleString('id-ID'), icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Pengguna', value: totalUsers.toLocaleString('id-ID'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat) => (
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <div class={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon}></path></svg>
              </div>
            </div>
            <p class="text-sm font-medium text-gray-500">{stat.label}</p>
            <h3 class="text-2xl font-black text-gray-800 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 class="text-lg font-bold text-gray-800">Pesanan Masuk Terbaru</h3>
          <a href="/admin/orders" class="text-sm font-bold text-primary hover:underline">Lihat Semua</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th class="px-6 py-4 font-semibold">ID Pesanan</th>
                <th class="px-6 py-4 font-semibold">Pelanggan</th>
                <th class="px-6 py-4 font-semibold">Restoran</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 text-sm">
              {recentOrders.results.length === 0 ? (
                <tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Tidak ada data transaksi aktif.</td></tr>
              ) : recentOrders.results.map((order: any) => (
                <tr class="hover:bg-gray-50/80 transition-colors">
                  <td class="px-6 py-4 font-bold text-gray-700 font-mono">#{order.id.substring(0, 8)}</td>
                  <td class="px-6 py-4 text-gray-600 font-medium">{order.user_name}</td>
                  <td class="px-6 py-4 text-gray-500">{order.restaurant_name}</td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      order.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border border-green-100' :
                      order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                      order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border border-red-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>{order.status}</span>
                  </td>
                  <td class="px-6 py-4 font-bold text-gray-800 text-right">{formatter.format(order.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    { title: 'Dashboard Utama' }
  )
})

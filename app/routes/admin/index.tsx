import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Query paralel untuk performa maksimal
  const [
    usersCount, 
    restaurantsCount, 
    ordersCount, 
    revenue
  ] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as t FROM users'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM restaurants'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM orders'),
    c.env.DB.prepare("SELECT SUM(total_price) as t FROM orders WHERE status = 'COMPLETED'")
  ]);

  const totalUsers = usersCount.results[0]?.t || 0;
  const totalRestos = restaurantsCount.results[0]?.t || 0;
  const totalOrders = ordersCount.results[0]?.t || 0;
  const totalRevenue = revenue.results[0]?.t || 0;

  // Format ke Rupiah
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

  return c.render(
    <div>
      <h2 class="text-2xl font-bold mb-6">Ringkasan Sistem</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-6 rounded shadow border-l-4 border-blue-500">
          <h3 class="text-gray-500 text-sm font-semibold">Total Pengguna</h3>
          <p class="text-3xl font-bold text-gray-800 mt-2">{totalUsers}</p>
        </div>
        <div class="bg-white p-6 rounded shadow border-l-4 border-green-500">
          <h3 class="text-gray-500 text-sm font-semibold">Total Restoran</h3>
          <p class="text-3xl font-bold text-gray-800 mt-2">{totalRestos}</p>
        </div>
        <div class="bg-white p-6 rounded shadow border-l-4 border-purple-500">
          <h3 class="text-gray-500 text-sm font-semibold">Total Pesanan</h3>
          <p class="text-3xl font-bold text-gray-800 mt-2">{totalOrders}</p>
        </div>
        <div class="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
          <h3 class="text-gray-500 text-sm font-semibold">Pendapatan Kotor</h3>
          <p class="text-2xl font-bold text-gray-800 mt-2">{formatter.format(totalRevenue as number)}</p>
        </div>
      </div>
    </div>,
    { title: 'Dashboard - Admin' }
  )
})

import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil Data Asli dari DB (Biarkan logika backend tidak berubah)
  const [usersCount, restaurantsCount, ordersCount, revenue, recentOrders] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as t FROM users'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM restaurants'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM orders'),
    c.env.DB.prepare("SELECT SUM(total_price) as t FROM orders WHERE status = 'COMPLETED'"),
    c.env.DB.prepare(`
      SELECT o.id, o.total_price, o.status, o.created_at, u.name as user_name 
      FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5
    `)
  ]);

  const totalUsers = usersCount.results[0]?.t || 0;
  const totalRestos = restaurantsCount.results[0]?.t || 0;
  const totalOrders = ordersCount.results[0]?.t || 0;
  const totalRevenue = revenue.results[0]?.t || 0;

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6">
      {/* Header Dashboard */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-primary/20 text-primary rounded-xl">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"></path></svg>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm">Selamat datang kembali, Admin! Berikut ringkasan bisnis Anda hari ini.</p>
          </div>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-darkpanel border border-gray-200 dark:border-darkborder rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Penjualan', value: formatter.format(totalRevenue as number), desc: `Dari ${totalOrders} transaksi`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', trend: '↑ 12.5%' },
          { label: 'Total Pemasukan', value: formatter.format((totalRevenue as number) * 1.1), desc: 'Bulan ini', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', trend: '↑ 9.8%' },
          { label: 'Total Transaksi', value: totalOrders.toLocaleString('id-ID'), desc: 'Transaksi Berhasil', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', trend: '↑ 15.2%', isBlue: true },
          { label: 'Pelanggan Aktif', value: totalUsers.toLocaleString('id-ID'), desc: 'Total Pengguna', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', trend: '↑ 8.4%', isPurple: true },
        ].map((stat, i) => (
          <div class="bg-white dark:bg-darkpanel rounded-2xl p-5 border border-gray-100 dark:border-darkborder shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <span class={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.isBlue ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : stat.isPurple ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-primary/10 text-primary'}`}>{stat.trend}</span>
              </div>
              <div class={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${stat.isBlue ? 'bg-blue-500/20 text-blue-500' : stat.isPurple ? 'bg-purple-500/20 text-purple-500' : 'bg-primary/20 text-primary'}`}>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon}></path></svg>
              </div>
            </div>
            <h3 class={`text-2xl font-bold mt-1 ${stat.isBlue ? 'text-blue-500' : stat.isPurple ? 'text-purple-500' : 'text-primary'}`}>{stat.value}</h3>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">{stat.desc}</p>
            {/* Dekorasi Garis SVG Kecil (Mimik Gambar) */}
            {i === 0 && (
               <svg class="absolute bottom-2 right-2 w-16 h-8 text-primary/30" viewBox="0 0 100 30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 25 Q 25 25, 40 15 T 70 10 T 95 5"/></svg>
            )}
          </div>
        ))}
      </div>

      {/* Bagian Grafik Tengah */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Penjualan (Kiri, Lebih Lebar) */}
        <div class="lg:col-span-2 bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">Grafik Penjualan</h3>
            <select class="text-xs bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg px-3 py-1.5 outline-none dark:text-gray-300">
              <option>7 Hari Terakhir</option>
              <option>Bulan Ini</option>
            </select>
          </div>
          <div class="relative h-64 w-full">
            <canvas id="salesChart"></canvas>
          </div>
        </div>

        {/* Grafik Metode (Kanan, Donut) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-6">Penjualan Berdasarkan Metode</h3>
          <div class="relative h-48 w-full flex justify-center mb-4">
            <canvas id="methodChart"></canvas>
          </div>
          <div class="space-y-3 mt-6 text-sm">
             <div class="flex justify-between items-center"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-primary"></span><span class="text-gray-600 dark:text-gray-400">Tunai</span></div><span class="text-gray-800 dark:text-gray-200 font-medium">53.8%</span></div>
             <div class="flex justify-between items-center"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-500"></span><span class="text-gray-600 dark:text-gray-400">QRIS</span></div><span class="text-gray-800 dark:text-gray-200 font-medium">28.9%</span></div>
             <div class="flex justify-between items-center"><div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-500"></span><span class="text-gray-600 dark:text-gray-400">Transfer</span></div><span class="text-gray-800 dark:text-gray-200 font-medium">17.0%</span></div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Produk, Stok, Aktivitas */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Produk Terlaris */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-gray-800 dark:text-white">Produk Terlaris</h3>
            <button class="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:text-white transition">Lihat Semua</button>
          </div>
          <div class="space-y-4">
             {[
               { name: 'Kopi Susu Gula Aren', sold: 432, price: 'Rp6.480.000', img: '☕' },
               { name: 'Ayam Geprek Sambal Matah', sold: 312, price: 'Rp4.680.000', img: '🍗' },
               { name: 'Es Teh Manis', sold: 298, price: 'Rp2.980.000', img: '🍹' },
               { name: 'Nasi Ayam Penyet', sold: 256, price: 'Rp2.560.000', img: '🍱' },
             ].map((prod, i) => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-6 text-center text-xs font-bold text-primary bg-primary/10 rounded">{i+1}</div>
                    <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-darkbg flex items-center justify-center text-xl">{prod.img}</div>
                    <div>
                      <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{prod.name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{prod.sold} terjual</p>
                    </div>
                  </div>
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{prod.price}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Stok Menipis */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-gray-800 dark:text-white">Stok Menipis</h3>
            <button class="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:text-white transition">Lihat Semua</button>
          </div>
          <div class="space-y-4">
             {[
               { name: 'Biji Kopi Arabica', stock: 8, img: '🫘' },
               { name: 'Gula Aren Cair', stock: 5, img: '🍯' },
               { name: 'Susu Full Cream', stock: 6, img: '🥛' },
               { name: 'Straw Sedotan', stock: 10, img: '🥤' },
             ].map(item => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-darkbg flex items-center justify-center text-xl">{item.img}</div>
                    <div>
                      <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Stok tersisa</p>
                    </div>
                  </div>
                  <div class="px-2.5 py-1 rounded-md bg-red-100/50 text-red-500 font-bold text-xs">{item.stock}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Aktivitas Terbaru (Relational Data Asli DB) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <h3 class="font-bold text-gray-800 dark:text-white mb-4">Aktivitas Transaksi Terbaru</h3>
          <div class="space-y-5">
            {recentOrders.results.length === 0 ? (
              <p class="text-sm text-gray-400 italic">Belum ada data transaksi.</p>
            ) : recentOrders.results.map((order: any) => (
               <div class="flex gap-3">
                 <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                 </div>
                 <div class="flex-1 min-w-0">
                   <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">Transaksi #{order.id.substring(0,8)}</p>
                   <p class="text-xs text-gray-500 dark:text-gray-400">{order.user_name} • {formatter.format(order.total_price)}</p>
                 </div>
                 <div class="text-[10px] text-gray-400 whitespace-nowrap">
                   {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                 </div>
               </div>
            ))}
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2 mt-4 text-xs text-gray-400">
         <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
         Data diperbarui otomatis dari D1 Database
      </div>

      {/* Script Inisialisasi Chart.js */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Helper untuk mendapatkan warna RGB dari CSS Variable (Tema)
          function getPrimaryColor() {
             const rgbStr = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
             return rgbStr ? \`rgba(\${rgbStr.replace(/ /g, ',')}, 1)\` : '#10b981';
          }
          function getPrimaryColorTrans() {
             const rgbStr = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
             return rgbStr ? \`rgba(\${rgbStr.replace(/ /g, ',')}, 0.2)\` : 'rgba(16,185,129,0.2)';
          }

          let salesChart, methodChart;

          function initCharts() {
            const isDark = document.documentElement.classList.contains('dark');
            const gridColor = isDark ? '#374151' : '#f3f4f6';
            const textColor = isDark ? '#9ca3af' : '#6b7280';
            
            Chart.defaults.color = textColor;
            Chart.defaults.font.family = 'Inter';

            // 1. Line Chart
            const ctxSales = document.getElementById('salesChart').getContext('2d');
            if(salesChart) salesChart.destroy();
            
            // Gradient fill
            let gradient = ctxSales.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, getPrimaryColorTrans());
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            salesChart = new Chart(ctxSales, {
              type: 'line',
              data: {
                labels: ['20 Mei', '21 Mei', '22 Mei', '23 Mei', '24 Mei', '25 Mei', '26 Mei'],
                datasets: [{
                  label: 'Penjualan',
                  data: [5, 12, 19, 17, 38, 22, 30],
                  borderColor: getPrimaryColor(),
                  backgroundColor: gradient,
                  borderWidth: 3,
                  tension: 0.4,
                  fill: true,
                  pointBackgroundColor: getPrimaryColor(),
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: gridColor }, ticks: { callback: function(val) { return val + 'jt'; } } },
                  x: { grid: { display: false } }
                }
              }
            });

            // 2. Doughnut Chart
            const ctxMethod = document.getElementById('methodChart').getContext('2d');
            if(methodChart) methodChart.destroy();
            methodChart = new Chart(ctxMethod, {
              type: 'doughnut',
              data: {
                labels: ['Tunai', 'QRIS', 'Transfer'],
                datasets: [{
                  data: [53.8, 28.9, 17.0],
                  backgroundColor: [getPrimaryColor(), '#3b82f6', '#a855f7'],
                  borderWidth: 0,
                  hoverOffset: 4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } }
              }
            });
          }

          // Inisialisasi saat DOM siap
          document.addEventListener('DOMContentLoaded', initCharts);
          
          // Re-inisialisasi ketika Dark Mode / Warna Tema berubah (di-trigger oleh script _renderer)
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.attributeName === 'class') initCharts();
            });
          });
          observer.observe(document.documentElement, { attributes: true });
          window.addEventListener('theme-changed', initCharts);
        `
      }} />
    </div>,
    { title: 'Dashboard - SPOS' }
  )
})

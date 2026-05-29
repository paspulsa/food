import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // 1. Eksekusi Kueri Paralel (Batch) untuk efisiensi
  const [
    usersCount, 
    restaurantsCount, 
    ordersCount, 
    revenueGross, 
    revenueNet,
    recentOrders,
    topProductsReq,
    methodReq,
    salesReq
  ] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as t FROM users'),
    c.env.DB.prepare('SELECT COUNT(*) as t FROM restaurants'),
    c.env.DB.prepare("SELECT COUNT(*) as t FROM orders WHERE status NOT IN ('CANCELLED')"),
    // Total Nilai Transaksi Kotor
    c.env.DB.prepare("SELECT SUM(total_price) as t FROM orders WHERE status IN ('COMPLETED', 'PROCESSING', 'PAID')"),
    // Total Pemasukan Bersih (Dari Transaksi QRIS yang Lunas)
    c.env.DB.prepare("SELECT SUM(final_amount) as t FROM transactions WHERE status IN ('PAID', 'SETTLEMENT')"),
    
    // Aktivitas Transaksi Terbaru
    c.env.DB.prepare(`
      SELECT o.id, o.total_price, o.status, o.created_at, u.name as user_name 
      FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5
    `),
    
    // Produk Terlaris
    c.env.DB.prepare(`
      SELECT m.name, m.image, m.price, SUM(od.quantity) as sold
      FROM order_details od
      JOIN menu_items m ON od.menu_item_id = m.id
      JOIN orders o ON od.order_id = o.id
      WHERE o.status IN ('COMPLETED', 'PROCESSING', 'PAID')
      GROUP BY m.id
      ORDER BY sold DESC
      LIMIT 5
    `),

    // Distribusi Metode Pembayaran
    c.env.DB.prepare(`
      SELECT payment_method, COUNT(*) as count
      FROM orders
      WHERE status NOT IN ('CANCELLED', 'PENDING') AND payment_method IS NOT NULL
      GROUP BY payment_method
    `),

    // Grafik Penjualan (7 Hari Terakhir)
    c.env.DB.prepare(`
      SELECT date(created_at) as order_date, SUM(total_price) as daily_total
      FROM orders
      WHERE status IN ('COMPLETED', 'PROCESSING', 'PAID')
      GROUP BY order_date
      ORDER BY order_date DESC
      LIMIT 7
    `)
  ]);

  // Cek Tabel Stok secara terpisah (menggunakan try-catch agar jika kolom 'stock' tidak ada, halaman tidak 500)
  let lowStockItems = [];
  try {
     const res = await c.env.DB.prepare('SELECT name, stock, image FROM menu_items WHERE stock <= 15 ORDER BY stock ASC LIMIT 5').all();
     lowStockItems = res.results;
  } catch (e) {
     lowStockItems = []; // Fallback jika kolom stock tidak digunakan di schema
  }

  // Pengolahan Variabel Metrik Kartu
  const totalUsers = usersCount.results[0]?.t || 0;
  const totalRestos = restaurantsCount.results[0]?.t || 0;
  const totalOrders = ordersCount.results[0]?.t || 0;
  const totalGrossRev = revenueGross.results[0]?.t || 0;
  const totalNetRev = revenueNet.results[0]?.t || 0;

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // Pengolahan Data untuk Chart.js (Grafik Penjualan)
  // Di-reverse agar urutan tanggal dari yang terlama ke terbaru (kiri ke kanan)
  const rawSales = salesReq.results.reverse(); 
  const salesLabels = rawSales.map((s: any) => {
      // Format tanggal ke 'DD MMM' (Misal: 24 Mei)
      const d = new Date(s.order_date);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  });
  const salesValues = rawSales.map((s: any) => s.daily_total);

  // Pengolahan Data untuk Chart.js (Metode Pembayaran)
  const methods = methodReq.results;
  const methodLabels = methods.map((m: any) => m.payment_method);
  const methodCounts = methods.map((m: any) => m.count);

  // Kalkulasi Persentase Metode Pembayaran
  const totalMethodCount = methodCounts.reduce((a: number, b: number) => a + b, 0);
  const methodPercentages = methods.map((m: any) => ({
      label: m.payment_method,
      percentage: totalMethodCount > 0 ? ((m.count / totalMethodCount) * 100).toFixed(1) : 0
  }));

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
          {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Omset', value: formatter.format(totalGrossRev as number), desc: `Dari ${totalOrders} transaksi sukses`, icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', trend: 'Data Asli DB' },
          { label: 'Pemasukan Tunai/QRIS', value: formatter.format(totalNetRev as number), desc: 'Uang masuk real', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', trend: 'Data Asli DB' },
          { label: 'Total Pesanan Masuk', value: totalOrders.toLocaleString('id-ID'), desc: 'Semua tipe order', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', trend: 'Data Asli DB', isBlue: true },
          { label: 'Total Pengguna', value: totalUsers.toLocaleString('id-ID'), desc: 'Member terdaftar', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', trend: 'Data Asli DB', isPurple: true },
        ].map((stat, i) => (
          <div class="bg-white dark:bg-darkpanel rounded-2xl p-5 border border-gray-100 dark:border-darkborder shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div class="flex justify-between items-start mb-2">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <span class={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stat.isBlue ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : stat.isPurple ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-primary/10 text-primary'}`}>{stat.trend}</span>
              </div>
              <div class={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${stat.isBlue ? 'bg-blue-500/20 text-blue-500' : stat.isPurple ? 'bg-purple-500/20 text-purple-500' : 'bg-primary/20 text-primary'}`}>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon}></path></svg>
              </div>
            </div>
            <h3 class={`text-2xl font-bold mt-1 ${stat.isBlue ? 'text-blue-500' : stat.isPurple ? 'text-purple-500' : 'text-primary'}`}>{stat.value}</h3>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">{stat.desc}</p>
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
            <span class="text-xs bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg px-3 py-1.5 outline-none dark:text-gray-300">
              7 Hari Terakhir
            </span>
          </div>
          <div class="relative h-64 w-full flex items-center justify-center">
            {salesLabels.length === 0 ? (
               <p class="text-sm text-gray-400 italic">Belum ada data penjualan 7 hari terakhir.</p>
            ) : (
               <canvas id="salesChart"></canvas>
            )}
          </div>
        </div>

        {/* Grafik Metode (Kanan, Donut) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm flex flex-col">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-6">Metode Pembayaran</h3>
          {methodLabels.length === 0 ? (
             <div class="flex-1 flex items-center justify-center"><p class="text-sm text-gray-400 italic">Data belum tersedia.</p></div>
          ) : (
             <>
               <div class="relative h-48 w-full flex justify-center mb-4">
                 <canvas id="methodChart"></canvas>
               </div>
               <div class="space-y-3 mt-auto text-sm">
                 {methodPercentages.map((mp: any, idx: number) => {
                    const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
                    return (
                       <div class="flex justify-between items-center">
                         <div class="flex items-center gap-2">
                            <span class={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`}></span>
                            <span class="text-gray-600 dark:text-gray-400">{mp.label}</span>
                         </div>
                         <span class="text-gray-800 dark:text-gray-200 font-medium">{mp.percentage}%</span>
                       </div>
                    );
                 })}
               </div>
             </>
          )}
        </div>
      </div>

      {/* Bagian Bawah: Produk, Stok, Aktivitas */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Produk Terlaris (Real Database) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-gray-800 dark:text-white">Produk Terlaris</h3>
          </div>
          <div class="space-y-4">
             {topProductsReq.results.length === 0 ? (
               <p class="text-sm text-gray-400 italic">Belum ada data penjualan produk.</p>
             ) : topProductsReq.results.map((prod: any, i: number) => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-6 h-6 flex items-center justify-center text-xs font-bold text-primary bg-primary/10 rounded">{i+1}</div>
                    <img src={prod.image || 'https://ui-avatars.com/api/?name=Menu&background=f3f4f6&color=9ca3af'} class="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-700" alt="Produk" />
                    <div>
                      <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{prod.name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{prod.sold} terjual</p>
                    </div>
                  </div>
                  <div class="text-xs font-medium text-gray-700 dark:text-gray-300">{formatter.format(prod.price)}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Stok Menipis (Real Database) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-gray-800 dark:text-white">Peringatan Stok</h3>
          </div>
          <div class="space-y-4">
             {lowStockItems.length === 0 ? (
                <p class="text-sm text-gray-400 italic">Semua stok aman atau fitur stok belum dikonfigurasi.</p>
             ) : lowStockItems.map((item: any) => (
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img src={item.image || 'https://ui-avatars.com/api/?name=Stok&background=fee2e2&color=ef4444'} class="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-700" alt="Stok" />
                    <div>
                      <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">{item.name}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Sisa stok gudang</p>
                    </div>
                  </div>
                  <div class="px-2.5 py-1 rounded-md bg-red-100/50 text-red-500 font-bold text-xs">{item.stock}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Aktivitas Terbaru (Real Database) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder p-5 shadow-sm">
          <h3 class="font-bold text-gray-800 dark:text-white mb-4">Aktivitas Terbaru</h3>
          <div class="space-y-5">
            {recentOrders.results.length === 0 ? (
              <p class="text-sm text-gray-400 italic">Belum ada data transaksi.</p>
            ) : recentOrders.results.map((order: any) => {
               // Warna Icon Berdasarkan Status
               let stColor = 'text-gray-500 bg-gray-100 dark:bg-gray-800';
               if (order.status === 'COMPLETED') stColor = 'text-green-500 bg-green-100 dark:bg-green-900/30';
               if (order.status === 'PENDING' || order.status === 'UNPAID') stColor = 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
               if (order.status === 'PROCESSING' || order.status === 'PAID') stColor = 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';

               return (
               <div class="flex gap-3">
                 <div class={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${stColor}`}>
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                 </div>
                 <div class="flex-1 min-w-0">
                   <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {order.user_name || 'Tamu'} <span class="text-xs font-normal text-gray-400">({order.status})</span>
                   </p>
                   <p class="text-xs font-bold text-gray-500 dark:text-gray-400">{formatter.format(order.total_price)}</p>
                 </div>
                 <div class="text-[10px] text-gray-400 whitespace-nowrap">
                   {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                 </div>
               </div>
               );
            })}
          </div>
        </div>
      </div>
      
      <div class="flex items-center justify-center sm:justify-start gap-2 mt-4 text-xs text-gray-400 pb-10">
         <span class="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
         Seluruh data diperbarui sinkron otomatis dari Database D1
      </div>

      {/* Script Inisialisasi Chart.js menggunakan Data DB Asli */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Data dari Database Asli (Inject dari Backend)
          const dbSalesLabels = ${JSON.stringify(salesLabels)};
          const dbSalesValues = ${JSON.stringify(salesValues)};
          const dbMethodLabels = ${JSON.stringify(methodLabels)};
          const dbMethodCounts = ${JSON.stringify(methodCounts)};

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

            // 1. Line Chart (Grafik Penjualan Asli)
            const ctxSales = document.getElementById('salesChart');
            if (ctxSales && dbSalesLabels.length > 0) {
               if(salesChart) salesChart.destroy();
               
               let gradient = ctxSales.getContext('2d').createLinearGradient(0, 0, 0, 300);
               gradient.addColorStop(0, getPrimaryColorTrans());
               gradient.addColorStop(1, 'rgba(0,0,0,0)');

               salesChart = new Chart(ctxSales.getContext('2d'), {
                 type: 'line',
                 data: {
                   labels: dbSalesLabels,
                   datasets: [{
                     label: 'Penjualan Kotor (Rp)',
                     data: dbSalesValues,
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
                     y: { 
                        beginAtZero: true, 
                        grid: { color: gridColor }, 
                        ticks: { callback: function(val) { return 'Rp' + (val / 1000) + 'k'; } } 
                     },
                     x: { grid: { display: false } }
                   }
                 }
               });
            }

            // 2. Doughnut Chart (Metode Pembayaran Asli)
            const ctxMethod = document.getElementById('methodChart');
            if (ctxMethod && dbMethodLabels.length > 0) {
               if(methodChart) methodChart.destroy();
               methodChart = new Chart(ctxMethod.getContext('2d'), {
                 type: 'doughnut',
                 data: {
                   labels: dbMethodLabels,
                   datasets: [{
                     data: dbMethodCounts,
                     backgroundColor: [getPrimaryColor(), '#3b82f6', '#a855f7', '#f97316'],
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
          }

          // Inisialisasi saat DOM siap
          document.addEventListener('DOMContentLoaded', initCharts);
          
          // Re-inisialisasi ketika Dark Mode berubah
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
    { title: 'Dashboard - Admin Kedai Pangsit' }
  )
})

import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil SELURUH Data Transaksi dari DB (Limit 1000 untuk keamanan memori sementara)
  const { results: orders } = await c.env.DB.prepare(`
    SELECT o.id, o.total_price, o.status, o.created_at, u.name as user_name, r.name as restaurant_name 
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN restaurants r ON o.restaurant_id = r.id
    ORDER BY o.created_at DESC LIMIT 1000
  `).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // Format data untuk dikirim ke Client-Side
  const orderData = orders.map((o: any) => ({
      id: o.id,
      user_name: o.user_name || 'Tamu / Sistem',
      restaurant_name: o.restaurant_name || '-',
      total_price: o.total_price,
      total_price_formatted: formatter.format(o.total_price),
      status: o.status,
      created_at: new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      raw_date: o.created_at
  }));

  const safeDataJson = JSON.stringify(orderData).replace(/</g, '\\u003c');

  return c.render(
    <div class="space-y-6 pb-12 print:m-0 print:p-0">
      
      {/* CSS KHUSUS PRINT PDF */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print-table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; }
            .print-table th, .print-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            .print-table th { background-color: #f3f4f6; font-weight: bold; }
          }
        `
      }} />

      {/* HEADER PAGE */}
      <div class="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Manajemen Alur Distribusi Pesanan</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Pantau dan ubah status siklus pemrosesan serta pengantaran pesanan kuliner secara real-time.</p>
        </div>
      </div>

      {/* FILTER & EXPORT CONTROLS */}
      <div class="print:hidden bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
         
         {/* Kiri: Filter Selectors */}
         <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div class="flex items-center bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl px-3 py-2 w-full sm:w-auto focus-within:border-primary transition-colors">
               <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
               <input type="text" id="search-input" placeholder="Cari ID, Nama, Resto..." class="bg-transparent text-xs w-full outline-none text-gray-800 dark:text-gray-200" onkeyup="renderTable()" />
            </div>

            <select id="status-filter" class="text-xs bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl px-3 py-2.5 outline-none text-gray-800 dark:text-gray-200 cursor-pointer" onchange="renderTable()">
               <option value="ALL">Semua Status</option>
               <option value="PENDING">PENDING</option>
               <option value="PROCESSING">PROCESSING</option>
               <option value="COMPLETED">COMPLETED</option>
               <option value="CANCELLED">CANCELLED</option>
            </select>

            <div class="flex items-center gap-2">
               <span class="text-xs text-gray-500 font-bold">Tampilkan:</span>
               <select id="per-page" class="text-xs font-bold bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl px-3 py-2 outline-none text-gray-800 dark:text-gray-200 cursor-pointer" onchange="changePageSize()">
                 <option value="10">10</option>
                 <option value="20">20</option>
                 <option value="50">50</option>
                 <option value="100">100</option>
               </select>
            </div>
         </div>

         {/* Kanan: Export Buttons */}
         <div class="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button onclick="exportToExcel()" class="text-xs font-bold bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 px-4 py-2.5 rounded-xl border border-green-200 dark:border-green-800 transition-colors flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               Excel
            </button>
            <button onclick="window.print()" class="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 transition-colors flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
               PDF / Print
            </button>
         </div>
      </div>

      {/* TABLE WRAPPER (UI WEB) */}
      <div class="print:hidden bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden flex flex-col">
        <div class="overflow-x-auto min-h-[400px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/70 dark:bg-darkbg/50 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
                <th class="px-6 py-4 font-semibold w-1/6">ID & Tanggal</th>
                <th class="px-6 py-4 font-semibold w-2/6">Pelanggan & Gerai</th>
                <th class="px-6 py-4 font-semibold w-1/6">Total Tagihan</th>
                <th class="px-6 py-4 font-semibold w-1/6 text-center">Status</th>
                <th class="px-6 py-4 text-right font-semibold w-1/6">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody id="table-body" class="divide-y divide-gray-50 dark:divide-darkborder text-sm">
               {/* Di-Render oleh JS */}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION CONTROLS */}
        <div class="border-t border-gray-100 dark:border-darkborder p-4 bg-gray-50/50 dark:bg-darkbg/30 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-bold">
           <span id="page-info">Menampilkan 0-0 dari 0 data</span>
           <div class="flex items-center gap-2">
              <button onclick="prevPage()" id="btn-prev" class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                 &laquo; Prev
              </button>
              <div id="page-numbers" class="flex gap-1"></div>
              <button onclick="nextPage()" id="btn-next" class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                 Next &raquo;
              </button>
           </div>
        </div>
      </div>

      {/* ========================================================
          LAYOUT KHUSUS UNTUK PRINT PDF/EXCEL (Tersembunyi di Layar)
          ======================================================== */}
      <div class="hidden print:block">
         <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>LAPORAN DATA PESANAN - SPOS</h2>
         <p style={{ fontSize: '12px', marginBottom: '15px', textAlign: 'center' }}>Tanggal Cetak: {new Date().toLocaleString('id-ID')}</p>
         
         <table class="print-table" id="print-table-element">
            <thead>
               <tr>
                  <th>No</th>
                  <th>ID Pesanan</th>
                  <th>Tanggal</th>
                  <th>Nama Pelanggan</th>
                  <th>Cabang / Mitra</th>
                  <th>Total Tagihan (Rp)</th>
                  <th>Status</th>
               </tr>
            </thead>
            <tbody id="print-tbody">
               {/* Di-Render oleh JS Khusus Filter yang Aktif Saja */}
            </tbody>
         </table>
      </div>

      {/* JAVASCRIPT: LOGIKA FILTER, PAGINASI, EXPORT */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Data Induk dari Server
        const ALL_ORDERS = ${safeDataJson};
        
        // State
        let filteredOrders = [...ALL_ORDERS];
        let currentPage = 1;
        let pageSize = 10;

        // Element Referensi
        const tbody = document.getElementById('table-body');
        const printTbody = document.getElementById('print-tbody');
        const searchInput = document.getElementById('search-input');
        const statusFilter = document.getElementById('status-filter');
        const pageInfo = document.getElementById('page-info');
        const pageNumbers = document.getElementById('page-numbers');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');

        // Fungsi Helper Warna Status
        function getStatusBadge(status) {
           if(status === 'COMPLETED') return 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20';
           if(status === 'PENDING') return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-500/20';
           if(status === 'CANCELLED') return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20';
           return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
        }

        function filterData() {
           const keyword = searchInput.value.toLowerCase();
           const status = statusFilter.value;

           filteredOrders = ALL_ORDERS.filter(o => {
              const matchKeyword = o.id.toLowerCase().includes(keyword) || 
                                   o.user_name.toLowerCase().includes(keyword) || 
                                   o.restaurant_name.toLowerCase().includes(keyword);
              const matchStatus = status === 'ALL' || o.status === status;
              return matchKeyword && matchStatus;
           });

           currentPage = 1; // Reset ke hal 1 setiap kali filter berubah
        }

        function renderTable() {
           filterData();
           
           const totalPages = Math.ceil(filteredOrders.length / pageSize);
           if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

           const startIdx = (currentPage - 1) * pageSize;
           const endIdx = startIdx + pageSize;
           const currentData = filteredOrders.slice(startIdx, endIdx);

           // 1. RENDER WEB TABLE
           if (currentData.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-12 text-center text-gray-400 italic bg-white dark:bg-darkpanel">Tidak ada data ditemukan.</td></tr>';
           } else {
              tbody.innerHTML = currentData.map(o => \`
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4">
                     <a href="/admin/orders/\${o.id}" class="font-bold font-mono text-xs text-primary hover:underline block">#\${o.id.substring(0,8)}</a>
                     <span class="text-[10px] text-gray-400 mt-1 block">\${o.created_at}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="font-semibold text-gray-800 dark:text-gray-200">\${o.user_name}</div>
                    <div class="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 inline-block px-1.5 py-0.5 rounded mt-0.5">\${o.restaurant_name}</div>
                  </td>
                  <td class="px-6 py-4 font-black text-gray-800 dark:text-gray-200">\${o.total_price_formatted}</td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border \${getStatusBadge(o.status)}">\${o.status}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <select class="text-xs font-bold border border-gray-200 dark:border-darkborder rounded-xl p-2 bg-gray-50 dark:bg-darkbg text-gray-800 dark:text-white focus:outline-none focus:border-primary cursor-pointer transition-colors" onchange="changeStatusTrx('\${o.id}', this.value)">
                      \${['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map(st => \`<option value="\${st}" \${o.status === st ? 'selected' : ''}>\${st}</option>\`).join('')}
                    </select>
                  </td>
                </tr>
              \`).join('');
           }

           // 2. RENDER PRINT TABLE (Semua hasil filter, tanpa paginasi)
           printTbody.innerHTML = filteredOrders.map((o, idx) => \`
              <tr>
                 <td style="text-align:center;">\${idx + 1}</td>
                 <td>\${o.id}</td>
                 <td>\${o.created_at}</td>
                 <td>\${o.user_name}</td>
                 <td>\${o.restaurant_name}</td>
                 <td style="text-align:right;">\${o.total_price}</td>
                 <td>\${o.status}</td>
              </tr>
           \`).join('');

           // UPDATE PAGINATION CONTROLS
           pageInfo.innerText = \`Menampilkan \${filteredOrders.length > 0 ? startIdx + 1 : 0}-\${Math.min(endIdx, filteredOrders.length)} dari \${filteredOrders.length} data\`;
           
           btnPrev.disabled = currentPage === 1;
           btnNext.disabled = currentPage === totalPages || totalPages === 0;

           // Render Nomor Halaman (Maks 5 Tombol)
           let pagesHtml = '';
           let startPage = Math.max(1, currentPage - 2);
           let endPage = Math.min(totalPages, startPage + 4);
           if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

           for(let i = startPage; i <= endPage; i++) {
              if (i === currentPage) {
                 pagesHtml += \`<button class="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg shadow-md pointer-events-none">\${i}</button>\`;
              } else {
                 pagesHtml += \`<button onclick="goToPage(\${i})" class="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">\${i}</button>\`;
              }
           }
           pageNumbers.innerHTML = pagesHtml;
        }

        // Action Pagination
        window.changePageSize = () => { pageSize = parseInt(document.getElementById('per-page').value); renderTable(); }
        window.nextPage = () => { currentPage++; renderTable(); }
        window.prevPage = () => { currentPage--; renderTable(); }
        window.goToPage = (p) => { currentPage = p; renderTable(); }

        // Action Ubah Status API Backend
        window.changeStatusTrx = async (orderId, nextStatus) => {
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          if (!token) return alert('Otorisasi kedaluwarsa.');
          
          try {
            const res = await fetch('/api/v1/protected/admin/orders/' + orderId + '/status', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify({ status: nextStatus })
            });
            const data = await res.json();
            if(data.success) {
               // Update State Lokal biar tidak perlu refresh page
               const target = ALL_ORDERS.find(o => o.id === orderId);
               if(target) target.status = nextStatus;
               renderTable();
            }
            else alert(data.message || 'Gagal mengubah status.');
          } catch(e) {
            alert('Gangguan jaringan serverless.');
          }
        }

        // Fitur Export Excel Sederhana
        window.exportToExcel = () => {
           if(filteredOrders.length === 0) return alert('Tidak ada data untuk diekspor');
           
           let csvContent = "data:text/csv;charset=utf-8,No,ID Pesanan,Tanggal,Pelanggan,Gerai,Tagihan,Status\\n";
           
           filteredOrders.forEach((o, index) => {
              // Bersihkan koma agar format CSV tidak pecah
              const row = [
                 index + 1,
                 o.id,
                 o.created_at.replace(/,/g, ''),
                 o.user_name.replace(/,/g, ''),
                 o.restaurant_name.replace(/,/g, ''),
                 o.total_price,
                 o.status
              ].join(",");
              csvContent += row + "\\r\\n";
           });

           const encodedUri = encodeURI(csvContent);
           const link = document.createElement("a");
           link.setAttribute("href", encodedUri);
           link.setAttribute("download", \`Laporan_Pesanan_\${new Date().toISOString().slice(0,10)}.csv\`);
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
        }

        // Init Pertama Kali
        document.addEventListener('DOMContentLoaded', () => { renderTable(); });
      `}} />
    </div>
  , { title: 'Manajemen Transaksi - Admin SPOS' })
})

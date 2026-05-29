import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const config = await c.env.DB.prepare('SELECT * FROM config WHERE id = 1').first<any>();
  const isConnected = !!(config && config.access_token);
  const merchantName = config?.merchant_name || 'Belum Terhubung';

  return c.render(
    <div class="space-y-6 pb-10">
      {/* Dependency Eksternal */}
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
      
      {/* JS PDF untuk Export Laporan */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>

      {/* HEADER SECTION */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            Integrasi GoPay Merchant
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Sistem Gateway QRIS Dinamis dan Sinkronisasi Saldo Real-time.</p>
        </div>
        <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
          <div class={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span class="text-sm font-bold text-gray-700 dark:text-gray-300">{isConnected ? `Online: ${merchantName}` : 'Offline'}</span>
        </div>
      </div>

      {/* TABS NAVIGATION (Hanya 3 Tab) */}
      <div class="flex overflow-x-auto hide-scrollbar gap-2 bg-white dark:bg-darkpanel p-2 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <button onclick="switchTab('auth')" id="tab-auth" class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">🔑 Otentikasi</button>
        <button onclick="switchTab('dash')" id="tab-dash" class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">📊 Dashboard</button>
        <button onclick="switchTab('qris')" id="tab-qris" class="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">⚡ QRIS Dinamis</button>
      </div>

      {/* KONTEN TABS */}
      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm p-6 relative min-h-[400px]">
        
        {/* TAB 1: OTENTIKASI LOKAL */}
        <div id="view-auth" class="tab-content block max-w-md mx-auto mt-4">
          <div class="text-center mb-6">
            <h3 class="text-xl font-black text-gray-800 dark:text-white">Login GoBiz/GoPay</h3>
            <p class="text-xs text-gray-500 mt-1">Masukkan email terdaftar Anda untuk menerima OTP.</p>
          </div>
          
          <div id="step-email">
            <input id="l_email" type="email" placeholder="nama@email.com" class="w-full px-4 py-3 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none mb-4 dark:text-white" />
            <button onclick="requestOtp()" id="btn-otp" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-green-500/20">Kirim OTP</button>
          </div>

          <div id="step-otp" class="hidden">
            <input id="l_otp" type="number" placeholder="Masukkan 4 Digit OTP" class="w-full px-4 py-3 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-xl text-center tracking-[0.5em] font-black text-xl focus:ring-2 focus:ring-green-500 outline-none mb-4 dark:text-white" />
            <input type="hidden" id="l_token" />
            <input type="hidden" id="l_device" />
            <button onclick="verifyOtp()" id="btn-verify" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-green-500/20">Verifikasi OTP</button>
            <button onclick="location.reload()" class="w-full text-xs font-bold text-gray-400 mt-4 hover:underline">Batal</button>
          </div>

          {isConnected && (
            <div class="mt-10 p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/30 text-center">
              <p class="text-xs text-red-600 dark:text-red-400 font-bold mb-3">Sesi Anda sedang aktif.</p>
              <button onclick="logoutGoBiz()" class="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-xs font-bold transition">Putuskan Koneksi (Logout)</button>
            </div>
          )}
        </div>

        {/* TAB 2: DASHBOARD & MUTASI */}
        <div id="view-dash" class="tab-content hidden space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-600 text-white p-5 rounded-2xl shadow-lg shadow-green-600/30 flex flex-col justify-between">
              {/* PERUBAHAN: Teks "10 Malam" dibuang, diganti ID dinamis */}
              <p class="text-sm font-medium text-green-100" id="d-bal-label">Saldo (Menghitung...)</p>
              <h3 class="text-2xl font-black mt-2 truncate" id="d-bal">Rp ...</h3>
            </div>
            <div class="bg-gray-50 dark:bg-darkbg border border-gray-100 dark:border-gray-700 p-5 rounded-2xl flex flex-col justify-between">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Hari Ini</p>
              <h3 class="text-xl font-black text-gray-800 dark:text-white mt-2 truncate" id="d-today">Rp ...</h3>
            </div>
            <div class="bg-gray-50 dark:bg-darkbg border border-gray-100 dark:border-gray-700 p-5 rounded-2xl flex flex-col justify-between">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Minggu Ini</p>
              <h3 class="text-xl font-black text-gray-800 dark:text-white mt-2 truncate" id="d-week">Rp ...</h3>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl flex flex-col justify-between">
              <p class="text-xs font-bold text-blue-500 uppercase tracking-wider">Bulan Ini</p>
              <h3 class="text-xl font-black text-blue-600 mt-2 truncate" id="d-month">Rp ...</h3>
            </div>
          </div>

          <div class="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex gap-2 border-b border-gray-100 dark:border-gray-700 items-center justify-between">
              <div class="flex gap-2">
                <button onclick="loadMutations('today')" class="bg-white dark:bg-darkpanel text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-green-600 transition">Hari Ini</button>
                <button onclick="loadMutations('week')" class="bg-white dark:bg-darkpanel text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-green-600 transition">Minggu Ini</button>
                <button onclick="loadMutations('month')" class="bg-white dark:bg-darkpanel text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-green-600 transition">Bulan Ini</button>
              </div>
              
              <button onclick="exportDataToPDF()" class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"></path></svg>
                Export PDF
              </button>
            </div>
            <div class="overflow-x-auto max-h-64 overflow-y-auto">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-white dark:bg-darkpanel text-xs uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700 sticky top-0">
                  <tr><th class="p-4">Waktu</th><th class="p-4">Reference / Order ID</th><th class="p-4">Status</th><th class="p-4 text-right">Nominal</th></tr>
                </thead>
                <tbody id="t-mut" class="divide-y divide-gray-50 dark:divide-gray-800/50 text-gray-700 dark:text-gray-300">
                  <tr><td colspan="4" class="p-4 text-center italic">Memuat data mutasi...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TAB 3: QRIS DINAMIS */}
        <div id="view-qris" class="tab-content hidden space-y-6">
          <div class="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-xl flex gap-3 text-sm text-yellow-800 dark:text-yellow-400">
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
            <p><strong>Penting:</strong> Unggah gambar kode QRIS Statis dari gerai Anda. Sistem akan mengekstrak kode RAW-nya untuk disuntikkan nominal unik.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Range Angka Unik</label>
                <div class="flex gap-3">
                  <input id="c_min" type="number" placeholder="Min (1)" value={config?.unique_min || 1} class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white focus:outline-none focus:border-green-500" />
                  <input id="c_max" type="number" placeholder="Max (999)" value={config?.unique_max || 999} class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-lg text-sm dark:text-white focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">RAW String QRIS</label>
                <textarea id="c_raw" rows={4} class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono dark:text-white focus:outline-none focus:border-green-500 break-all">{config?.master_raw_qris || ''}</textarea>
              </div>
              <div class="flex gap-2">
                <input type="file" id="f_qr" class="hidden" accept="image/*" onchange="decodeQR(this)" />
                <button onclick="document.getElementById('f_qr').click()" class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl transition text-sm">Upload QR Image</button>
                <button onclick="saveQrisConfig()" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow-md transition text-sm">Simpan Konfigurasi</button>
              </div>
            </div>

            <div class="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col">
              <div class="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-100 dark:border-gray-700">
                <h4 class="text-xs font-bold text-gray-600 dark:text-gray-300">Log Injector (Terbaru)</h4>
              </div>
              <div class="overflow-y-auto flex-1 h-48 bg-white dark:bg-darkpanel p-2">
                <table class="w-full text-left text-xs whitespace-nowrap">
                  <tbody id="t-gen" class="divide-y divide-gray-50 dark:divide-gray-800 text-gray-600 dark:text-gray-400">
                    <tr><td class="p-2 italic text-center">Belum ada transaksi...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* JAVASCRIPT KONTROL LOGIKA */}
      <script dangerouslySetInnerHTML={{ __html: `
        function getAdminToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1] || '';
        }

        const api = {
          async fetchWithRetry(url, options) {
            const baseUrl = '/api/v1/protected/admin/gobiz';
            let res = await fetch(baseUrl + url, options);
            let data = await res.json().catch(() => ({}));

            if (res.status === 401 || data.error === 'Session expired') {
              console.warn('Sesi terdeteksi mati, mencoba auto-refresh...');
              const refreshRes = await fetch(baseUrl + '/refresh', { method: 'POST', headers: { 'Authorization': 'Bearer ' + getAdminToken() } });
              
              if (refreshRes.ok) {
                res = await fetch(baseUrl + url, options);
                data = await res.json().catch(() => ({}));
              } else {
                Swal.fire('Sesi Habis', 'Sesi login GoBiz Anda telah berakhir, silakan login ulang.', 'warning');
                switchTab('auth');
              }
            }
            return data;
          },
          get(url) { return this.fetchWithRetry(url, { headers: { 'Authorization': 'Bearer ' + getAdminToken() } }); },
          post(url, body) { return this.fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAdminToken() }, body: JSON.stringify(body) }); }
        };

        // UI NAVIGATION
        function switchTab(id) {
          document.querySelectorAll('.tab-content').forEach(e => e.classList.add('hidden'));
          document.querySelectorAll('[id^="tab-"]').forEach(e => {
            e.className = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800';
          });
          
          document.getElementById('view-' + id).classList.remove('hidden');
          document.getElementById('tab-' + id).className = 'flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400';
          
          if(id === 'dash') loadDashboardData();
          if(id === 'qris') loadInjectorLog();
        }

        // AUTHENTICATION LOGIC
        async function requestOtp() {
          const email = document.getElementById('l_email').value;
          if(!email) return Swal.fire('Error', 'Email wajib diisi', 'error');
          const btn = document.getElementById('btn-otp');
          btn.innerText = 'Mengirim...'; btn.disabled = true;
          try {
            const res = await api.post('/login', { email });
            if(res.status === 'success') {
              document.getElementById('step-email').classList.add('hidden');
              document.getElementById('step-otp').classList.remove('hidden');
              document.getElementById('l_token').value = res.otp_token;
              document.getElementById('l_device').value = res.device_id;
            } else Swal.fire('Gagal', res.error || 'Ditolak Gojek', 'error');
          } catch(e) { Swal.fire('Error', 'Koneksi terputus', 'error'); }
          btn.innerText = 'Kirim OTP'; btn.disabled = false;
        }

        async function verifyOtp() {
          const btn = document.getElementById('btn-verify');
          btn.innerText = 'Verifikasi...'; btn.disabled = true;
          try {
            const res = await api.post('/verify', {
              otp: document.getElementById('l_otp').value,
              otp_token: document.getElementById('l_token').value,
              device_id: document.getElementById('l_device').value
            });
            if(res.status === 'success') Swal.fire('Sukses', 'Terhubung ke GoBiz!', 'success').then(() => location.reload());
            else { Swal.fire('Gagal', res.error || 'OTP Salah', 'error'); btn.innerText = 'Verifikasi OTP'; btn.disabled = false; }
          } catch(e) { Swal.fire('Error', 'Koneksi terputus', 'error'); btn.innerText = 'Verifikasi OTP'; btn.disabled = false; }
        }

        async function logoutGoBiz() {
          if(confirm('Yakin putus koneksi GoBiz?')) { await api.post('/logout', {}); location.reload(); }
        }

        // DASHBOARD & MUTATIONS LOGIC
        window.activeMutations = [];
        window.activeFilter = 'hari ini';

        async function loadDashboardData() {
          try {
            const res = await api.get('/balance');
            if(res.status === 'success') {
              document.getElementById('d-bal').innerText = 'Rp ' + Math.floor(res.balance).toLocaleString('id-ID');
              
              // PERBAIKAN: Tampilkan waktu payout ke UI
              if (res.last_payout_label) {
                document.getElementById('d-bal-label').innerText = 'Saldo (Sejak ' + res.last_payout_label + ')';
              }
              
              document.getElementById('d-today').innerHTML = \`Rp \${Math.floor(res.today.amount).toLocaleString('id-ID')} <br><span class="text-xs font-normal text-gray-500">(\${res.today.count} Trx)</span>\`;
              document.getElementById('d-week').innerHTML = \`Rp \${Math.floor(res.week.amount).toLocaleString('id-ID')} <br><span class="text-xs font-normal text-gray-500">(\${res.week.count} Trx)</span>\`;
              document.getElementById('d-month').innerHTML = \`Rp \${Math.floor(res.month.amount).toLocaleString('id-ID')} <br><span class="text-xs font-normal text-gray-500">(\${res.month.count} Trx)</span>\`;
              
              loadMutations('today');
            }
          } catch(e) { console.log('Belum terhubung'); }
        }

        async function loadMutations(filter) {
          const tbody = document.getElementById('t-mut');
          tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-xs text-gray-400">Menarik data dari server...</td></tr>';
          
          window.activeFilter = filter;

          try {
            const res = await api.get('/mutations?filter=' + filter);
            if(res.status === 'success' && res.transactions.length > 0) {
              window.activeMutations = res.transactions;
              
              tbody.innerHTML = res.transactions.map(x => \`
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="p-3 text-xs">\${new Date(x.time).toLocaleString('id-ID')}</td>
                  <td class="p-3 text-xs font-mono">\${x.order_id}</td>
                  <td class="p-3 text-[10px] font-bold \${x.status === 'settlement' ? 'text-green-500' : 'text-orange-500'} uppercase">\${x.status}</td>
                  <td class="p-3 text-sm font-black text-right">Rp \${Math.floor(x.amount).toLocaleString('id-ID')}</td>
                </tr>
              \`).join('');
            } else {
              window.activeMutations = [];
              tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-xs text-gray-400">Tidak ada mutasi.</td></tr>';
            }
          } catch(e) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-xs text-red-400">Gagal memuat mutasi.</td></tr>';
          }
        }

        // PDF EXPORT LOGIC
        function exportDataToPDF() {
          if (!window.activeMutations || window.activeMutations.length === 0) {
            return Swal.fire('Kosong', 'Tidak ada transaksi untuk diekspor pada filter ini.', 'warning');
          }

          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          doc.setFontSize(16);
          doc.text("Laporan Transaksi GoPay Merchant", 14, 20);
          
          doc.setFontSize(10);
          doc.text("Dicetak pada: " + new Date().toLocaleString('id-ID'), 14, 28);
          doc.text("Rentang Waktu: " + window.activeFilter.toUpperCase(), 14, 34);

          let totalNominal = 0;
          const tableBody = window.activeMutations.map((tx, i) => {
            totalNominal += tx.amount;
            return [
              i + 1,
              new Date(tx.time).toLocaleString('id-ID'),
              tx.order_id,
              tx.status.toUpperCase(),
              'Rp ' + Math.floor(tx.amount).toLocaleString('id-ID')
            ];
          });
          
          tableBody.push([{ content: 'TOTAL KESELURUHAN', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: 'Rp ' + Math.floor(totalNominal).toLocaleString('id-ID'), styles: { fontStyle: 'bold', textColor: [22, 163, 74] } }]);

          doc.autoTable({
            startY: 42,
            head: [['No', 'Waktu', 'Order ID', 'Status', 'Nominal']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
            columnStyles: { 0: { cellWidth: 10 }, 4: { halign: 'right' } }
          });

          const filename = \`Laporan_GoPay_\${window.activeFilter}_\${Date.now()}.pdf\`;
          doc.save(filename);
        }

        // QRIS DINAMIS LOGIC
        function decodeQR(input) {
          const reader = new FileReader();
          reader.onload = e => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width; canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const data = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
              if (data) {
                document.getElementById('c_raw').value = data.data;
                Swal.fire('Berhasil', 'Kode RAW berhasil diekstrak!', 'success');
              } else Swal.fire('Gagal', 'QR Code tidak terbaca. Pastikan gambar jelas.', 'error');
            };
            img.src = e.target.result;
          };
          if (input.files[0]) reader.readAsDataURL(input.files[0]);
        }

        async function saveQrisConfig() {
          const min = document.getElementById('c_min').value;
          const max = document.getElementById('c_max').value;
          const raw = document.getElementById('c_raw').value;
          await api.post('/config/range', { min, max });
          await api.post('/config/master-qr', { raw_qris: raw });
          Swal.fire('Sukses', 'Konfigurasi QRIS berhasil disimpan', 'success');
        }

        async function loadInjectorLog() {
          try {
            const res = await api.get('/trx/list');
            const tbody = document.getElementById('t-gen');
            if(res.transactions && res.transactions.length > 0) {
              tbody.innerHTML = res.transactions.map(x => \`
                <tr class="border-b border-gray-50 dark:border-gray-800">
                  <td class="p-2 font-mono">\${x.order_id}</td>
                  <td class="p-2 font-bold text-green-600">Rp \${parseInt(x.final_amount).toLocaleString('id-ID')}</td>
                  <td class="p-2 text-[9px] font-bold uppercase \${x.status === 'PAID' ? 'text-green-500' : 'text-gray-400'}">\${x.status}</td>
                </tr>
              \`).join('');
            } else tbody.innerHTML = '<tr><td colspan="3" class="p-2 italic text-center">Belum ada transaksi di-generate.</td></tr>';
          } catch(e) {}
        }

        document.addEventListener('DOMContentLoaded', () => {
          const isConnected = ${isConnected};
          if(isConnected) switchTab('dash');
        });
      `}} />
    </div>
  , { title: 'Integrasi GoPay Merchant - Kedai Pangsit Kembar 88' })
})

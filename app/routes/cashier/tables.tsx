import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'

// ==========================================
// API HANDLER (Fungsi Tambah, Hapus, Kosongkan)
// ==========================================
export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();

  try {
    if (body.action === 'free_table') {
      await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(body.table_id).run();
      return c.json({ success: true, message: `Sesi meja berhasil diakhiri.` });
    }
    
    if (body.action === 'add_table') {
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO tables (id, name, status) VALUES (?, ?, 'IDLE')").bind(id, body.table_name).run();
      return c.json({ success: true, message: `Meja ${body.table_name} berhasil ditambahkan.` });
    }

    if (body.action === 'delete_table') {
      await db.prepare("DELETE FROM tables WHERE id = ?").bind(body.table_id).run();
      return c.json({ success: true, message: `Meja berhasil dihapus dari sistem.` });
    }

    return c.json({ success: false, message: 'Aksi tidak dikenali' }, 400);
  } catch (error: any) {
    return c.json({ success: false, message: 'Kesalahan Server: ' + error.message }, 500);
  }
});

// ==========================================
// RENDERER HALAMAN UTAMA (UI)
// ==========================================
export default createRoute(async (c) => {
  // PERBAIKAN BUG: Nama cookie yang benar adalah 'current_shift_id'
  const shiftActive = getCookie(c, 'current_shift_id');
  if (!shiftActive) return c.redirect('/cashier'); 

  const db = c.env.DB;
  const { results: tables } = await db.prepare(`SELECT id, name, status FROM tables ORDER BY name ASC`).all();

  return c.render(
    <div class="space-y-6 pb-12">
      {/* Script Dependency */}
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

      {/* HEADER SECTION */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder">
         <div>
            <h2 class="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
               <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
               Manajemen Meja & QR
            </h2>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Kelola ketersediaan meja dan buat QR Code pesanan untuk pelanggan.</p>
         </div>
         
         <div class="flex items-center gap-3 w-full md:w-auto">
            <button onclick="addTable()" class="flex-1 md:flex-none bg-primary hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
               Tambah Meja
            </button>
         </div>
      </div>

      {/* DOMAIN CONFIGURATION & INFO BANNER */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Setting Domain Aplikasi User */}
         <div class="lg:col-span-1 bg-white dark:bg-darkpanel p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder">
            <h3 class="font-black text-sm text-gray-800 dark:text-white mb-1 uppercase tracking-wider">Domain Aplikasi Publik</h3>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-3">Tentukan URL aplikasi khusus pelanggan agar QR Code mengarah ke website yang tepat.</p>
            <div class="flex gap-2">
               <input type="text" id="domain-input" placeholder="https://domain-pelanggan.com" class="flex-1 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-primary text-gray-900 dark:text-white transition-colors" />
               <button onclick="saveDomain()" class="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white font-bold px-4 rounded-xl shadow-sm active:scale-95 transition-transform text-sm">Simpan</button>
            </div>
         </div>

         {/* Info Banner */}
         <div class="lg:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
               <h4 class="font-bold text-blue-900 dark:text-blue-300">Cara Penggunaan:</h4>
               <p class="text-xs text-blue-800 dark:text-blue-400 mt-1 leading-relaxed">
                  Cetak <b>QR Code</b> dan letakkan di atas meja. Pelanggan yang memindai QR akan langsung diarahkan ke menu dengan sesi meja terpilih. Jika pelanggan sudah pergi namun meja masih berstatus "Terisi", klik <b>Kosongkan Meja</b>.
               </p>
            </div>
         </div>
      </div>

      {/* GRID MEJA */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {tables.length === 0 ? (
            <div class="col-span-full py-12 text-center text-gray-400 font-bold bg-white dark:bg-darkpanel rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
               Belum ada meja yang ditambahkan ke sistem.
            </div>
         ) : tables.map((t: any) => {
            const isOccupied = t.status === 'OCCUPIED';
            return (
              <div class={`relative p-5 rounded-3xl border-2 transition-all shadow-sm group ${isOccupied ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' : 'bg-white dark:bg-darkpanel border-gray-100 dark:border-darkborder hover:border-primary/50'}`}>
                 
                 {/* Tombol Hapus (Hanya muncul jika IDLE) */}
                 {!isOccupied && (
                    <button onclick={`deleteTable('${t.id}', '${t.name}')`} class="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                 )}

                 <div class="flex items-center gap-4 mb-5">
                    <div class={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner ${isOccupied ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : 'bg-green-100 dark:bg-green-900/50 text-green-600'}`}>
                       <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </div>
                    <div>
                       <h3 class="text-xl font-black text-gray-900 dark:text-white leading-tight">{t.name}</h3>
                       <p class={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${isOccupied ? 'text-red-500' : 'text-green-500'}`}>
                          {isOccupied ? 'Sedang Terisi' : 'Meja Tersedia'}
                       </p>
                    </div>
                 </div>
                 
                 <div class="flex gap-2">
                    {isOccupied ? (
                       <button onclick={`freeTable('${t.id}', '${t.name}')`} class="flex-1 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-500 hover:text-white font-bold py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-xs flex justify-center items-center gap-1.5">
                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         Kosongkan
                       </button>
                    ) : (
                       <button onclick={`showQR('${t.id}', '${t.name}')`} class="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary hover:text-white font-bold py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-xs flex justify-center items-center gap-1.5">
                         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                         Lihat QR
                       </button>
                    )}
                 </div>
              </div>
            )
         })}
      </div>

      {/* =========================================================
          MODAL TAMPILKAN QR CODE
          ========================================================= */}
      <div id="qr-modal" class="fixed inset-0 z-[100] hidden items-center justify-center p-6 bg-black/80 backdrop-blur-sm opacity-0 transition-opacity">
         <div id="qr-inner" class="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl transform scale-95 transition-transform text-center relative print:shadow-none print:w-auto print:max-w-none print:m-0 print:rounded-none">
            <button onclick="closeQRModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 print:hidden"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            
            <div class="bg-primary p-6 text-white pb-10">
               <h2 class="font-black text-xl mb-1 tracking-tight uppercase" id="qr-table-name">MEJA</h2>
               <p class="text-xs opacity-90">Scan untuk langsung memesan!</p>
            </div>
            
            <div class="bg-white mx-6 -mt-6 rounded-xl shadow-lg p-5 border border-gray-100 flex flex-col items-center justify-center">
               <div id="qrcode-container" class="bg-white p-2"></div>
               <p class="text-[9px] text-gray-400 mt-4 break-all w-full leading-tight font-mono bg-gray-50 p-2 rounded" id="qr-url-text"></p>
            </div>
            
            <div class="p-6 bg-gray-50 mt-4 print:hidden">
               <button onclick="window.print()" class="w-full bg-gray-900 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  Cetak QR Code
               </button>
            </div>
         </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // HELPER TEMA UNTUK SWEETALERT
        function getSwalTheme() {
            return {
               background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
               color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#1f2937'
            };
        }

        // LOAD DOMAIN DARI LOCALSTORAGE
        let userDomain = localStorage.getItem('spos_user_domain') || 'https://kpkembar88-user.pages.dev';
        document.addEventListener('DOMContentLoaded', () => {
           document.getElementById('domain-input').value = userDomain;
        });

        // SIMPAN DOMAIN
        function saveDomain() {
           const val = document.getElementById('domain-input').value;
           if(val && val.startsWith('http')) {
              userDomain = val;
              localStorage.setItem('spos_user_domain', val);
              Swal.fire({title: 'Tersimpan', text: 'Domain URL pesanan pelanggan berhasil diatur.', icon: 'success', ...getSwalTheme()});
           } else {
              Swal.fire({title: 'Format Salah', text: 'Domain harus diawali dengan http:// atau https://', icon: 'error', ...getSwalTheme()});
           }
        }

        // TAMBAH MEJA
        function addTable() {
           const theme = getSwalTheme();
           Swal.fire({
              title: 'Tambah Meja Baru',
              input: 'text',
              inputPlaceholder: 'Misal: Meja 01, VIP 2...',
              showCancelButton: true,
              confirmButtonText: 'Tambah',
              confirmButtonColor: 'var(--color-primary, #eab308)',
              ...theme,
              inputValidator: (value) => { if (!value) return 'Nama meja tidak boleh kosong!' }
           }).then(async (result) => {
              if (result.isConfirmed && result.value) {
                 const res = await fetch('/cashier/tables', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'add_table', table_name: result.value })
                 });
                 const data = await res.json();
                 if(data.success) window.location.reload();
              }
           });
        }

        // HAPUS MEJA
        function deleteTable(id, name) {
           const theme = getSwalTheme();
           Swal.fire({
              title: 'Hapus Meja?',
              text: \`Yakin ingin menghapus \${name} dari sistem?\`,
              icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!',
              ...theme
           }).then(async (result) => {
              if(result.isConfirmed) {
                 const res = await fetch('/cashier/tables', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: 'delete_table', table_id: id })
                 });
                 const data = await res.json();
                 if(data.success) window.location.reload();
              }
           })
        }

        // KOSONGKAN MEJA
        function freeTable(id, name) {
          const theme = getSwalTheme();
          Swal.fire({
            title: 'Kosongkan Meja?',
            text: \`Pelanggan di \${name} sudah selesai?\`,
            icon: 'question', showCancelButton: true, confirmButtonColor: '#3b82f6', confirmButtonText: 'Ya, Kosongkan!',
            ...theme
          }).then(async (result) => {
            if (result.isConfirmed) {
              const res = await fetch('/cashier/tables', { 
                 method: 'POST', headers: {'Content-Type':'application/json'}, 
                 body: JSON.stringify({ action: 'free_table', table_id: id }) 
              });
              const data = await res.json();
              if(data.success) window.location.reload();
            }
          });
        }

        // TAMPILKAN QR
        let currentQR = null;
        function showQR(id, name) {
           document.getElementById('qr-table-name').innerText = name;
           const cleanDomain = userDomain.replace(/\\/$/, '');
           const finalUrl = \`\${cleanDomain}/?table_id=\${encodeURIComponent(id)}&table_name=\${encodeURIComponent(name)}\`;
           document.getElementById('qr-url-text').innerText = finalUrl;

           const qrContainer = document.getElementById('qrcode-container');
           qrContainer.innerHTML = ''; // Bersihkan QR sebelumnya
           
           // Generate QR Baru via QRCode.js
           currentQR = new QRCode(qrContainer, {
              text: finalUrl,
              width: 220,
              height: 220,
              colorDark : "#000000",
              colorLight : "#ffffff",
              correctLevel : QRCode.CorrectLevel.H
           });

           const modal = document.getElementById('qr-modal');
           modal.classList.remove('hidden');
           modal.classList.add('flex');
           setTimeout(() => {
              modal.classList.remove('opacity-0');
              document.getElementById('qr-inner').classList.remove('scale-95');
           }, 10);
        }

        function closeQRModal() {
           const modal = document.getElementById('qr-modal');
           modal.classList.add('opacity-0');
           document.getElementById('qr-inner').classList.add('scale-95');
           setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
        }
      `}} />
    </div>
  , { title: 'Manajemen Meja - Terminal Kasir' })
})

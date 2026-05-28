import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // 1. Ambil data pengaturan dari database
  let settings = await c.env.DB.prepare('SELECT * FROM delivery_settings WHERE id = ?').bind('default-settings').first<any>();
  
  // Auto-Insert jika tabel delivery_settings masih kosong (Baru diinisialisasi)
  if (!settings) {
    const defaultData = { 
      id: 'default-settings', 
      free_range_max: 2, 
      mid_range_max: 3, 
      mid_range_price: 8000, 
      max_range_price: 10000, 
      max_radius_limit: 5 
    };
    
    await c.env.DB.prepare(
      'INSERT INTO delivery_settings (id, free_range_max, mid_range_max, mid_range_price, max_range_price, max_radius_limit) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      defaultData.id, 
      defaultData.free_range_max, 
      defaultData.mid_range_max, 
      defaultData.mid_range_price, 
      defaultData.max_range_price, 
      defaultData.max_radius_limit
    ).run();
    
    settings = defaultData;
  }

  // 2. Handler untuk menyimpan data (Menangkap POST Request dari Frontend)
  if (c.req.method === 'POST') {
     try {
       const b = await c.req.json();
       await c.env.DB.prepare(
         'UPDATE delivery_settings SET free_range_max=?, mid_range_max=?, mid_range_price=?, max_range_price=?, max_radius_limit=? WHERE id=?'
       ).bind(
         parseFloat(b.free) || 0, 
         parseFloat(b.mid) || 0, 
         parseInt(b.price_mid) || 0, 
         parseInt(b.price_max) || 0, 
         parseFloat(b.limit) || 0, 
         'default-settings'
       ).run();
       return c.json({ success: true, message: 'Pengaturan ongkos kirim berhasil diperbarui!' });
     } catch (error) {
       return c.json({ success: false, message: 'Terjadi kesalahan sistem saat menyimpan.' }, 500);
     }
  }

  // 3. Render Tampilan UI Admin
  return c.render(
    <div class="space-y-6 max-w-4xl mx-auto pb-10">
      {/* HEADER SECTION */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg class="w-7 h-7 text-[#ee4d2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Pengaturan Jarak & Ongkir
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Konfigurasi zona pengantaran, batas radius maksimal, dan perhitungan tarif ongkos kirim otomatis.</p>
        </div>
      </div>

      <form onsubmit="event.preventDefault(); saveDeliverySettings();" class="space-y-6">
        
        {/* CARD 1: ZONA GRATIS ONGKIR */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden group hover:border-green-300 dark:hover:border-green-500/50 transition-colors">
          <div class="p-5 bg-green-50/50 dark:bg-green-500/10 border-b border-gray-100 dark:border-darkborder flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-gray-200">Zona 1: Gratis Ongkir (Free Delivery)</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Jarak terdekat yang tidak dikenakan biaya pengantaran.</p>
            </div>
          </div>
          <div class="p-6">
            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Batas Maksimal Jarak (Kilometer)</label>
            <div class="relative max-w-md">
              <input type="number" step="any" id="free_range" value={settings.free_range_max} required class="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono font-bold text-lg" />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">KM</span>
            </div>
            <p class="text-[11px] text-gray-400 mt-2 italic">*Contoh: Jika diisi 2, maka jarak 0 hingga 2 KM dari gerai akan bebas ongkir.</p>
          </div>
        </div>

        {/* CARD 2: ZONA MENENGAH */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden group hover:border-yellow-300 dark:hover:border-yellow-500/50 transition-colors">
          <div class="p-5 bg-yellow-50/50 dark:bg-yellow-500/10 border-b border-gray-100 dark:border-darkborder flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-gray-200">Zona 2: Jarak Menengah</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Tarif flat untuk jarak setelah batas gratis ongkir terlewati.</p>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Batas Maksimal Jarak (KM)</label>
              <div class="relative">
                <input type="number" step="any" id="mid_range" value={settings.mid_range_max} required class="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all font-mono font-bold text-lg" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">KM</span>
              </div>
              <p class="text-[11px] text-gray-400 mt-2 italic">*Berlaku setelah zona gratis. Contoh: Jika diisi 5, maka jarak 2.1 KM hingga 5 KM masuk tarif ini.</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tarif Ongkos Kirim (Rp)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input type="number" id="mid_price" value={settings.mid_range_price} required class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all font-mono font-bold text-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: ZONA JAUH & BATAS MAKSIMAL RADIUS PENGANTARAN */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden group hover:border-red-300 dark:hover:border-red-500/50 transition-colors">
          <div class="p-5 bg-red-50/50 dark:bg-red-500/10 border-b border-gray-100 dark:border-darkborder flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-gray-200">Zona 3 & Batas Pengantaran</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Tarif tertinggi dan sistem penolakan otomatis jika pesanan terlalu jauh.</p>
            </div>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tarif Ongkos Kirim Jauh (Rp)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input type="number" id="max_price" value={settings.max_range_price} required class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono font-bold text-lg" />
              </div>
              <p class="text-[10px] text-gray-400 mt-2 italic">*Dikenakan jika jarak melewati zona menengah.</p>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tolak Pesanan Lebih Dari (KM)</label>
              <div class="relative">
                <input type="number" step="any" id="limit_radius" value={settings.max_radius_limit} required class="w-full pl-4 pr-12 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl text-red-800 dark:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono font-bold text-lg" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-red-400">KM</span>
              </div>
              <p class="text-[10px] text-gray-400 mt-2 italic">*Pesanan dari pelanggan akan otomatis ditolak sistem jika jarak tujuan di atas limit ini.</p>
            </div>
          </div>
        </div>

        {/* BUTTON SUBMIT */}
        <div class="flex justify-end pt-4">
          <button id="btnSubmit" type="submit" class="w-full sm:w-auto bg-[#ee4d2d] hover:bg-[#d64124] text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-[#ee4d2d]/30 transition-all flex items-center justify-center gap-2 active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            Simpan Konfigurasi
          </button>
        </div>
      </form>

      {/* SCRIPT LOGIKA SIMPAN & TOAST (TIDAK MEMBUTUHKAN API EXTERNAL) */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Fungsi Toast Dinamis
        function showToast(message, isError = false) {
          const toast = document.createElement('div');
          toast.className = \`fixed top-6 left-1/2 transform -translate-x-1/2 backdrop-blur-md text-white px-5 py-3 rounded-xl text-sm font-bold z-[100] shadow-2xl flex items-center gap-2 transition-all duration-300 opacity-0 -translate-y-4 border \${isError ? 'bg-red-600/95 border-red-500' : 'bg-gray-900/95 border-gray-800 dark:bg-white dark:text-gray-900'}\`;
          toast.innerHTML = isError 
            ? '<svg class="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ' + message
            : '<svg class="w-5 h-5 text-green-400 dark:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> ' + message;
          
          document.body.appendChild(toast);
          
          setTimeout(() => { toast.classList.remove('opacity-0', '-translate-y-4'); toast.classList.add('opacity-100', 'translate-y-0'); }, 10);
          setTimeout(() => { toast.classList.remove('opacity-100', 'translate-y-0'); toast.classList.add('opacity-0', '-translate-y-4'); setTimeout(() => toast.remove(), 300); }, 3000);
        }

        async function saveDeliverySettings() {
           const btn = document.getElementById('btnSubmit');
           const originalText = btn.innerHTML;
           btn.innerHTML = '<svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menyimpan...';
           btn.disabled = true;

           // Kumpulkan data dari form
           const payload = {
             free: document.getElementById('free_range').value,
             mid: document.getElementById('mid_range').value,
             price_mid: document.getElementById('mid_price').value,
             price_max: document.getElementById('max_price').value,
             limit: document.getElementById('limit_radius').value
           };

           try {
             // Melakukan POST ke URL diri sendiri (/admin/delivery)
             // Akan ditangkap oleh blok c.req.method === 'POST' di kode HonoX atas
             const response = await fetch('/admin/delivery', { 
               method: 'POST', 
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload) 
             });
             
             const data = await response.json();
             
             if(data.success) {
               showToast(data.message || 'Pengaturan berhasil disimpan!');
             } else {
               showToast(data.message || 'Gagal menyimpan pengaturan.', true);
             }
           } catch (error) {
             showToast('Terjadi kesalahan jaringan.', true);
           } finally {
             btn.innerHTML = originalText;
             btn.disabled = false;
           }
        }
      `}} />
    </div>
  , { title: 'Pengaturan Jarak & Ongkir - Kedai Pangsit Kembar 88' })
})

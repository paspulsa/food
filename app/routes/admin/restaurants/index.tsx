import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, phone, email, image, isActive, latitude, longitude, theme_color, open_time, close_time FROM restaurants ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.render(
    <div class="space-y-6 relative">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Manajemen Mitra Restoran</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola operasional, koordinat GPS, jam buka, dan identitas visual gerai mitra.</p>
        </div>
        <button 
          onclick="openRestoModal()"
          class="w-full sm:w-auto bg-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Restoran Baru
        </button>
      </div>

      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/70 dark:bg-darkbg/50 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
                <th class="px-6 py-4 font-semibold">Detail Gerai</th>
                <th class="px-6 py-4 font-semibold">Kontak</th>
                <th class="px-6 py-4 font-semibold">Jam Operasional</th>
                <th class="px-6 py-4 font-semibold">Koordinat GPS</th>
                <th class="px-6 py-4 font-semibold">Tema Warna</th>
                <th class="px-6 py-4 font-semibold">Status</th>
                <th class="px-6 py-4 text-right font-semibold">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-darkborder text-sm">
              {restaurants.length === 0 ? (
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-400 italic bg-white dark:bg-darkpanel">
                    Belum ada mitra restoran yang terdaftar di basis data D1.
                  </td>
                </tr>
              ) : restaurants.map((resto: any) => (
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4 flex items-center gap-3">
                    <img 
                      src={resto.image || 'https://via.placeholder.com/150?text=SPOS'} 
                      class="w-10 h-10 object-cover rounded-xl border border-gray-100 dark:border-darkborder bg-gray-50 flex-shrink-0"
                      alt={resto.name}
                    />
                    <div class="min-w-0">
                      <div class="font-bold text-gray-800 dark:text-gray-200 truncate">{resto.name}</div>
                      <div class="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">ID: {resto.id.substring(0, 8)}...</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                    <div class="font-semibold">{resto.phone || '-'}</div>
                    <div class="text-gray-400 dark:text-gray-500">{resto.email || '-'}</div>
                  </td>
                  <td class="px-6 py-4 font-mono text-xs">
                    <span class="bg-gray-50 dark:bg-darkbg px-2.5 py-1 rounded-lg border border-gray-100 dark:border-darkborder text-gray-700 dark:text-gray-300 font-bold">
                      ⏱️ {resto.open_time || '08:00'} - {resto.close_time || '22:00'}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">{resto.latitude || 0}, {resto.longitude || 0}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full border border-black/10 shadow-sm" style={`background-color: ${resto.theme_color || '#10b981'}`}></span>
                      <span class="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">{resto.theme_color || '#10b981'}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      resto.isActive === 1 
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-500/20' 
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'
                    }`}>
                      {resto.isActive === 1 ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap space-x-1">
                    <button 
                      onclick={`openRestoModal('${resto.id}', '${resto.name.replace(/'/g, "\\'")}', '${resto.address.replace(/'/g, "\\'")}', '${resto.phone || ''}', '${resto.email || ''}', '${resto.image || ''}', ${resto.latitude || 0}, ${resto.longitude || 0}, '${resto.theme_color || '#10b981'}', ${resto.isActive}, '${resto.open_time || '08:00'}', '${resto.close_time || '22:00'}')`}
                      class="text-xs font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl border border-blue-500/10 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onclick={`deleteRestaurant('${resto.id}', '${resto.name.replace(/'/g, "\\'")}')`}
                      class="text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/10 transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DIALOG RESTORAN */}
      <div id="restoModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-all duration-200 border dark:border-darkborder" id="restoModalInner">
          <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center bg-gray-50 dark:bg-darkbg/40">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white" id="modalTitle">Konfigurasi Gerai</h3>
            <button onclick="closeRestoModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <form class="p-6 space-y-4 max-h-[75vh] overflow-y-auto" onsubmit="event.preventDefault(); submitRestaurant();">
            <input type="hidden" id="resto_id" />
            
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Gerai Restoran</label>
              <input type="text" id="resto_name" placeholder="Contoh: SPOS Kitchen Pusat" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm focus:border-primary" required />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nomor Telepon</label>
                <input type="text" id="resto_phone" placeholder="08123456" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email Gerai</label>
                <input type="email" id="resto_email" placeholder="resto@spos.com" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-darkbg/40 rounded-xl border border-gray-200/60 dark:border-darkborder">
              <div>
                <label class="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">⏰ Jam Buka</label>
                <input type="time" id="resto_open_time" class="w-full px-3 py-1.5 bg-white dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg text-sm font-mono text-gray-800 dark:text-white outline-none" required />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">⏳ Jam Tutup</label>
                <input type="time" id="resto_close_time" class="w-full px-3 py-1.5 bg-white dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg text-sm font-mono text-gray-800 dark:text-white outline-none" required />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Latitude</label>
                <input type="number" step="any" id="resto_lat" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Longitude</label>
                <input type="number" step="any" id="resto_lng" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-darkbg/40 rounded-xl border border-gray-200/60 dark:border-darkborder">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Status Operasi</label>
                <select id="resto_is_active" class="w-full px-3 py-1.5 bg-white dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  <option value="1">AKTIF</option>
                  <option value="0">NONAKTIF</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tema Warna</label>
                <div class="flex items-center gap-2 mt-1">
                  <input type="color" id="resto_theme_color" class="w-10 h-8 rounded cursor-pointer border-0 p-0" value="#10b981" />
                  <span class="text-[11px] text-gray-400 font-mono">Palet Visual</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Alamat Lengkap</label>
              <textarea id="resto_address" rows={2} class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm" required></textarea>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-darkbg/30 rounded-xl border border-gray-200 dark:border-darkborder">
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Logo Gerai (R2 CDN)</label>
              <input type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-200 dark:file:bg-gray-700 dark:file:text-white hover:file:opacity-80 cursor-pointer" onchange="handleLogoUpload(this)" />
              <input type="hidden" id="resto_image" />
              <div id="upload-status" class="hidden"></div>
            </div>

            <button type="submit" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md shadow-primary/10 transition-colors">
              Simpan Konfigurasi Gerai
            </button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function getAdminToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        // Perubahan parameter untuk openTime dan closeTime
        function openRestoModal(id='', name='', address='', phone='', email='', image='', lat=0, lng=0, theme='#10b981', isActive=1, openTime='08:00', closeTime='22:00') {
          document.getElementById('modalTitle').innerText = id ? 'Edit Data Gerai' : 'Daftarkan Gerai Baru';
          document.getElementById('resto_id').value = id;
          document.getElementById('resto_name').value = name;
          document.getElementById('resto_address').value = address;
          document.getElementById('resto_phone').value = phone;
          document.getElementById('resto_email').value = email;
          document.getElementById('resto_image').value = image;
          document.getElementById('resto_lat').value = lat;
          document.getElementById('resto_lng').value = lng;
          document.getElementById('resto_theme_color').value = theme;
          document.getElementById('resto_is_active').value = isActive;
          document.getElementById('resto_open_time').value = openTime;
          document.getElementById('resto_close_time').value = closeTime;
          
          const modal = document.getElementById('restoModal');
          const inner = document.getElementById('restoModalInner');
          modal.classList.remove('hidden');
          setTimeout(() => inner.classList.remove('scale-95'), 10);
        }

        function closeRestoModal() {
          const inner = document.getElementById('restoModalInner');
          inner.classList.add('scale-95');
          setTimeout(() => document.getElementById('restoModal').classList.add('hidden'), 150);
        }

        async function handleLogoUpload(input) {
          const file = input.files[0];
          if(!file) return;
          const sb = document.getElementById('upload-status');
          sb.innerText = 'Mengunggah ke R2 CDN...';
          sb.className = 'text-xs text-blue-500 font-bold mt-2 block animate-pulse';

          const fd = new FormData();
          fd.append('file', file);
          try {
            const res = await fetch('/api/v1/protected/admin/uploads', {
              method: 'POST', headers: { 'Authorization': 'Bearer ' + getAdminToken() }, body: fd
            });
            const data = await res.json();
            if(data.success || data.url) {
              document.getElementById('resto_image').value = data.url || data.filePath;
              sb.innerText = '✓ Berhasil diunggah ke R2.';
              sb.className = 'text-xs text-green-500 font-bold mt-2 block';
            }
          } catch(e) { sb.innerText = '✕ Gagal upload.'; sb.className = 'text-xs text-red-500 font-bold mt-2 block'; }
        }

        async function submitRestaurant() {
          const id = document.getElementById('resto_id').value;
          const payload = {
            name: document.getElementById('resto_name').value,
            address: document.getElementById('resto_address').value,
            phone: document.getElementById('resto_phone').value || null,
            email: document.getElementById('resto_email').value || null,
            image: document.getElementById('resto_image').value || null,
            latitude: parseFloat(document.getElementById('resto_lat').value) || 0,
            longitude: parseFloat(document.getElementById('resto_lng').value) || 0,
            theme_color: document.getElementById('resto_theme_color').value,
            isActive: parseInt(document.getElementById('resto_is_active').value),
            open_time: document.getElementById('resto_open_time').value || '08:00',
            close_time: document.getElementById('resto_close_time').value || '22:00'
          };

          const method = id ? 'PUT' : 'POST';
          const endpoint = id ? '/api/v1/protected/admin/restaurants/' + id : '/api/v1/protected/admin/restaurants';

          try {
            const res = await fetch(endpoint, {
              method: method,
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAdminToken() },
              body: JSON.stringify(payload)
            });
            if(res.ok) window.location.reload();
            else alert('Gagal menyimpan konfigurasi.');
          } catch(e) { alert('Gangguan jaringan.'); }
        }

        async function deleteRestaurant(restoId, restoName) {
          if(!confirm('Hapus gerai ' + restoName + '? Tindakan ini permanen.')) return;
          try {
            const res = await fetch('/api/v1/protected/admin/restaurants/' + restoId, {
              method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getAdminToken() }
            });
            if(res.ok) window.location.reload();
          } catch(e) { alert('Kesalahan server.'); }
        }
      `}} />
    </div>
  , { title: 'Manajemen Mitra Gerai - SPOS' })
})

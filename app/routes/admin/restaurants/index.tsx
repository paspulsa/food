import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil data termasuk open_time dan close_time dari D1
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, phone, email, image, isActive, latitude, longitude, theme_color, open_time, close_time FROM restaurants ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.render(
    <div class="space-y-6 animate-fade-in relative">
      {/* HEADER ACTION */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-800 tracking-tight">Manajemen Mitra Restoran</h2>
          <p class="text-gray-500 text-sm mt-1">Kelola lisensi operasional, koordinat GPS, jam operasional, dan identitas visual setiap gerai mitra.</p>
        </div>
        <button 
          onclick="openRestoModal()"
          class="bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Restoran Baru
        </button>
      </div>

      {/* TABEL DATA UTAMA */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="px-6 py-4 font-semibold">Detail Informasi Gerai</th>
              <th class="px-6 py-4 font-semibold">Kontak</th>
              <th class="px-6 py-4 font-semibold">Jam Operasional</th>
              <th class="px-6 py-4 font-semibold">Koordinat GPS</th>
              <th class="px-6 py-4 font-semibold">Tema Warna</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            {restaurants.length === 0 ? (
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-400 italic">
                  Belum ada mitra restoran yang terdaftar di basis data D1.
                </td>
              </tr>
            ) : restaurants.map((resto: any) => (
              <tr class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-4 flex items-center gap-4">
                  <img 
                    src={resto.image || 'https://via.placeholder.com/150?text=ShopeeFood'} 
                    class="w-12 h-12 object-cover rounded-xl shadow-sm border border-gray-100 bg-gray-50"
                    alt={resto.name}
                  />
                  <div>
                    <div class="font-bold text-gray-800 text-base">{resto.name}</div>
                    <div class="text-[10px] font-mono text-gray-400 mt-0.5" title={resto.id}>ID: {resto.id.substring(0, 8)}...</div>
                  </div>
                </td>
                <td class="px-6 py-4 text-xs text-gray-600 space-y-0.5">
                  <div class="font-semibold">{resto.phone || '-'}</div>
                  <div class="text-gray-400">{resto.email || '-'}</div>
                </td>
                {/* KOLOM BARU: JAM OPERASIONAL */}
                <td class="px-6 py-4 font-mono text-xs text-slate-700">
                  <span class="bg-slate-100 px-2 py-1 rounded border border-slate-200 block w-max font-bold">
                    ⏱️ {resto.open_time || '08:00'} - {resto.close_time || '22:00'}
                  </span>
                </td>
                <td class="px-6 py-4 font-mono text-xs text-gray-600">{resto.latitude || 0}, {resto.longitude || 0}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class="w-4 h-4 rounded-full shadow-inner border border-black/10" style={`background-color: ${resto.theme_color || '#E61010'}`}></span>
                    <span class="font-mono text-xs font-bold text-gray-600">{resto.theme_color || '#E61010'}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-black border ${resto.isActive === 1 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {resto.isActive === 1 ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <button 
                    onclick={`openRestoModal('${resto.id}', '${resto.name.replace(/'/g, "\\'")}', '${resto.address.replace(/'/g, "\\'")}', '${resto.phone || ''}', '${resto.email || ''}', '${resto.image || ''}', ${resto.latitude || 0}, ${resto.longitude || 0}, '${resto.theme_color || '#E61010'}', ${resto.isActive}, '${resto.open_time || '08:00'}', '${resto.close_time || '22:00'}')`}
                    class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onclick={`deleteRestaurant('${resto.id}', '${resto.name.replace(/'/g, "\\'")}')`}
                    class="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 transition-colors ml-2"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DIALOG FORM TAMBAH/EDIT RESTORAN --- */}
      <div id="restoModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform duration-200" id="restoModalInner">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-black text-gray-800" id="modalTitle">Konfigurasi Gerai</h3>
            <button onclick="closeRestoModal()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <form class="p-6 space-y-4 max-h-[80vh] overflow-y-auto" onsubmit="event.preventDefault(); submitRestaurant();">
            <input type="hidden" id="resto_id" />
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Nama Gerai Restoran</label>
              <input type="text" id="resto_name" placeholder="Contoh: ShopeeFood Kitchen Pusat" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" required />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Nomor Telepon</label>
                <input type="text" id="resto_phone" placeholder="08123456789" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Email Gerai</label>
                <input type="email" id="resto_email" placeholder="resto@env.com" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              </div>
            </div>

            {/* FIELD BARU: JAM BUKA & JAM TUTUP */}
            <div class="grid grid-cols-2 gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <div>
                <label class="block text-xs font-black text-orange-800 uppercase tracking-wider mb-1">⏰ Jam Mulai Buka</label>
                <input type="time" id="resto_open_time" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none" required />
              </div>
              <div>
                <label class="block text-xs font-black text-orange-800 uppercase tracking-wider mb-1">⏳ Jam Tutup Operasi</label>
                <input type="time" id="resto_close_time" class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none" required />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Latitude</label>
                <input type="number" step="any" id="resto_lat" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Longitude</label>
                <input type="number" step="any" id="resto_lng" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-gray-200">
              <div>
                <label class="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Status Operasi</label>
                <select id="resto_is_active" class="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="1">AKTIF</option>
                  <option value="0">NONAKTIF</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Tema Warna</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="resto_theme_color" class="w-10 h-8 rounded cursor-pointer border-0 p-0" value="#E61010" />
                  <span class="text-[10px] text-gray-500 font-mono">Palet Warna</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Alamat Operasional Lengkap</label>
              <textarea id="resto_address" rows={2} class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" required></textarea>
            </div>
            
            <div class="p-4 bg-slate-50 rounded-xl border border-gray-200">
              <label class="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">Upload Logo Gerai (R2 CDN)</label>
              <input type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-gray-200 hover:file:bg-gray-300 cursor-pointer" onchange="handleLogoUpload(this)" />
              <input type="hidden" id="resto_image" />
              <div id="upload-status" class="hidden"></div>
            </div>

            <button type="submit" class="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-4">
              Simpan Konfigurasi Gerai
            </button>
          </form>
        </div>
      </div>

      {/* RUNTIME EVENT HANDLER CLIENT-SIDE */}
      <script dangerouslySetInnerHTML={{ __html: `
        function getAdminToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        // Perubahan parameter: Menambahkan openTime dan closeTime di ujung fungsi
        function openRestoModal(id='', name='', address='', phone='', email='', image='', lat=0, lng=0, theme='#E61010', isActive=1, openTime='08:00', closeTime='22:00') {
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
          
          // Mengisi value input jam buka & tutup di HTML
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
          sb.className = 'text-xs text-blue-600 font-bold mt-2 block animate-pulse';

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
              sb.className = 'text-xs text-green-600 font-bold mt-2 block';
            }
          } catch(e) { sb.innerText = '✕ Gagal upload.'; sb.className = 'text-xs text-red-600 font-bold mt-2 block'; }
        }

        async function submitRestaurant() {
          const id = document.getElementById('resto_id').value;
          
          // Memasukkan open_time dan close_time ke payload JSON yang akan dikirim ke Backend API
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
  , { title: 'Manajemen Mitra Gerai' })
})

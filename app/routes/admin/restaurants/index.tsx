import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil seluruh data gerai restoran asli beserta data GPS dan tema dari D1
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, phone, email, image, isActive, latitude, longitude, theme_color FROM restaurants ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.render(
    <div class="space-y-6 animate-fade-in relative">
      {/* HEADER ACTION */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-800 tracking-tight">Manajemen Mitra Restoran</h2>
          <p class="text-gray-500 text-sm mt-1">Kelola lisensi operasional, koordinat GPS, dan identitas visual (tema) gerai mitra.</p>
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
              <th class="px-6 py-4 font-semibold">Detail Informasi</th>
              <th class="px-6 py-4 font-semibold">Koordinat (Lat/Lng)</th>
              <th class="px-6 py-4 font-semibold">Tema Warna</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            {restaurants.length === 0 ? (
              <tr><td colspan="5" class="px-6 py-12 text-center text-gray-400 italic">Belum ada mitra restoran terdaftar.</td></tr>
            ) : restaurants.map((resto: any) => (
              <tr class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4 flex items-center gap-4">
                  <img src={resto.image || 'https://via.placeholder.com/150'} class="w-10 h-10 object-cover rounded-xl shadow-sm border border-gray-100" alt={resto.name} />
                  <div>
                    <div class="font-bold text-gray-800">{resto.name}</div>
                    <div class="text-xs text-gray-400 font-mono">{resto.email || '-'}</div>
                  </div>
                </td>
                <td class="px-6 py-4 font-mono text-xs text-gray-600">
                  {resto.latitude || 0}, {resto.longitude || 0}
                </td>
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
                <td class="px-6 py-4 text-right">
                  <button onclick={`openRestoModal('${resto.id}', '${resto.name.replace(/'/g, "\\'")}', '${resto.address.replace(/'/g, "\\'")}', '${resto.phone || ''}', '${resto.email || ''}', '${resto.image || ''}', ${resto.latitude || 0}, ${resto.longitude || 0}, '${resto.theme_color || '#E61010'}', ${resto.isActive})`} class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                  <button onclick={`deleteRestaurant('${resto.id}', '${resto.name.replace(/'/g, "\\'")}')`} class="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg ml-2 transition-colors">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      <div id="restoModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform" id="restoModalInner">
          <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="font-black text-gray-800" id="modalTitle">Konfigurasi Gerai</h3>
            <button onclick="closeRestoModal()" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitRestaurant();">
            <input type="hidden" id="resto_id" />
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Nama Gerai</label>
              <input type="text" id="resto_name" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-800 focus:bg-white" required />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                <input type="number" step="any" id="resto_lat" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                <input type="number" step="any" id="resto_lng" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm" />
              </div>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-gray-200">
              <label class="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">Tema Visual (White-Labeling)</label>
              <div class="flex items-center gap-3">
                <input type="color" id="resto_theme_color" class="w-12 h-10 rounded cursor-pointer border-0" value="#E61010" />
                <span class="text-xs font-mono font-bold text-gray-600">Pilih palet warna tema gerai</span>
              </div>
            </div>
            <button type="submit" class="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-4">Simpan Konfigurasi Gerai</button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function getAuthToken() { return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1]; }
        function openRestoModal(id='', name='', address='', phone='', email='', image='', lat=0, lng=0, theme='#E61010', isActive=1) {
          document.getElementById('modalTitle').innerText = id ? 'Edit Data Gerai' : 'Daftarkan Gerai Baru';
          document.getElementById('resto_id').value = id;
          document.getElementById('resto_name').value = name;
          document.getElementById('resto_lat').value = lat;
          document.getElementById('resto_lng').value = lng;
          document.getElementById('resto_theme_color').value = theme;
          document.getElementById('restoModal').classList.remove('hidden');
        }
        function closeRestoModal() { document.getElementById('restoModal').classList.add('hidden'); }
        async function submitRestaurant() {
          const id = document.getElementById('resto_id').value;
          const payload = {
            name: document.getElementById('resto_name').value,
            address: 'N/A', // Placeholder sesuai field db
            latitude: parseFloat(document.getElementById('resto_lat').value),
            longitude: parseFloat(document.getElementById('resto_lng').value),
            theme_color: document.getElementById('resto_theme_color').value,
            isActive: true
          };
          const method = id ? 'PUT' : 'POST';
          const endpoint = id ? '/api/v1/protected/admin/restaurants/' + id : '/api/v1/protected/admin/restaurants';
          const res = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
            body: JSON.stringify(payload)
          });
          if(res.ok) window.location.reload();
          else alert('Gagal menyimpan konfigurasi.');
        }
        async function deleteRestaurant(id, name) {
          if(!confirm('Hapus gerai ' + name + '?')) return;
          await fetch('/api/v1/protected/admin/restaurants/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getAuthToken() } });
          window.location.reload();
        }
      `}} />
    </div>
  , { title: 'Manajemen Mitra Gerai' })
})

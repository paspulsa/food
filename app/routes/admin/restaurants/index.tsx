import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil seluruh data gerai restoran asli dari basis data D1
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, phone, email, image, isActive FROM restaurants ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.render(
    <div class="space-y-6 animate-fade-in relative">
      {/* HEADER ACTION */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-800 tracking-tight">Manajemen Mitra Restoran</h2>
          <p class="text-gray-500 text-sm mt-1">Kelola lisensi operasional, informasi kontak, dan status aktifasi seluruh gerai mitra.</p>
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
              <th class="px-6 py-4 font-semibold">Alamat Lokasi</th>
              <th class="px-6 py-4 font-semibold">Kontak & Email</th>
              <th class="px-6 py-4 font-semibold">Status Operasi</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi Kontrol</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            {restaurants.length === 0 ? (
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic">
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
                <td class="px-6 py-4 text-gray-600 font-medium max-w-xs truncate">{resto.address}</td>
                <td class="px-6 py-4 space-y-0.5">
                  <div class="font-mono text-xs text-gray-700">{resto.phone || '-'}</div>
                  <div class="text-xs text-gray-400 truncate max-w-[150px]">{resto.email || '-'}</div>
                </td>
                <td class="px-6 py-4">
                  <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-black border ${
                    resto.isActive === 1 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {resto.isActive === 1 ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button 
                    onclick={`deleteRestaurant('${resto.id}', '${resto.name}')`}
                    class="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DIALOG FORM TAMBAH RESTORAN --- */}
      <div id="restoModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 transition-transform duration-200" id="restoModalInner">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-black text-gray-800">Daftarkan Restoran Baru</h3>
            <button onclick="closeRestoModal()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitRestaurant();">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Nama Gerai Restoran</label>
              <input type="text" id="resto_name" placeholder="Contoh: ShopeeFood Kitchen Pusat" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" required />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Alamat Operasional Lengkap</label>
              <textarea id="resto_address" rows={2} placeholder="Jl. Terang Bintang No. 88, Jakarta" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" required></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Nomor Telepon/WA</label>
                <input type="text" id="resto_phone" placeholder="08123456789" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Email Korespondensi</label>
                <input type="email" id="resto_email" placeholder="resto@domain.com" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">URL Cover Gambar Foto</label>
              <input type="url" id="resto_image" placeholder="https://domain.com/foto-resto.jpg" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" />
            </div>
            
            <button type="submit" class="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-4">
              Simpan & Daftarkan Gerai
            </button>
          </form>
        </div>
      </div>

      {/* RUNTIME EVENT HANDLER CLIENT-SIDE */}
      <script dangerouslySetInnerHTML={{ __html: `
        function getAdminToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        function openRestoModal() {
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

        async function submitRestaurant() {
          const token = getAdminToken();
          if(!token) return alert('Sesi otorisasi kadaluwarsa, silakan login kembali.');

          const payload = {
            name: document.getElementById('resto_name').value,
            address: document.getElementById('resto_address').value,
            phone: document.getElementById('resto_phone').value || null,
            email: document.getElementById('resto_email').value || null,
            image: document.getElementById('resto_image').value || null
          };

          try {
            const res = await fetch('/api/v1/protected/admin/restaurants', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
              },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if(data.success || res.status === 201 || res.status === 200) {
              window.location.reload();
            } else {
              alert(data.message || 'Gagal mendaftarkan gerai restoran.');
            }
          } catch(e) {
            alert('Gangguan jaringan saat memproses pendaftaran gerai.');
          }
        }

        async function deleteRestaurant(restoId, restoName) {
          const token = getAdminToken();
          if(!token) return alert('Sesi berakhir.');
          if(!confirm('Apakah Anda benar-benar yakin ingin menghapus gerai ' + restoName + '? Semua katalog menu dan produk di dalamnya juga akan ikut terhapus permanen.')) return;

          try {
            const res = await fetch('/api/v1/protected/admin/restaurants/' + restoId, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if(res.ok) {
              window.location.reload();
            } else {
              alert('Gagal mengeksekusi penghapusan dari server.');
            }
          } catch(e) {
            alert('Kesalahan komunikasi data internal server.');
          }
        }
      `}} />
    </div>
  , { title: 'Manajemen Mitra Restoran' })
})

import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil semua data promo dari database
  const { results: promos } = await c.env.DB.prepare(
    'SELECT * FROM app_promos ORDER BY created_at DESC'
  ).all();

  return c.render(
    <div class="space-y-6">
      {/* HEADER */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Manajemen Promo</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola Banner Slider dan Popup Modal promosi untuk pelanggan.</p>
        </div>
        <button onclick="openPromoModal()" class="w-full sm:w-auto bg-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Promo Baru
        </button>
      </div>

      {/* TABEL DATA PROMO */}
      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/70 dark:bg-darkbg/50 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
                <th class="px-6 py-4 font-semibold">Preview Banner</th>
                <th class="px-6 py-4 font-semibold">Jenis / Tipe</th>
                <th class="px-6 py-4 font-semibold">Link Aksi (Tujuan)</th>
                <th class="px-6 py-4 font-semibold">Status</th>
                <th class="px-6 py-4 text-right font-semibold">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-darkborder text-sm">
              {promos.length === 0 ? (
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic bg-white dark:bg-darkpanel">
                    Belum ada data promosi yang dibuat.
                  </td>
                </tr>
              ) : promos.map((p: any) => (
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <img src={p.image} class="w-32 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" alt="Promo Preview" />
                  </td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${p.type === 'BANNER' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30' : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/30'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[150px]">
                    {p.action_url || '-'}
                  </td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${p.is_active ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-500/30'}`}>
                      {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap space-x-2">
                    <button onclick={`togglePromo('${p.id}', ${p.is_active})`} class="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                      Ubah Status
                    </button>
                    <button onclick={`deletePromo('${p.id}')`} class="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH PROMO */}
      <div id="promoModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform scale-95 transition-all border dark:border-darkborder" id="promoModalInner">
          <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center bg-gray-50 dark:bg-darkbg/40">
            <h3 class="font-bold text-gray-800 dark:text-white">Tambah Publikasi Promo</h3>
            <button onclick="closePromoModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <form onsubmit="event.preventDefault(); submitPromo();" class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tipe Penempatan Promo</label>
              <select id="p_type" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-primary">
                <option value="BANNER">BANNER (Slider Atas Home)</option>
                <option value="MODAL">MODAL (Popup Utama)</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Link Tujuan / Aksi (Opsional)</label>
              <input type="text" id="p_url" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-sm text-gray-800 dark:text-white outline-none focus:border-primary placeholder-gray-400" placeholder="Contoh: /users/kategori-diskon" />
            </div>

            <div class="p-4 bg-gray-50 dark:bg-darkbg/30 rounded-xl border border-gray-200 dark:border-darkborder">
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Foto Desain Promo (Wajib)</label>
              <input type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:opacity-80 cursor-pointer" onchange="handleDirectUpload(this)" required />
              <input type="hidden" id="p_image" />
              <div id="upload-status" class="hidden"></div>
            </div>

            <button type="submit" id="btnSubmit" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all">
              Simpan & Terbitkan Promo
            </button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function getAuthToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        function openPromoModal() {
          const modal = document.getElementById('promoModal');
          const inner = document.getElementById('promoModalInner');
          modal.classList.remove('hidden');
          setTimeout(() => inner.classList.remove('scale-95'), 10);
        }

        function closePromoModal() {
          const modal = document.getElementById('promoModal');
          const inner = document.getElementById('promoModalInner');
          inner.classList.add('scale-95');
          setTimeout(() => modal.classList.add('hidden'), 150);
        }

        async function handleDirectUpload(inputElement) {
          const file = inputElement.files[0];
          if(!file) return;

          const statusBox = document.getElementById('upload-status');
          statusBox.innerText = 'Mengunggah aset gambar...';
          statusBox.classList.remove('hidden');
          statusBox.className = 'text-xs text-blue-500 font-bold mt-2 block animate-pulse';

          const formData = new FormData();
          formData.append('file', file);

          try {
            const res = await fetch('/api/v1/protected/admin/uploads', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + getAuthToken() },
              body: formData
            });
            const data = await res.json();
            
            if(data.success || data.url) {
              document.getElementById('p_image').value = data.url || data.filePath;
              statusBox.innerText = '✓ Berhasil terunggah ke Cloud R2';
              statusBox.className = 'text-xs text-green-500 font-bold mt-2 block';
            } else {
              throw new Error(data.message);
            }
          } catch(err) {
            statusBox.innerText = '✕ Gagal mengunggah gambar.';
            statusBox.className = 'text-xs text-red-500 font-bold mt-2 block';
          }
        }

        async function submitPromo() {
          const imgUrl = document.getElementById('p_image').value;
          if (!imgUrl) {
            alert('Aset gambar belum selesai terunggah. Harap tunggu sesaat!');
            return;
          }

          const btn = document.getElementById('btnSubmit');
          btn.innerText = 'Menyimpan...';
          btn.disabled = true;

          const payload = {
            type: document.getElementById('p_type').value,
            image: imgUrl,
            action_url: document.getElementById('p_url').value,
            is_active: 1
          };

          try {
            // PERHATIKAN: URL endpoint disesuaikan ke protected API
            const res = await fetch('/api/v1/protected/admin/promos', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getAuthToken()
              },
              body: JSON.stringify(payload)
            });
            
            if(res.ok) {
              window.location.reload();
            } else {
              alert('Gagal menyimpan promo ke database.');
              btn.innerText = 'Simpan & Terbitkan Promo';
              btn.disabled = false;
            }
          } catch(e) {
            alert('Gangguan koneksi jaringan.');
            btn.innerText = 'Simpan & Terbitkan Promo';
            btn.disabled = false;
          }
        }

        async function togglePromo(id, currentStatus) {
          try {
            await fetch('/api/v1/protected/admin/promos/' + id + '/status', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getAuthToken()
              },
              body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 })
            });
            window.location.reload();
          } catch(e) { alert('Gagal merubah status'); }
        }

        async function deletePromo(id) {
          if(!confirm('Anda yakin ingin menghapus data promo ini secara permanen?')) return;
          try {
            await fetch('/api/v1/protected/admin/promos/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            });
            window.location.reload();
          } catch(e) { alert('Gagal menghapus promo'); }
        }
      `}} />
    </div>
  , { title: 'Admin - Promo' })
})

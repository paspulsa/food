import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil semua data promo dari database
  const { results: promos } = await c.env.DB.prepare(
    'SELECT * FROM app_promos ORDER BY created_at DESC'
  ).all();

  return c.render(
    <div class="space-y-6">
      <div class="flex justify-between items-center bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Manajemen Promo</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola Banner Slider dan Popup Modal untuk pelanggan.</p>
        </div>
        <button onclick="openPromoModal()" class="bg-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary/20 hover:opacity-90 transition-all">
          + Tambah Promo Baru
        </button>
      </div>

      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-darkbg text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
              <th class="px-6 py-4">Preview</th>
              <th class="px-6 py-4">Tipe</th>
              <th class="px-6 py-4">Link Aksi</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-darkborder">
            {promos.map((p: any) => (
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-6 py-4">
                  <img src={p.image} class="w-24 h-12 object-cover rounded-lg border dark:border-gray-700" />
                </td>
                <td class="px-6 py-4 font-bold text-sm text-gray-700 dark:text-gray-300">{p.type}</td>
                <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-[150px]">{p.action_url || '-'}</td>
                <td class="px-6 py-4">
                  <span class={`px-2 py-1 text-[10px] font-bold rounded-full ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button onclick={`togglePromo('${p.id}', ${p.is_active})`} class="text-xs font-bold text-blue-600 hover:underline mr-3">Toggle Status</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH PROMO */}
      <div id="promoModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel w-full max-w-lg rounded-2xl p-6 shadow-2xl">
          <h3 class="text-lg font-bold mb-4 dark:text-white">Tambah Promo</h3>
          <form onsubmit="event.preventDefault(); submitPromo();" class="space-y-4">
            <div>
              <label class="block text-xs font-bold mb-1 dark:text-gray-300">Tipe</label>
              <select id="p_type" class="w-full p-2 bg-gray-50 border rounded-lg dark:bg-darkbg dark:text-white">
                <option value="BANNER">BANNER (Slider Atas)</option>
                <option value="MODAL">MODAL (Popup)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 dark:text-gray-300">Gambar</label>
              <input type="file" onchange="uploadImage(this)" class="w-full p-2 bg-gray-50 border rounded-lg" required />
              <input type="hidden" id="p_image" />
            </div>
            <div>
              <label class="block text-xs font-bold mb-1 dark:text-gray-300">Link Tujuan</label>
              <input type="text" id="p_url" class="w-full p-2 bg-gray-50 border rounded-lg dark:bg-darkbg dark:text-white" placeholder="Contoh: /users/promo-link" />
            </div>
            <button type="submit" class="w-full bg-primary text-white py-2 rounded-xl font-bold">Simpan</button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function openPromoModal() { document.getElementById('promoModal').classList.remove('hidden'); }
        function closePromoModal() { document.getElementById('promoModal').classList.add('hidden'); }

        async function uploadImage(input) {
          const fd = new FormData();
          fd.append('file', input.files[0]);
          const res = await fetch('/api/v1/protected/admin/uploads', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + document.cookie.replace(/(?:(?:^|.*;\s*)admin_token\s*\=\s*([^;]*).*$)|^.*$/, "$1") },
            body: fd
          });
          const data = await res.json();
          document.getElementById('p_image').value = data.url;
        }

        async function submitPromo() {
          const payload = {
            type: document.getElementById('p_type').value,
            image: document.getElementById('p_image').value,
            action_url: document.getElementById('p_url').value,
            is_active: 1
          };
          await fetch('/api/v1/admin/promos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          window.location.reload();
        }

        async function togglePromo(id, current) {
          await fetch('/api/v1/admin/promos/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: current === 1 ? 0 : 1 })
          });
          window.location.reload();
        }
      `}} />
    </div>
  , { title: 'Admin - Promo' })
})

import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const { results: menus } = await c.env.DB.prepare(`
    SELECT m.id, m.name, m.description, r.name as restaurant_name 
    FROM menus m
    JOIN restaurants r ON m.restaurant_id = r.id
    ORDER BY m.created_at DESC LIMIT 100
  `).all();

  return c.render(
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Katalog Kategori Menu</h2>
          <p class="text-gray-500 text-sm mt-1">Konfigurasi struktur klasifikasi produk (Makanan/Minuman) per mitra restoran.</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="px-6 py-4 font-semibold">Nama Kategori</th>
              <th class="px-6 py-4 font-semibold">Deskripsi Klasifikasi</th>
              <th class="px-6 py-4 font-semibold">Mitra Restoran</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 text-sm">
            {menus.length === 0 ? (
              <tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Belum ada kategori menu yang terdaftar di database D1.</td></tr>
            ) : menus.map((menu: any) => (
              <tr class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4 font-bold text-gray-800">{menu.name}</td>
                <td class="px-6 py-4 text-gray-500 font-medium">{menu.description || '-'}</td>
                <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-lg bg-orange-50 text-primary font-bold border border-orange-100">{menu.restaurant_name}</span></td>
                <td class="px-6 py-4 text-right">
                  <button 
                    class="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors"
                    onclick={`deleteMenu('${menu.id}')`}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function deleteMenu(menuId) {
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          if (!token) return alert('Akses ditolak.');
          if(!confirm('Hapus kategori ini beserta seluruh produk di dalamnya?')) return;

          try {
            const res = await fetch('/api/v1/protected/admin/menus/' + menuId, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if(data.success) window.location.reload();
          } catch(e) {
            alert('Kesalahan transmisi.');
          }
        }
      `}} />
    </div>
  , { title: 'Katalog Kategori Menu' })
})

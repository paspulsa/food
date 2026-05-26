import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // JOIN tabel menus dengan restaurants agar nama restoran muncul
  const { results: menus } = await c.env.DB.prepare(`
    SELECT m.id, m.name, m.description, m.created_at, r.name as restaurant_name 
    FROM menus m
    JOIN restaurants r ON m.restaurant_id = r.id
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all();

  return c.render(
    <div class="animate-fade-in">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Katalog Kategori Menu</h2>
          <p class="text-sm text-gray-500 mt-1">Kelola kategori produk (Makanan, Minuman, dll) dari mitra restoran.</p>
        </div>
        <button class="bg-primary hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Kategori
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50/80">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori Menu</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Milik Restoran</th>
              <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {menus.length === 0 ? (
              <tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Belum ada kategori menu terdaftar</td></tr>
            ) : menus.map((menu: any) => (
              <tr class="hover:bg-gray-50 transition-colors group">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-800">{menu.name}</div>
                  <div class="text-xs text-gray-400 font-mono mt-1" title={menu.id}>ID: {menu.id.substring(0,8)}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{menu.description || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary bg-orange-50/30">
                  {menu.restaurant_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button class="text-blue-600 hover:text-blue-900 mr-3 opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  <button class="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { title: 'Katalog Menu - Admin' }
  )
})

import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, phone, rating, isActive FROM restaurants ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.render(
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Manajemen Mitra Restoran</h2>
          <p class="text-gray-500 text-sm mt-1">Kelola data operasional dan status aktifasi seluruh gerai mitra restoran.</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="px-6 py-4 font-semibold">Nama Gerai</th>
              <th class="px-6 py-4 font-semibold">Alamat Lokasi</th>
              <th class="px-6 py-4 font-semibold">Kontak</th>
              <th class="px-6 py-4 font-semibold">Status Operasi</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 text-sm">
            {restaurants.map((resto: any) => (
              <tr class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4 font-bold text-gray-800">{resto.name}</td>
                <td class="px-6 py-4 text-gray-500 max-w-xs truncate font-medium">{resto.address}</td>
                <td class="px-6 py-4 font-mono text-xs text-gray-600">{resto.phone || '-'}</td>
                <td class="px-6 py-4">
                  <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-black ${resto.isActive === 1 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {resto.isActive === 1 ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button 
                    class="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-100 transition-colors"
                    onclick={`deleteRestaurant('${resto.id}', '${resto.name}')`}
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
        async function deleteRestaurant(restoId, restoName) {
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          if (!token) return alert('Sesi kedaluwarsa.');
          if (!confirm('Apakah Anda yakin ingin menghapus restoran ' + restoName + '? Tindakan ini permanen.')) return;

          try {
            const res = await fetch('/api/v1/protected/admin/restaurants/' + restoId, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if(data.success) window.location.reload();
          } catch(e) {
            alert('Gangguan transmisi data.');
          }
        }
      `}} />
    </div>
  , { title: 'Manajemen Mitra Restoran' })
})

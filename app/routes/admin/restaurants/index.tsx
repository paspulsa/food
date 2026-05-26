import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Mengambil data raw langsung dari D1 seperti instruksi Anda
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT * FROM restaurants ORDER BY created_at DESC LIMIT 50'
  ).all();

  return c.render(
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Manajemen Restoran</h2>
        <button class="bg-blue-600 text-white px-4 py-2 rounded">Tambah Restoran</button>
      </div>

      <div class="bg-white rounded shadow overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {restaurants.map((resto: any) => (
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{resto.id.substring(0,8)}...</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resto.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${resto.isActive === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {resto.isActive === 1 ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900 cursor-pointer">
                  Edit
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    { title: 'Manajemen Restoran' }
  )
})

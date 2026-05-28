import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB;
  
  // Menampilkan stok terkini dari menu_items
  const { results: items } = await db.prepare(`
    SELECT m.id, m.name, m.stock, c.name as category_name
    FROM menu_items m
    LEFT JOIN menu_categories c ON m.category_id = c.id
    ORDER BY c.name ASC, m.name ASC
  `).all();

  return c.render(
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
         <h2 class="text-2xl font-black text-gray-800">Cek Aset & Stok Bahan</h2>
         <p class="text-sm font-bold text-gray-500 mt-1">Pantau ketersediaan menu secara langsung.</p>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
         <div class="overflow-x-auto">
           <table class="w-full text-left whitespace-nowrap">
             <thead>
               <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                 <th class="px-4 py-3 rounded-tl-lg">Kategori</th>
                 <th class="px-4 py-3">Nama Menu / Bahan</th>
                 <th class="px-4 py-3 rounded-tr-lg text-right">Sisa Stok</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-gray-100 text-sm font-medium">
               {items.map((it: any) => (
                 <tr class="hover:bg-gray-50">
                   <td class="px-4 py-4 text-gray-500">{it.category_name || 'Uncategorized'}</td>
                   <td class="px-4 py-4 font-bold text-gray-800">{it.name}</td>
                   <td class="px-4 py-4 text-right">
                      <span class={`px-3 py-1 rounded-lg text-xs font-black ${it.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                         {it.stock} Tersedia
                      </span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  , { title: 'Cek Stok - Kasir' })
})

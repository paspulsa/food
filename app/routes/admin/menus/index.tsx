import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // 1. Ambil Restoran Induk (Single Tenant Mode)
  const masterRestaurant = await c.env.DB.prepare(
    'SELECT id, name FROM restaurants ORDER BY created_at ASC LIMIT 1'
  ).first<any>();

  // 2. Ambil seluruh Kategori Menu milik Restoran Induk
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, description FROM menus WHERE restaurant_id = ? ORDER BY created_at DESC'
  ).bind(masterRestaurant?.id || '').all();

  // 3. Ambil seluruh Item/Produk Menu
  const { results: menuItems } = await c.env.DB.prepare(
    'SELECT id, menu_id, name, description, price, image, is_available FROM menu_items ORDER BY created_at DESC'
  ).all();

  // Kelompokkan produk berdasarkan Kategori (Menu ID)
  const itemsByCategory = menuItems.reduce((acc: any, item: any) => {
    if (!acc[item.menu_id]) acc[item.menu_id] = [];
    acc[item.menu_id].push(item);
    return acc;
  }, {});

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 animate-fade-in relative">
      {/* HEADER */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 class="text-2xl font-black text-gray-800 tracking-tight">Katalog Produk ShopeeFood</h2>
          <p class="text-gray-500 text-sm mt-1">
            Restoran Induk: <span class="font-bold text-primary">{masterRestaurant?.name || 'Belum ada restoran dibuat'}</span>
          </p>
        </div>
        <button 
          onclick="openCategoryModal()"
          class="bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
          disabled={!masterRestaurant}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Tambah Kategori Baru
        </button>
      </div>

      {/* DAFTAR KATEGORI & PRODUK (HIERARKI) */}
      {!masterRestaurant ? (
        <div class="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
          <p class="text-red-600 font-bold">Peringatan: Restoran Induk belum ditemukan!</p>
          <p class="text-sm text-red-500 mt-1">Silakan tambahkan minimal 1 restoran di menu "Restoran" terlebih dahulu.</p>
        </div>
      ) : categories.length === 0 ? (
        <div class="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002 2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <h3 class="text-lg font-bold text-gray-700">Belum ada Kategori</h3>
          <p class="text-gray-500 text-sm mt-1">Mulai dengan menambahkan kategori pertama Anda (misal: "Makanan Utama", "Minuman Dingin").</p>
        </div>
      ) : (
        <div class="space-y-8">
          {categories.map((cat: any) => (
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div class="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 class="text-lg font-black text-gray-800 flex items-center gap-2">
                    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    {cat.name}
                  </h3>
                  <p class="text-xs text-gray-500 mt-0.5">{cat.description || 'Tidak ada deskripsi'}</p>
                </div>
                <div class="flex items-center gap-3">
                  <button onclick={`openProductModal('${cat.id}')`} class="text-sm font-bold text-primary hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors">
                    + Tambah Produk
                  </button>
                  <button onclick={`deleteCategory('${cat.id}')`} class="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 transition-colors">
                    Hapus
                  </button>
                </div>
              </div>
              
              <div class="p-6">
                {!itemsByCategory[cat.id] || itemsByCategory[cat.id].length === 0 ? (
                  <p class="text-sm text-gray-400 text-center py-4 italic">Belum ada produk di dalam kategori ini.</p>
                ) : (
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsByCategory[cat.id].map((product: any) => (
                      <div class="flex gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white relative">
                        <img 
                          src={product.image || 'https://via.placeholder.com/150?text=No+Image'} 
                          class="w-20 h-20 object-cover rounded-lg shadow-sm border border-gray-100" 
                          alt={product.name} 
                        />
                        <div class="flex-1 min-w-0">
                          <h4 class="font-bold text-gray-800 text-sm truncate pr-6">{product.name}</h4>
                          <p class="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                          <div class="mt-2 flex items-center justify-between">
                            <span class="font-black text-primary text-sm">{formatter.format(product.price)}</span>
                            <span class={`text-[10px] font-bold px-2 py-0.5 rounded-md ${product.is_available === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {product.is_available === 1 ? 'Tersedia' : 'Habis'}
                            </span>
                          </div>
                        </div>
                        <button onclick={`deleteProduct('${product.id}')`} class="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL TAMBAH KATEGORI --- */}
      <div id="categoryModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 transition-transform" id="categoryModalInner">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-black text-gray-800">Buat Kategori Baru</h3>
            <button onclick="closeCategoryModal()" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitCategory();">
            <input type="hidden" id="cat_restaurant_id" value={masterRestaurant?.id || ''} />
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Nama Kategori</label>
              <input type="text" id="cat_name" placeholder="Contoh: Kopi Spesial" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" required />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Deskripsi Singkat (Opsional)</label>
              <textarea id="cat_desc" rows={2} class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"></textarea>
            </div>
            <button type="submit" class="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-4">Simpan Kategori</button>
          </form>
        </div>
      </div>

      {/* --- MODAL TAMBAH PRODUK --- */}
      <div id="productModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform" id="productModalInner">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-black text-gray-800">Tambah Menu/Produk</h3>
            <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitProduct();">
            <input type="hidden" id="prod_menu_id" />
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Nama Menu</label>
              <input type="text" id="prod_name" placeholder="Nasi Goreng Spesial" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                <input type="number" id="prod_price" placeholder="25000" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Status Ketersediaan</label>
                <select id="prod_available" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                  <option value="1">Tersedia</option>
                  <option value="0">Habis (Kosong)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Deskripsi Lengkap</label>
              <textarea id="prod_desc" rows={2} placeholder="Sertakan komposisi atau varian rasa..." class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">URL Gambar (Opsional)</label>
              <input type="url" id="prod_image" placeholder="https://..." class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              <p class="text-xs text-gray-400 mt-1">Kosongkan jika ingin menggunakan gambar default.</p>
            </div>
            <button type="submit" class="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors mt-2">Tambahkan ke Katalog</button>
          </form>
        </div>
      </div>

      {/* KUMPULAN SCRIPT CLIENT-SIDE UNTUK KONTROL MODAL & API */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Utility: Ambil Token Otorisasi
        function getToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        // --- KONTROL MODAL KATEGORI ---
        function openCategoryModal() {
          const modal = document.getElementById('categoryModal');
          const inner = document.getElementById('categoryModalInner');
          modal.classList.remove('hidden');
          setTimeout(() => inner.classList.remove('scale-95'), 10);
        }
        function closeCategoryModal() {
          const inner = document.getElementById('categoryModalInner');
          inner.classList.add('scale-95');
          setTimeout(() => document.getElementById('categoryModal').classList.add('hidden'), 150);
        }
        
        async function submitCategory() {
          const token = getToken();
          if(!token) return alert('Sesi kedaluwarsa, silakan login ulang.');

          const payload = {
            restaurant_id: document.getElementById('cat_restaurant_id').value,
            name: document.getElementById('cat_name').value,
            description: document.getElementById('cat_desc').value
          };

          try {
            const res = await fetch('/api/v1/protected/admin/menus', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.success) window.location.reload();
            else alert(data.message || 'Gagal menyimpan kategori.');
          } catch(e) { alert('Terjadi kesalahan jaringan.'); }
        }

        async function deleteCategory(id) {
          if(!confirm('Yakin ingin menghapus kategori ini beserta SELURUH produk di dalamnya?')) return;
          const token = getToken();
          try {
            const res = await fetch('/api/v1/protected/admin/menus/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if(res.ok) window.location.reload();
          } catch(e) { alert('Gagal menghapus kategori.'); }
        }

        // --- KONTROL MODAL PRODUK ---
        function openProductModal(categoryId) {
          document.getElementById('prod_menu_id').value = categoryId;
          const modal = document.getElementById('productModal');
          const inner = document.getElementById('productModalInner');
          modal.classList.remove('hidden');
          setTimeout(() => inner.classList.remove('scale-95'), 10);
        }
        function closeProductModal() {
          const inner = document.getElementById('productModalInner');
          inner.classList.add('scale-95');
          setTimeout(() => document.getElementById('productModal').classList.add('hidden'), 150);
        }

        async function submitProduct() {
          const token = getToken();
          if(!token) return alert('Sesi kedaluwarsa.');

          const payload = {
            menu_id: document.getElementById('prod_menu_id').value,
            name: document.getElementById('prod_name').value,
            description: document.getElementById('prod_desc').value,
            price: parseInt(document.getElementById('prod_price').value),
            image: document.getElementById('prod_image').value || null,
            is_available: parseInt(document.getElementById('prod_available').value)
          };

          try {
            const res = await fetch('/api/v1/protected/admin/menu-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(data.success) window.location.reload();
            else alert(data.message || 'Gagal menyimpan produk.');
          } catch(e) { alert('Terjadi kesalahan jaringan saat menyimpan produk.'); }
        }

        async function deleteProduct(id) {
          if(!confirm('Hapus produk ini dari katalog?')) return;
          const token = getToken();
          try {
            const res = await fetch('/api/v1/protected/admin/menu-items/' + id, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if(res.ok) window.location.reload();
          } catch(e) { alert('Gagal menghapus produk.'); }
        }
      `}} />
    </div>
  , { title: 'Katalog Produk & Kategori' })
})

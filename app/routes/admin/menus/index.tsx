import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // 1. Tarik daftar unit gerai mitra
  const { results: outlets } = await c.env.DB.prepare(
    'SELECT id, name, address FROM restaurants ORDER BY created_at ASC'
  ).all();

  let activeOutletId = c.req.query('restaurant_id');
  if (!activeOutletId && outlets.length > 0) {
    activeOutletId = outlets[0].id as string;
  } else if (outlets.length === 0) {
    const defaultId = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO restaurants (id, name, address, isActive) VALUES (?, ?, ?, 1)'
    ).bind(defaultId, 'SPOS Gerai Induk', 'Kantor Pusat').run();
    return c.redirect('/admin/menus?restaurant_id=' + defaultId);
  }

  // 2. Tarik Kategori Menu terisolasi gerai terpilih
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, description FROM menus WHERE restaurant_id = ? ORDER BY created_at DESC'
  ).bind(activeOutletId).all();

  // 3. Tarik Item Produk relasional
  const { results: menuItems } = await c.env.DB.prepare(
    'SELECT id, menu_id, name, description, price, image, is_available, stock FROM menu_items ORDER BY created_at DESC'
  ).all();

  // Mapping Item berdasarkan ID Kategori
  const itemsByCategory = menuItems.reduce((acc: any, item: any) => {
    if (!acc[item.menu_id]) acc[item.menu_id] = [];
    acc[item.menu_id].push(item);
    return acc;
  }, {});

  const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 relative">
      {/* BAR ATAS SELEKTOR OUTLET DAN AKSI */}
      <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-100 dark:border-darkborder flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm">
        <div class="w-full lg:w-auto">
          <label class="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Pilih Unit Gerai / Restoran</label>
          <select 
            class="w-full sm:w-72 px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-primary cursor-pointer transition-colors"
            onchange="window.location.search = '?restaurant_id=' + this.value"
          >
            {outlets.map((outlet: any) => (
              <option value={outlet.id} selected={outlet.id === activeOutletId}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>
        
        <div class="flex gap-2 w-full lg:w-auto">
          <button onclick="openCategoryModal()" class="flex-1 lg:flex-none text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl border border-primary/10 transition-colors">
            + Kategori Baru
          </button>
          <button onclick="openProductModalGlobal()" class="flex-1 lg:flex-none text-xs font-bold text-white bg-primary hover:opacity-90 px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-colors">
            + Tambah Menu Produk
          </button>
        </div>
      </div>

      {/* STRUKTUR LIST KATALOG UTAMA */}
      {categories.length === 0 ? (
        <div class="bg-white dark:bg-darkpanel p-12 rounded-2xl border border-gray-100 dark:border-darkborder text-center shadow-sm">
          <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"></path></svg>
          </div>
          <h3 class="text-base font-bold text-gray-800 dark:text-white">Katalog Unit Kosong</h3>
          <p class="text-gray-400 dark:text-gray-500 text-xs mt-1 mb-4 max-w-xs mx-auto">Gerai pilihan belum memiliki klasifikasi menu produk kuliner.</p>
          <button onclick="openCategoryModal()" class="bg-primary text-white font-bold px-4 py-2 rounded-xl text-xs">Buat Kategori Pertama</button>
        </div>
      ) : (
        <div class="space-y-6">
          {categories.map((cat: any) => (
            <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden">
              {/* HEADER GRUP KATEGORI */}
              <div class="px-5 py-4 bg-gray-50 dark:bg-darkbg/40 border-b border-gray-100 dark:border-darkborder flex justify-between items-center">
                <div>
                  <h4 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span class="w-1.5 h-4 bg-primary rounded-full"></span>
                    {cat.name}
                  </h4>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cat.description || 'Tidak ada keterangan tambahan'}</p>
                </div>
                <button onclick={`deleteCategory('${cat.id}')`} class="text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors">Hapus</button>
              </div>

              {/* GRID VENDOR VARIANT ITEM */}
              <div class="p-5">
                {!itemsByCategory[cat.id] || itemsByCategory[cat.id].length === 0 ? (
                  <p class="text-xs text-gray-400 dark:text-gray-500 text-center py-2 italic">Belum ada item menu produk kuliner di bawah klasifikasi ini.</p>
                ) : (
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsByCategory[cat.id].map((item: any) => (
                      <div class="p-4 rounded-xl border border-gray-100 dark:border-darkborder bg-gray-50/50 dark:bg-darkbg/20 flex gap-3 relative group hover:border-primary/40 dark:hover:border-primary/40 transition-all">
                        <img 
                          src={item.image || 'https://via.placeholder.com/150?text=SPOS'} 
                          class="w-16 h-16 object-cover rounded-xl border border-gray-200/50 dark:border-darkborder flex-shrink-0 bg-white"
                          alt={item.name}
                        />
                        <div class="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h5 class="font-bold text-gray-800 dark:text-gray-200 text-sm truncate pr-4">{item.name}</h5>
                            <p class="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{item.description || '-'}</p>
                          </div>
                          
                          <div class="mt-2 space-y-1">
                            <div class="flex justify-between items-center">
                              <span class="text-sm font-bold text-primary">{currencyFormatter.format(item.price)}</span>
                              <span class={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.is_available === 1 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {item.is_available === 1 ? 'READY' : 'CLOSE'}
                              </span>
                            </div>
                            
                            {/* INSTANT ADJUSTMENT STOK DISPLAY */}
                            <div class="flex items-center justify-between border-t border-gray-100 dark:border-darkborder pt-1.5 mt-1">
                              <span class="text-[11px] text-gray-400">Stok:</span>
                              <div class="flex items-center gap-1">
                                <span class={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${item.stock <= 5 ? 'bg-red-500/10 text-red-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                  {item.stock} unit
                                </span>
                                <button 
                                  onclick={`adjustStockPOS('${item.id}', ${item.stock})`}
                                  class="p-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-primary hover:text-white dark:hover:bg-primary text-gray-500 dark:text-gray-400 transition-colors"
                                >
                                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button onclick={`deleteProduct('${item.id}')`} class="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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

      {/* MODAL DIALOG TAMBAH KATEGORI */}
      <div id="categoryModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 transition-all border dark:border-darkborder" id="categoryModalInner">
          <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center bg-gray-50 dark:bg-darkbg/40">
            <h3 class="font-bold text-gray-800 dark:text-white">Buat Kategori Baru</h3>
            <button onclick="closeCategoryModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitCategory();">
            <input type="hidden" id="cat_restaurant_id" value={activeOutletId} />
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Kategori</label>
              <input type="text" id="cat_name" placeholder="Contoh: Makanan Utama, Coffee" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm focus:border-primary" required />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Keterangan Deskripsi</label>
              <textarea id="cat_desc" rows={2} class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm focus:border-primary"></textarea>
            </div>
            <button type="submit" class="w-full bg-primary text-white font-bold py-2.5 rounded-xl shadow-md shadow-primary/10">Simpan Kategori</button>
          </form>
        </div>
      </div>

      {/* MODAL DIALOG TAMBAH PRODUK */}
      <div id="productModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-all border dark:border-darkborder" id="productModalInner">
          <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center bg-gray-50 dark:bg-darkbg/40">
            <h3 class="font-bold text-gray-800 dark:text-white">Tambah Produk Baru</h3>
            <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitProduct();">
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Target Penempatan Kategori</label>
              <select id="prod_menu_id" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-sm font-bold text-gray-800 dark:text-white outline-none" required>
                <option value="" disabled selected>-- Tentukan Kategori --</option>
                {categories.map((c: any) => <option value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Item Produk</label>
              <input type="text" id="prod_name" placeholder="Kopi Arabica Blend" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm" required />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Harga Jual (Rp)</label>
                <input type="number" id="prod_price" placeholder="15000" class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Stok POS</label>
                <input type="number" id="prod_stock" value="50" min="0" class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status Rilis</label>
                <select id="prod_available" class="w-full px-2 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  <option value="1">Langsung Aktif</option>
                  <option value="0">Arsipkan</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Deskripsi Kuliner</label>
              <textarea id="prod_desc" rows={2} placeholder="Sertakan info komposisi, varian, porsi, dsb..." class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm"></textarea>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-darkbg/30 rounded-xl border border-gray-200 dark:border-darkborder">
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Foto Produk ke CDN R2</label>
              <input type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:opacity-80 cursor-pointer" onchange="handleDirectR2Upload(this)" />
              <input type="hidden" id="prod_image_url" />
              <div id="upload-status" class="hidden"></div>
            </div>

            <button type="submit" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md shadow-primary/10">Simpan Menu ke Sistem POS</button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function getAuthToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        async function handleDirectR2Upload(inputElement) {
          const file = inputElement.files[0];
          if(!file) return;

          const statusBox = document.getElementById('upload-status');
          statusBox.innerText = 'Menyimpan berkas data biner ke klaster R2...';
          statusBox.className = 'text-xs text-blue-500 font-bold mt-2 block animate-pulse';

          const token = getAuthToken();
          const formData = new FormData();
          formData.append('file', file);

          try {
            const res = await fetch('/api/v1/protected/admin/uploads', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + token },
              body: formData
            });
            const data = await res.json();
            
            if(data.success || data.url) {
              document.getElementById('prod_image_url').value = data.url || data.filePath;
              statusBox.innerText = '✓ Berhasil disimpan di R2 CDN Storage';
              statusBox.className = 'text-xs text-green-500 font-bold mt-2 block';
            }
          } catch(err) {
            statusBox.innerText = '✕ Kesalahan transmisi R2.';
            statusBox.className = 'text-xs text-red-500 font-bold mt-2 block';
          }
        }

        async function adjustStockPOS(productId, currentStock) {
          const token = getAuthToken();
          const targetStock = prompt('Masukkan kuantitas ketersediaan stok fisik terbaru di gerai:', currentStock);
          if (targetStock === null || targetStock.trim() === '' || isNaN(targetStock)) return;

          try {
            const res = await fetch('/api/v1/protected/admin/menu-items/' + productId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
              body: JSON.stringify({ stock: parseInt(targetStock) })
            });
            if(res.ok) window.location.reload();
          } catch(e) { alert('Kesalahan transmisi data.'); }
        }

        function openCategoryModal() {
          document.getElementById('categoryModal').classList.remove('hidden');
        }
        function closeCategoryModal() {
          document.getElementById('categoryModal').classList.add('hidden');
        }
        function openProductModalGlobal() {
          const sel = document.getElementById('prod_menu_id');
          if(sel.options.length <= 1) {
            alert('Harap buat Kategori Menu terlebih dahulu untuk gerai ini!');
            openCategoryModal();
            return;
          }
          sel.value = "";
          openProductModal();
        }
        function openProductModal(catId = '') {
          if(catId) document.getElementById('prod_menu_id').value = catId;
          document.getElementById('productModal').classList.remove('hidden');
        }
        function closeProductModal() {
          document.getElementById('productModal').classList.add('hidden');
        }

        async function submitCategory() {
          const payload = {
            restaurant_id: document.getElementById('cat_restaurant_id').value,
            name: document.getElementById('cat_name').value,
            description: document.getElementById('cat_desc').value
          };
          const res = await fetch('/api/v1/protected/admin/menus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
            body: JSON.stringify(payload)
          });
          if(res.ok) window.location.reload();
        }

        async function submitProduct() {
          const payload = {
            menu_id: document.getElementById('prod_menu_id').value,
            name: document.getElementById('prod_name').value,
            description: document.getElementById('prod_desc').value,
            price: parseInt(document.getElementById('prod_price').value),
            stock: parseInt(document.getElementById('prod_stock').value),
            image: document.getElementById('prod_image_url').value || null,
            is_available: parseInt(document.getElementById('prod_available').value)
          };
          const res = await fetch('/api/v1/protected/admin/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
            body: JSON.stringify(payload)
          });
          if(res.ok) window.location.reload();
        }

        async function deleteCategory(id) {
          if(!confirm('Hapus kategori? Produk di dalamnya akan ikut terhapus.')) return;
          await fetch('/api/v1/protected/admin/menus/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getAuthToken() } });
          window.location.reload();
        }

        async function deleteProduct(id) {
          if(!confirm('Hapus item produk ini?')) return;
          await fetch('/api/v1/protected/admin/menu-items/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getAuthToken() } });
          window.location.reload();
        }
      `}} />
    </div>
  , { title: 'Katalog Produk Multi-Gerai - SPOS' })
})

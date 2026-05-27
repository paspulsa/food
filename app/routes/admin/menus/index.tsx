import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
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

  // TARIK DATA TERMASUK image
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, description, sort_order, is_active, image FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order ASC, created_at DESC'
  ).bind(activeOutletId).all();

  // TARIK DATA TERMASUK is_custom DAN custom_options
  const { results: menuItems } = await c.env.DB.prepare(
    'SELECT id, category_id, name, description, price, image, is_available, stock, is_promo, promo_price, end_promo_time, hpp, is_custom, custom_options FROM menu_items ORDER BY created_at DESC'
  ).all();

  const itemsByCategory = menuItems.reduce((acc: any, item: any) => {
    const catId = item.category_id || item.menu_id; 
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {});

  const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="space-y-6 relative">
      <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-100 dark:border-darkborder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div class="w-full sm:w-auto">
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
        
        <div class="flex gap-2 w-full sm:w-auto">
          <button onclick="openCategoryModal()" class="flex-1 sm:flex-none text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-xl border border-primary/10 transition-colors">
            + Kategori Baru
          </button>
          <button onclick="openProductModalGlobal()" class="flex-1 sm:flex-none text-xs font-bold text-white bg-primary hover:opacity-90 px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 transition-colors">
            + Tambah Menu Produk
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div class="bg-white dark:bg-darkpanel p-12 rounded-2xl border border-gray-100 dark:border-darkborder text-center shadow-sm">
          <h3 class="text-base font-bold text-gray-800 dark:text-white">Katalog Unit Masih Kosong</h3>
          <button onclick="openCategoryModal()" class="bg-primary text-white font-bold px-4 py-2 rounded-xl text-xs mt-3">Buat Kategori Pertama</button>
        </div>
      ) : (
        <div class="space-y-6">
          {categories.map((cat: any) => {
            const safeCatName = cat.name.replace(/'/g, "\\'");
            const safeCatDesc = (cat.description || '').replace(/'/g, "\\'");
            
            return (
              <div class={`bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden ${cat.is_active === 0 ? 'opacity-60 grayscale-[30%]' : ''}`}>
                <div class="px-5 py-4 bg-gray-50 dark:bg-darkbg/40 border-b border-gray-100 dark:border-darkborder flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    {cat.image && <img src={cat.image} alt={cat.name} class="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />}
                    <div>
                      <h4 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span class="w-1.5 h-4 bg-primary rounded-full"></span>
                        {cat.name}
                        {cat.is_active === 0 && <span class="text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded font-bold">NONAKTIF</span>}
                      </h4>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Urutan: {cat.sort_order} • {cat.description || 'Tidak ada deskripsi'}</p>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button onclick={`openCategoryModal('${cat.id}', '${safeCatName}', ${cat.sort_order}, ${cat.is_active}, '${safeCatDesc}', '${cat.image || ''}')`} class="text-xs font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-colors">Edit</button>
                    <button onclick={`deleteCategory('${cat.id}')`} class="text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors">Hapus</button>
                  </div>
                </div>

                <div class="p-5">
                  {!itemsByCategory[cat.id] || itemsByCategory[cat.id].length === 0 ? (
                    <p class="text-xs text-gray-400 dark:text-gray-500 text-center py-2 italic">Belum ada item produk di bawah kategori ini.</p>
                  ) : (
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {itemsByCategory[cat.id].map((item: any) => {
                        const isPromoActive = item.is_promo === 1;
                        const activePrice = isPromoActive ? item.promo_price : item.price;
                        const profitMargin = activePrice - (item.hpp || 0);

                        // Lolos Escape quotes untuk parsing JSON yang aman di atribut fungsi onClick
                        const safeName = item.name.replace(/'/g, "\\'");
                        const safeDesc = (item.description || '').replace(/'/g, "\\'");
                        const safeCustomOptions = (item.custom_options || '[]').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                        return (
                          <div class="p-4 rounded-xl border border-gray-100 dark:border-darkborder bg-gray-50/50 dark:bg-darkbg/20 flex gap-3 relative group hover:border-primary/40 dark:hover:border-primary/40 transition-all">
                            <div class="relative w-16 h-16 flex-shrink-0">
                              <img src={item.image || 'https://via.placeholder.com/150?text=SPOS'} class="w-full h-full object-cover rounded-xl border border-gray-200/50 dark:border-darkborder bg-white" alt={item.name} />
                            </div>
                            
                            <div class="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div class="flex items-start justify-between gap-1">
                                  <h5 class="font-bold text-gray-800 dark:text-gray-200 text-sm pr-4 line-clamp-1 flex items-center gap-1">
                                    {item.name} 
                                    {/* LABEL DAPAT DICUSTOM */}
                                    {item.is_custom === 1 && <span class="bg-blue-100 text-blue-600 text-[8px] px-1 py-0.5 rounded border border-blue-200" title="Dapat Dicustom">🛠️</span>}
                                  </h5>
                                  <button 
                                    onclick={`openProductModal('${item.id}', '${item.category_id || item.menu_id}', '${safeName}', '${safeDesc}', ${item.price}, ${item.stock}, ${item.is_available}, ${item.is_promo}, ${item.promo_price}, '${item.end_promo_time || ''}', ${item.hpp}, '${item.image || ''}', ${item.is_custom}, '${safeCustomOptions}')`}
                                    class="text-gray-400 hover:text-primary transition-colors"
                                    title="Edit"
                                  >
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                  </button>
                                </div>
                                
                                <div class="mt-1 flex items-baseline gap-1.5 flex-wrap">
                                  {isPromoActive ? (
                                    <>
                                      <span class="text-sm font-black text-red-500 dark:text-red-400">{currencyFormatter.format(item.promo_price)}</span>
                                      <span class="text-[11px] text-gray-400 line-through font-medium">{currencyFormatter.format(item.price)}</span>
                                    </>
                                  ) : (
                                    <span class="text-sm font-black text-primary">{currencyFormatter.format(item.price)}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div class="mt-2 pt-1 border-t border-gray-100 dark:border-darkborder space-y-1 text-[11px]">
                                <div class="flex justify-between items-center text-gray-400">
                                  <span>Stok: <strong class="text-gray-700 dark:text-gray-300 font-mono font-bold">{item.stock} unit</strong></span>
                                  <span class={`font-bold px-1.5 py-0.2 rounded text-[10px] ${item.is_available === 1 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {item.is_available === 1 ? 'READY' : 'CLOSE'}
                                  </span>
                                </div>
                                <div class="flex justify-between items-center text-gray-400 border-t border-dashed border-gray-200/50 dark:border-gray-700/50 pt-1">
                                  <span>Laba: <span class="text-green-500 font-medium">{currencyFormatter.format(profitMargin)}</span></span>
                                </div>
                              </div>
                            </div>
                            
                            <button onclick={`deleteProduct('${item.id}')`} class="absolute bottom-3 right-3 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL KATEGORI */}
      <div id="categoryModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 transition-all border dark:border-darkborder" id="categoryModalInner">
          <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center bg-gray-50 dark:bg-darkbg/40">
            <h3 class="font-bold text-gray-800 dark:text-white" id="categoryModalTitle">Formulir Kategori</h3>
            <button onclick="closeCategoryModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitCategory();">
            <input type="hidden" id="cat_restaurant_id" value={activeOutletId} />
            <input type="hidden" id="cat_id" />
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Kategori</label>
              <input type="text" id="cat_name" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm focus:border-primary" required />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Urutan (*Sort Order*)</label>
                <input type="number" id="cat_sort" value="0" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status Aktivitas</label>
                <select id="cat_active" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  <option value="1">Aktif Tampilkan</option>
                  <option value="0">Sembunyikan Sementara</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Keterangan Deskripsi</label>
              <textarea id="cat_desc" rows={2} class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm focus:border-primary"></textarea>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-darkbg/30 rounded-xl border border-gray-200 dark:border-darkborder">
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Foto Kategori (R2 CDN)</label>
              <input type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:opacity-80 cursor-pointer" onchange="handleDirectUpload(this, 'cat_image_url', 'cat-upload-status')" />
              <input type="hidden" id="cat_image_url" />
              <div id="cat-upload-status" class="hidden"></div>
            </div>
            
            <button type="submit" class="w-full bg-primary text-white font-bold py-2.5 rounded-xl shadow-md">Simpan Kategori</button>
          </form>
        </div>
      </div>

      {/* MODAL PRODUK (Dengan Fitur Builder Kustomisasi Makanan) */}
      <div id="productModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform scale-95 transition-all border dark:border-darkborder" id="productModalInner">
          <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center bg-gray-50 dark:bg-darkbg/40">
            <h3 class="font-bold text-gray-800 dark:text-white" id="productModalTitle">Tambah Produk Baru</h3>
            <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4 max-h-[80vh] overflow-y-auto" onsubmit="event.preventDefault(); submitProduct();">
            <input type="hidden" id="prod_id" />
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Kategori</label>
                <select id="prod_category_id" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-sm font-bold text-gray-800 dark:text-white outline-none" required>
                  <option value="" disabled selected>-- Tentukan --</option>
                  {categories.map((c: any) => <option value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Item Produk</label>
                <input type="text" id="prod_name" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm" required />
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Harga Jual (Rp)</label>
                <input type="number" id="prod_price" class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Harga Modal (Rp)</label>
                <input type="number" id="prod_hpp" class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" required />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Stok Tersedia</label>
                <input type="number" id="prod_stock" class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm font-mono" required />
              </div>
            </div>

            <div class="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-3">
              <div class="flex items-center gap-2">
                <input type="checkbox" id="prod_is_promo" class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" onchange="togglePromoFields()" />
                <label for="prod_is_promo" class="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Aktifkan Status Promo</label>
              </div>
              <div id="promo_inputs_group" class="grid grid-cols-2 gap-3 transition-opacity duration-200">
                <div>
                  <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Harga Promo (Rp)</label>
                  <input type="number" id="prod_promo_price" class="w-full px-3 py-1.5 bg-white dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg text-sm font-mono text-gray-800 dark:text-white outline-none" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Batas Waktu</label>
                  <input type="datetime-local" id="prod_end_promo_time" class="w-full px-3 py-1.5 bg-white dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-lg text-xs font-mono text-gray-800 dark:text-white outline-none" />
                </div>
              </div>
            </div>

            {/* SEKTOR BUILDER CUSTOM OPTIONS */}
            <div class="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="prod_is_custom" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer" onchange="renderCustomBuilder()" />
                  <label for="prod_is_custom" class="text-sm font-bold text-blue-800 dark:text-blue-300 cursor-pointer">Item Bisa Dicustom (Level Pedas, Toping, dll)</label>
                </div>
              </div>
              
              <div id="custom-builder-container" class="space-y-3 hidden">
                {/* Diinjeksi oleh JavaScript Vanilla Visual Builder */}
              </div>

              {/* FIELD PESAN OTOMATIS */}
              <div id="custom-message-container" class="mt-4 hidden border-t border-blue-500/20 pt-4">
                <label class="block text-[11px] font-bold text-blue-600 mb-1">Teks Area Pesan Pelanggan (Otomatis Ditambahkan)</label>
                <textarea id="prod_custom_message" rows={2} class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:border-blue-500 text-gray-800 dark:text-white" placeholder="Cth: Tuliskan pesan tambahan untuk pesanan ini..."></textarea>
                <p class="text-[9px] text-blue-500/80 mt-1">Data pesan akan disimpan ke dalam konfigurasi custom options ke database.</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status Publikasi Kasir</label>
                <select id="prod_available" class="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-xs font-bold text-gray-800 dark:text-white outline-none">
                  <option value="1">Langsung Aktif</option>
                  <option value="0">Arsipkan/Kosong</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Deskripsi Ringkas</label>
                <input type="text" id="prod_desc" class="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg border border-gray-200 dark:border-darkborder rounded-xl text-gray-800 dark:text-white outline-none text-sm" />
              </div>
            </div>
            
            <div class="p-4 bg-gray-50 dark:bg-darkbg/30 rounded-xl border border-gray-200 dark:border-darkborder">
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Foto Produk (R2 CDN)</label>
              <input type="file" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:opacity-80 cursor-pointer" onchange="handleDirectUpload(this, 'prod_image_url', 'prod-upload-status')" />
              <input type="hidden" id="prod_image_url" />
              <div id="prod-upload-status" class="hidden"></div>
            </div>

            <button type="submit" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md">Simpan Menu ke Sistem POS</button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function getAuthToken() { return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1]; }

        function togglePromoFields() {
          const isChecked = document.getElementById('prod_is_promo').checked;
          const group = document.getElementById('promo_inputs_group');
          if (isChecked) {
            group.classList.remove('opacity-40', 'pointer-events-none');
            document.getElementById('prod_promo_price').required = true;
            document.getElementById('prod_end_promo_time').required = true;
          } else {
            group.classList.add('opacity-40', 'pointer-events-none');
            document.getElementById('prod_promo_price').required = false;
            document.getElementById('prod_end_promo_time').required = false;
          }
        }

        async function handleDirectUpload(inputElement, targetInputId, statusBoxId) {
          const file = inputElement.files[0];
          if(!file) return;
          const statusBox = document.getElementById(statusBoxId);
          statusBox.innerText = 'Mengunggah gambar...';
          statusBox.className = 'text-xs text-blue-500 font-bold mt-2 block animate-pulse';
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await fetch('/api/v1/protected/admin/uploads', {
              method: 'POST', headers: { 'Authorization': 'Bearer ' + getAuthToken() }, body: formData
            });
            const data = await res.json();
            if(data.success || data.url) {
              document.getElementById(targetInputId).value = data.url || data.filePath;
              statusBox.innerText = '✓ Berhasil diunggah ke R2';
              statusBox.className = 'text-xs text-green-500 font-bold mt-2 block';
            }
          } catch(err) {
            statusBox.innerText = '✕ Gagal unggah data.';
            statusBox.className = 'text-xs text-red-500 font-bold mt-2 block';
          }
        }

        // ==========================================
        // VANILLA JS: DYNAMIC JSON BUILDER KUSTOMISASI
        // ==========================================
        let customState = [];

        function renderCustomBuilder() {
          const container = document.getElementById('custom-builder-container');
          const messageContainer = document.getElementById('custom-message-container');
          
          if (!document.getElementById('prod_is_custom').checked) {
            container.classList.add('hidden');
            messageContainer.classList.add('hidden');
            return;
          }
          container.classList.remove('hidden');
          messageContainer.classList.remove('hidden');

          let html = '';
          customState.forEach((group, gIndex) => {
            html += \`
              <div class="border border-blue-200 p-3 rounded-xl bg-white dark:bg-darkbg dark:border-gray-700 mb-3 relative group">
                <button type="button" onclick="removeGroup(\${gIndex})" class="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-red-50 rounded p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 pr-8">
                  <input type="text" class="text-sm font-bold border-b border-gray-300 outline-none focus:border-blue-500 py-1 flex-1 dark:bg-darkbg dark:text-white" placeholder="Nama Grup (Cth: Level Pedas)" value="\${group.name.replace(/"/g, '&quot;')}" onchange="updateGroup(\${gIndex}, 'name', this.value)">
                  <select class="text-xs border border-gray-300 rounded-lg p-1.5 outline-none dark:bg-gray-800 dark:text-white" onchange="updateGroup(\${gIndex}, 'type', this.value)">
                    <option value="radio" \${group.type === 'radio' ? 'selected' : ''}>Pilih 1 Saja (Radio)</option>
                    <option value="checkbox" \${group.type === 'checkbox' ? 'selected' : ''}>Pilih Banyak (Checkbox)</option>
                  </select>
                  <label class="text-[11px] font-bold flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                    <input type="checkbox" \${group.is_required ? 'checked' : ''} onchange="updateGroup(\${gIndex}, 'is_required', this.checked)"> Wajib Diisi
                  </label>
                </div>

                <div class="space-y-2 pl-3 border-l-2 border-blue-100 dark:border-blue-900/50">
            \`;
            group.choices.forEach((choice, cIndex) => {
              html += \`
                <div class="flex items-center gap-2">
                  <input type="text" class="text-xs border border-gray-200 rounded-lg p-1.5 flex-1 outline-none focus:border-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Pilihan (Cth: Ekstra Pedas)" value="\${choice.name.replace(/"/g, '&quot;')}" onchange="updateChoice(\${gIndex}, \${cIndex}, 'name', this.value)">
                  <div class="relative w-28">
                    <span class="absolute inset-y-0 left-0 pl-2 flex items-center text-[10px] text-gray-400">+Rp</span>
                    <input type="number" class="text-xs border border-gray-200 rounded-lg p-1.5 pl-8 w-full outline-none focus:border-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700" placeholder="Harga" value="\${choice.price}" onchange="updateChoice(\${gIndex}, \${cIndex}, 'price', this.value)">
                  </div>
                  <button type="button" onclick="removeChoice(\${gIndex}, \${cIndex})" class="text-gray-400 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              \`;
            });
            html += \`
                  <button type="button" onclick="addChoice(\${gIndex})" class="text-[11px] text-blue-600 font-bold mt-2 hover:underline">+ Tambah Pilihan</button>
                </div>
              </div>
            \`;
          });
          html += \`<button type="button" onclick="addGroup()" class="w-full border-2 border-dashed border-blue-200 text-blue-600 bg-blue-50 text-xs font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors">+ Tambah Grup Kustomisasi</button>\`;
          container.innerHTML = html;
        }

        // Mutasi State
        function addGroup() { customState.push({ name: '', type: 'radio', is_required: true, choices: [] }); renderCustomBuilder(); }
        function removeGroup(idx) { customState.splice(idx, 1); renderCustomBuilder(); }
        function updateGroup(idx, key, val) { customState[idx][key] = val; }
        
        function addChoice(gIdx) { customState[gIdx].choices.push({ name: '', price: 0 }); renderCustomBuilder(); }
        function removeChoice(gIdx, cIdx) { customState[gIdx].choices.splice(cIdx, 1); renderCustomBuilder(); }
        function updateChoice(gIdx, cIdx, key, val) { 
          if(key === 'price') val = parseInt(val) || 0;
          customState[gIdx].choices[cIdx][key] = val; 
        }

        // ==========================================
        // KONTROL MODAL UTAMA
        // ==========================================
        function openProductModalGlobal() {
          const sel = document.getElementById('prod_category_id');
          if(sel.options.length <= 1) {
            alert('Harap buat Kategori Menu terlebih dahulu!');
            openCategoryModal();
            return;
          }
          openProductModal('', '', '', '', '', 50, 1, 0, 0, '', 0, '', 0, '[]');
        }

        function openProductModal(id='', catId='', name='', desc='', price='', stock='50', available='1', isPromo='0', promoPrice='0', endTime='', hpp='0', img='', isCustom=0, customOptionsStr='[]') {
          document.getElementById('productModalTitle').innerText = id ? 'Konfigurasi Edit Menu Produk' : 'Tambah Menu Produk Baru';
          document.getElementById('prod_id').value = id;
          document.getElementById('prod_category_id').value = catId;
          document.getElementById('prod_name').value = name;
          document.getElementById('prod_desc').value = desc;
          document.getElementById('prod_price').value = price;
          document.getElementById('prod_stock').value = stock;
          document.getElementById('prod_hpp').value = hpp;
          document.getElementById('prod_available').value = available;
          document.getElementById('prod_is_promo').checked = parseInt(isPromo) === 1;
          document.getElementById('prod_promo_price').value = promoPrice;
          document.getElementById('prod_end_promo_time').value = endTime ? endTime.substring(0,16) : '';
          document.getElementById('prod_image_url').value = img;
          document.getElementById('prod-upload-status').innerText = ''; // Reset Upload Info
          
          document.getElementById('prod_is_custom').checked = parseInt(isCustom) === 1;
          try {
            let parsedStr = customOptionsStr ? customOptionsStr.replace(/&quot;/g, '"') : '[]';
            let rawData = JSON.parse(parsedStr);
            
            // Kompatibilitas dengan data lama (array murni) maupun baru (object dengan pesan)
            if (Array.isArray(rawData)) {
                customState = rawData;
                document.getElementById('prod_custom_message').value = '';
            } else {
                customState = rawData.builder || [];
                document.getElementById('prod_custom_message').value = rawData.message || '';
            }
          } catch(e) {
            customState = [];
            document.getElementById('prod_custom_message').value = '';
          }
          
          togglePromoFields();
          renderCustomBuilder();

          const modal = document.getElementById('productModal');
          const inner = document.getElementById('productModalInner');
          modal.classList.remove('hidden');
          setTimeout(() => inner.classList.remove('scale-95'), 10);
        }

        function closeProductModal() {
          document.getElementById('productModalInner').classList.add('scale-95');
          setTimeout(() => document.getElementById('productModal').classList.add('hidden'), 150);
        }

        function openCategoryModal(id='', name='', sort=0, active=1, desc='', image='') { 
          document.getElementById('categoryModalTitle').innerText = id ? 'Edit Kategori' : 'Buat Kategori Baru';
          document.getElementById('cat_id').value = id;
          document.getElementById('cat_name').value = name;
          document.getElementById('cat_sort').value = sort;
          document.getElementById('cat_active').value = active;
          document.getElementById('cat_desc').value = desc;
          document.getElementById('cat_image_url').value = image;
          document.getElementById('cat-upload-status').innerText = '';
          
          document.getElementById('categoryModal').classList.remove('hidden'); 
        }
        function closeCategoryModal() { document.getElementById('categoryModal').classList.add('hidden'); }

        async function submitCategory() {
          const id = document.getElementById('cat_id').value;
          const payload = {
            restaurant_id: document.getElementById('cat_restaurant_id').value,
            name: document.getElementById('cat_name').value,
            sort_order: parseInt(document.getElementById('cat_sort').value) || 0,
            is_active: parseInt(document.getElementById('cat_active').value),
            description: document.getElementById('cat_desc').value,
            image: document.getElementById('cat_image_url').value || null
          };
          
          const method = id ? 'PUT' : 'POST';
          const endpoint = id ? '/api/v1/protected/admin/menu-categories/' + id : '/api/v1/protected/admin/menu-categories';
          
          await fetch(endpoint, {
            method: method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
            body: JSON.stringify(payload)
          });
          window.location.reload();
        }

        async function submitProduct() {
          const id = document.getElementById('prod_id').value;
          
          // Struktur data kustom yang membungkus builder dan field pesan
          const customPayload = {
             builder: customState,
             message: document.getElementById('prod_custom_message').value
          };

          const payload = {
            category_id: document.getElementById('prod_category_id').value,
            name: document.getElementById('prod_name').value,
            description: document.getElementById('prod_desc').value,
            price: parseInt(document.getElementById('prod_price').value) || 0,
            hpp: parseInt(document.getElementById('prod_hpp').value) || 0,
            stock: parseInt(document.getElementById('prod_stock').value) || 0,
            is_available: parseInt(document.getElementById('prod_available').value),
            is_promo: document.getElementById('prod_is_promo').checked ? 1 : 0,
            promo_price: parseInt(document.getElementById('prod_promo_price').value) || 0,
            end_promo_time: document.getElementById('prod_end_promo_time').value || null,
            image: document.getElementById('prod_image_url').value || null,
            
            // PAYLOAD KUSTOMISASI DENGAN PESAN
            is_custom: document.getElementById('prod_is_custom').checked ? 1 : 0,
            custom_options: JSON.stringify(customPayload)
          };

          const method = id ? 'PUT' : 'POST';
          const endpoint = id ? '/api/v1/protected/admin/menu-items/' + id : '/api/v1/protected/admin/menu-items';
          const res = await fetch(endpoint, {
            method: method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getAuthToken() },
            body: JSON.stringify(payload)
          });
          if(res.ok) window.location.reload();
        }

        async function deleteCategory(id) {
          if(!confirm('Hapus kategori?')) return;
          await fetch('/api/v1/protected/admin/menu-categories/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getAuthToken() } });
          window.location.reload();
        }

        async function deleteProduct(id) {
          if(!confirm('Hapus item produk ini?')) return;
          await fetch('/api/v1/protected/admin/menu-items/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getAuthToken() } });
          window.location.reload();
        }
      `}} />
    </div>
  , { title: 'Katalog Multi-Gerai POS - SPOS' })
})

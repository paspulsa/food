import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // 1. Tarik seluruh daftar gerai untuk Tenant Selector Dropdown
  const { results: outlets } = await c.env.DB.prepare(
    'SELECT id, name, address FROM restaurants ORDER BY created_at ASC'
  ).all();

  // Jalur fallback aman: jika belum ada gerai, buat otomatis gerai induk
  let activeOutletId = c.req.query('restaurant_id');
  if (!activeOutletId && outlets.length > 0) {
    activeOutletId = outlets[0].id as string;
  } else if (outlets.length === 0) {
    const defaultId = crypto.randomUUID();
    await c.env.DB.prepare(
      'INSERT INTO restaurants (id, name, address, isActive) VALUES (?, ?, ?, 1)'
    ).bind(defaultId, 'ShopeeFood Gerai Induk', 'Kantor Pusat').run();
    return c.redirect('/admin/menus?restaurant_id=' + defaultId);
  }

  // 2. Tarik Kategori Menu yang terisolasi berdasarkan Gerai yang dipilih
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
    <div class="space-y-6 animate-fade-in relative">
      
      {/* BAR ATAS: TENANT SELECTOR (MULTI-OUTLET READY) */}
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="w-full sm:w-auto">
          <label class="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Pilih Unit Gerai / Restoran</label>
          <select 
            class="w-full sm:w-72 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-sm font-bold text-gray-800 outline-none ring-2 ring-transparent focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            onchange="window.location.search = '?restaurant_id=' + this.value"
          >
            {outlets.map((outlet: any) => (
              <option value={outlet.id} selected={outlet.id === activeOutletId}>
                {outlet.name} ({outlet.address})
              </option>
            ))}
          </select>
        </div>
        
        <div class="flex gap-3 w-full sm:w-auto">
          <button onclick="openCategoryModal()" class="flex-1 sm:flex-none text-sm font-bold text-primary bg-orange-50 hover:bg-orange-100 px-5 py-3 rounded-xl border border-orange-200 transition-all">
            + Kategori Baru
          </button>
          <button onclick="openProductModalGlobal()" class="flex-1 sm:flex-none text-sm font-bold text-white bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-500 px-5 py-3 rounded-xl shadow-lg shadow-primary/20 transition-all">
            + Tambah Menu Produk
          </button>
        </div>
      </div>

      {/* RENDER KALOG MENU GAYA SHOPEEFOOD */}
      {categories.length === 0 ? (
        <div class="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h3 class="text-lg font-black text-gray-800">Katalog Gerai Ini Masih Kosong</h3>
          <p class="text-gray-400 text-sm mt-1 mb-6 max-w-sm mx-auto">Gerai yang dipilih belum memiliki klasifikasi menu. Tambahkan kategori pertama Anda sekarang.</p>
          <button onclick="openCategoryModal()" class="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md">Buat Kategori Pertama</button>
        </div>
      ) : (
        <div class="space-y-6">
          {categories.map((cat: any) => (
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* HEADER KATEGORI */}
              <div class="px-6 py-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h4 class="text-lg font-black text-gray-800 tracking-tight flex items-center gap-2">
                    <span class="w-2 h-5 bg-primary rounded-full"></span>
                    {cat.name}
                  </h4>
                  <p class="text-xs text-gray-400 font-medium mt-0.5">{cat.description || 'Tidak ada deskripsi pelengkap'}</p>
                </div>
                <button onclick={`deleteCategory('${cat.id}')`} class="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Hapus Kategori</button>
              </div>

              {/* LIST PRODUK POS CONTROL */}
              <div class="p-6">
                {!itemsByCategory[cat.id] || itemsByCategory[cat.id].length === 0 ? (
                  <p class="text-sm text-gray-400 text-center py-4 italic">Belum ada variasi produk makanan/minuman di bawah kategori ini.</p>
                ) : (
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsByCategory[cat.id].map((item: any) => (
                      <div class="p-4 rounded-xl border border-gray-100 bg-white flex gap-4 relative group hover:border-gray-200 hover:shadow-md transition-all">
                        <img 
                          src={item.image || 'https://ui-avatars.com/api/?name=ShopeeFood&background=fef2f2&color=ee4d2d'} 
                          class="w-20 h-20 object-cover rounded-xl border border-gray-50 bg-slate-50 flex-shrink-0"
                          alt={item.name}
                        />
                        <div class="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h5 class="font-bold text-gray-800 text-sm truncate pr-6">{item.name}</h5>
                            <p class="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{item.description || '-'}</p>
                          </div>
                          
                          {/* PANEL INDIKATOR CONTROL POS */}
                          <div class="mt-2 space-y-1.5">
                            <div class="flex justify-between items-center">
                              <span class="text-sm font-black text-primary">{currencyFormatter.format(item.price)}</span>
                              <span class={`text-[10px] font-black px-2 py-0.5 rounded ${item.is_available === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {item.is_available === 1 ? 'READY' : 'CLOSE'}
                              </span>
                            </div>
                            
                            {/* LIVE STOCK CONTROL ADJUSTMENT */}
                            <div class="flex items-center justify-between border-t border-gray-50 pt-1.5 mt-1">
                              <span class="text-[11px] font-bold text-gray-400">Stok POS:</span>
                              <div class="flex items-center gap-1.5">
                                <span class={`text-xs font-black font-mono px-2 py-0.5 rounded ${item.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {item.stock} unit
                                </span>
                                <button 
                                  onclick={`adjustStockPOS('${item.id}', ${item.stock})`}
                                  class="p-1 rounded bg-slate-100 hover:bg-primary hover:text-white text-slate-500 transition-colors"
                                  title="Sesuaikan Stok"
                                >
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button onclick={`deleteProduct('${item.id}')`} class="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors">
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

      {/* --- DIALOG MODAL: TAMBAH KATEGORI --- */}
      <div id="categoryModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-95 transition-transform" id="categoryModalInner">
          <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="font-black text-gray-800">Buat Kategori Unit</h3>
            <button onclick="closeCategoryModal()" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitCategory();">
            <input type="hidden" id="cat_restaurant_id" value={activeOutletId} />
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Nama Klasifikasi Kategori</label>
              <input type="text" id="cat_name" placeholder="Contoh: Makanan Utama, Rice Bowl" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:bg-white" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Keterangan Tambahan</label>
              <textarea id="cat_desc" rows={2} class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:bg-white"></textarea>
            </div>
            <button type="submit" class="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-md">Simpan Kategori</button>
          </form>
        </div>
      </div>

      {/* --- DIALOG MODAL: TAMBAH MENU / PRODUK --- */}
      <div id="productModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform" id="productModalInner">
          <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="font-black text-gray-800">Tambah Menu Kue/Makanan</h3>
            <button onclick="closeProductModal()" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <form class="p-6 space-y-4" onsubmit="event.preventDefault(); submitProduct();">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Target Penempatan Kategori</label>
              <select id="prod_menu_id" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-800" required>
                <option value="" disabled selected>-- Tentukan Kategori --</option>
                {categories.map((c: any) => <option value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Nama Item Makanan</label>
              <input type="text" id="prod_name" placeholder="Ayam Goreng Krispi Dadakan" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:bg-white" required />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Harga Jual (Rp)</label>
                <input type="number" id="prod_price" placeholder="18000" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-mono focus:bg-white" required />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Stok Awal POS</label>
                <input type="number" id="prod_stock" value="50" min="0" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-mono focus:bg-white" required />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Status Publikasi</label>
                <select id="prod_available" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700">
                  <option value="1">Langsung Aktif</option>
                  <option value="0">Arsipkan/Kosong</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Deskripsi Item Kuliner</label>
              <textarea id="prod_desc" rows={2} placeholder="Sertakan info level pedas, porsi, dsb..." class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:bg-white"></textarea>
            </div>
            
            {/* INTEGRASI PENYETORAN GAMBAR ASINKRON LANGSUNG KE CLOUDFLARE R2 CDN */}
            <div class="p-4 bg-slate-50 rounded-xl border border-gray-200">
              <label class="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">Setor Foto Produk ke CDN R2</label>
              <input 
                type="file" 
                accept="image/*" 
                class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-orange-100 file:text-primary hover:file:bg-orange-200 cursor-pointer"
                onchange="handleDirectR2Upload(this)"
              />
              <input type="hidden" id="prod_image_url" />
              <div id="upload-status" class="hidden"></div>
            </div>

            <button type="submit" class="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold py-3 rounded-xl shadow-md">Simpan Menu ke Sistem POS</button>
          </form>
        </div>
      </div>

      {/* SCRIPT KONTROL LOGIKA DAN TRANSPOR DATA ASINKRONUS */}
      <script dangerouslySetInnerHTML={{ __html: `
        function getAuthToken() {
          return document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
        }

        // --- HANDLER UPLOAD BINER LANGSUNG KE CDN R2 CLOUDFLARE ---
        async function handleDirectR2Upload(inputElement) {
          const file = inputElement.files[0];
          if(!file) return;

          const statusBox = document.getElementById('upload-status');
          statusBox.innerText = 'Menghubungkan klaster R2 & mengalirkan data biner...';
          statusBox.className = 'text-xs text-blue-600 font-bold mt-2 block animate-pulse';

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
              statusBox.className = 'text-xs text-green-600 font-bold mt-2 block';
            } else {
              statusBox.innerText = '✕ Gagal memproses penyimpanan berkas ke R2.';
              statusBox.className = 'text-xs text-red-600 font-bold mt-2 block';
            }
          } catch(err) {
            statusBox.innerText = '✕ Kesalahan fatal komunikasi interkoneksi Cloudflare R2.';
            statusBox.className = 'text-xs text-red-600 font-bold mt-2 block';
          }
        }

        // --- PENYESUAIAN STOK INSTAN (POS CONTROLLED) ---
        async function adjustStockPOS(productId, currentStock) {
          const token = getAuthToken();
          const targetStock = prompt('Masukkan kuantitas ketersediaan stok fisik terbaru di gerai:', currentStock);
          if (targetStock === null || targetStock.trim() === '' || isNaN(targetStock)) return;

          try {
            const res = await fetch('/api/v1/protected/admin/menu-items/' + productId, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ stock: parseInt(targetStock) })
            });
            if(res.ok) window.location.reload();
            else alert('Gagal memperbarui stok di klaster D1.');
          } catch(e) { alert('Kesalahan transmisi data.'); }
        }

        // --- LOGIKA MODAL INTERAKTIF ---
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
          if(!confirm('Hapus kategori? Produk di dalamnya akan terhapus.')) return;
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
  , { title: 'Katalog Produk Multi-Gerai ShopeeFood' })
})

import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // ==========================================
  // 1. CEK SESI USER & AMBIL ALAMAT DARI DATABASE
  // ==========================================
  let userAddress = '';
  let userName = '';
  let isUserLoggedIn = false;

  const token = getCookie(c, 'token');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      if (payload && payload.id) {
        const user = await c.env.DB.prepare(
          'SELECT name, address FROM users WHERE id = ?'
        ).bind(payload.id).first<any>();
        
        if (user) {
          isUserLoggedIn = true;
          userName = user.name || '';
          userAddress = user.address || '';
        }
      }
    } catch (e) {
      console.log("Token user invalid atau tidak ada");
    }
  }

  // ==========================================
  // 2. TARIK DATA DARI DATABASE (Katalog, Menu, dan Promo Banner)
  // ==========================================
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, image FROM menu_categories WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 12'
  ).all();

  // Tarik data menu dengan tambahan field `is_custom` dan `custom_options`
  const { results: promoItems } = await c.env.DB.prepare(
    'SELECT id, name, description, price, promo_price, is_promo, image, stock, is_available, is_custom, custom_options FROM menu_items WHERE is_available = 1 AND is_promo = 1 ORDER BY created_at DESC LIMIT 6'
  ).all();

  const { results: recommendedItems } = await c.env.DB.prepare(
    'SELECT id, name, description, price, promo_price, is_promo, image, stock, is_available, is_custom, custom_options FROM menu_items WHERE is_available = 1 AND is_promo = 0 ORDER BY created_at DESC LIMIT 10'
  ).all();

  const { results: appPromos } = await c.env.DB.prepare(
    'SELECT image, action_url FROM app_promos WHERE is_active = 1 ORDER BY created_at DESC'
  ).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // Serialisasi data produk untuk dipakai oleh script JS di client-side
  const allProductsData = [...promoItems, ...recommendedItems];
  const safeItemsJson = JSON.stringify(allProductsData).replace(/</g, '\\u003c');

  return c.render(
    <div class="bg-gray-100 min-h-screen font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `
      }} />

      <div class="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl pb-24 overflow-x-hidden">
        
        {/* HEADER & SEARCH BAR */}
        <div class="bg-gradient-to-b from-[#ee4d2d] to-[#ff7337] px-4 pt-6 pb-4 rounded-b-2xl shadow-sm text-white">
          <div class="flex justify-between items-center mb-4">
            <div class="max-w-[80%] cursor-pointer group" onclick="promptManualLocation()">
              <p class="text-[10px] font-medium opacity-90 uppercase tracking-wider mb-0.5">
                {isUserLoggedIn ? `Hai, ${userName.split(' ')[0]}! Diantar ke` : 'Diantar ke'}
              </p>
              <h2 id="user-location" class="text-sm font-bold flex items-center gap-1.5 line-clamp-1 group-hover:text-gray-200 transition-colors">
                <div class="w-32 h-4 bg-white/20 rounded animate-pulse"></div>
              </h2>
            </div>
            <button class="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
          </div>
          
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" class="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="Cari menu, promo, atau resto..." />
          </div>
        </div>

        {/* KONTEN UTAMA */}
        <div class="w-full">
          
          {/* BANNER PROMO */}
          {appPromos.length > 0 && (
            <div class="px-4 mt-4">
              <div class="flex overflow-x-auto snap-x snap-mandatory gap-3 hide-scrollbar pb-2">
                {appPromos.map((promo: any) => (
                  <a href={promo.action_url || '#'} class="snap-center shrink-0 w-[85%] sm:w-[280px] block">
                    <img src={promo.image} class="w-full h-32 object-cover rounded-2xl shadow-sm border border-gray-100" alt="Promo App" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* KATEGORI GRID (6 Kolom) */}
          <div class="px-4 mt-4">
            <div class="grid grid-cols-6 gap-y-4 gap-x-1 sm:gap-x-2">
              {categories.length > 0 ? categories.map((cat: any) => (
                <div class="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div class="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-1.5 group-hover:bg-orange-50 transition overflow-hidden">
                    <img src={cat.image || `https://ui-avatars.com/api/?name=${cat.name}&background=ee4d2d&color=fff`} class="w-full h-full object-contain" alt={cat.name} />
                  </div>
                  <span class="text-[9px] text-center font-bold text-gray-700 leading-tight line-clamp-2 px-0.5">{cat.name}</span>
                </div>
              )) : (
                <div class="col-span-6 text-center text-xs text-gray-400 py-2">Belum ada kategori.</div>
              )}
            </div>
          </div>

          <div class="h-2 bg-gray-100 mt-6 w-full"></div>

          {/* FLASH SALE / PROMO ITEMS */}
          {promoItems.length > 0 && (
            <div class="mt-4">
              <div class="px-4 flex justify-between items-center mb-3">
                <h3 class="text-base font-black text-gray-800 italic flex items-center gap-1">
                  <svg class="w-5 h-5 text-[#ee4d2d]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg>
                  PROMO GERCEP
                </h3>
                <a href="#" class="text-[11px] font-bold text-[#ee4d2d] hover:underline">Lihat semua</a>
              </div>

              <div class="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 hide-scrollbar pb-4 pt-1">
                {promoItems.map((item: any) => {
                  const discountPercent = Math.round(((item.price - item.promo_price) / item.price) * 100);
                  const isOutOfStock = item.stock === 0;

                  return (
                    <div class="snap-start shrink-0 w-36 bg-white rounded-xl shadow-sm border border-gray-100 relative flex flex-col overflow-hidden group">
                      <div class="absolute top-0 left-0 bg-[#ee4d2d] text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg z-10 shadow-sm">{discountPercent}% OFF</div>
                      
                      {/* Buka Popup Saat Gambar Diklik */}
                      <div class="relative h-32 w-full bg-gray-50 overflow-hidden cursor-pointer" onclick={`openProductDetail('${item.id}')`}>
                        <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} />
                        {isOutOfStock && (
                          <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full">HABIS</span>
                          </div>
                        )}
                      </div>
                      
                      <div class="p-2.5 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug cursor-pointer" onclick={`openProductDetail('${item.id}')`}>{item.name}</h4>
                          <div class="mt-1.5 flex flex-col">
                            <span class="text-[10px] text-gray-400 line-through decoration-gray-400">{formatter.format(item.price)}</span>
                            <span class="text-sm font-black text-[#ee4d2d] leading-none mt-0.5">{formatter.format(item.promo_price)}</span>
                          </div>
                        </div>
                        <div class="mt-3 flex justify-between items-center">
                          <span class="text-[9px] font-medium text-gray-500">Stok: {item.stock}</span>
                          
                          {/* Logika Tombol Custom vs Reguler */}
                          {item.is_custom === 1 ? (
                            <button onclick={!isOutOfStock ? `openProductDetail('${item.id}')` : undefined} disabled={isOutOfStock} class={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-orange-50 text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white'}`}>
                              Pilih
                            </button>
                          ) : (
                            <button onclick={!isOutOfStock ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.promo_price})` : undefined} disabled={isOutOfStock} class={`w-6 h-6 rounded-full flex items-center justify-center transition ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-orange-50 text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white'}`}>
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {promoItems.length > 0 && <div class="h-2 bg-gray-100 w-full"></div>}

          {/* REKOMENDASI ITEM TERLARIS */}
          <div class="mt-4 pb-8">
            <div class="px-4 flex justify-between items-center mb-3">
              <h3 class="text-base font-black text-gray-800">Rekomendasi Untukmu</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 px-4">
              {recommendedItems.map((item: any) => {
                const isOutOfStock = item.stock === 0;
                return (
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden group">
                    <div class="relative h-32 w-full bg-gray-50 overflow-hidden cursor-pointer" onclick={`openProductDetail('${item.id}')`}>
                      <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} />
                      {isOutOfStock && (
                        <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                          <span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full">HABIS</span>
                        </div>
                      )}
                    </div>
                    
                    <div class="p-3 flex flex-col flex-1 justify-between">
                      <div>
                        <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug mb-1 cursor-pointer" onclick={`openProductDetail('${item.id}')`}>{item.name}</h4>
                        <span class="text-sm font-black text-gray-900">{formatter.format(item.price)}</span>
                      </div>
                      <div class="mt-3 flex justify-between items-end">
                        <span class="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Stok: {item.stock}</span>
                        
                        {item.is_custom === 1 ? (
                          <button onclick={!isOutOfStock ? `openProductDetail('${item.id}')` : undefined} disabled={isOutOfStock} class={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-[#ee4d2d] text-white hover:bg-orange-700'}`}>
                            Pilih
                          </button>
                        ) : (
                          <button onclick={!isOutOfStock ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})` : undefined} disabled={isOutOfStock} class={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-[#ee4d2d] text-white hover:bg-orange-700'}`}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* =========================================================
            MODAL BOTTOM SHEET DETAIL PRODUK & OPSI CUSTOM MENU
            ========================================================= */}
        <div id="product-detail-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] hidden flex flex-col justify-end opacity-0 transition-opacity duration-300">
          <div class="bg-white w-full max-w-md mx-auto rounded-t-3xl max-h-[85vh] flex flex-col transform translate-y-full transition-transform duration-300" id="pdm-inner">
            
            <div class="relative h-56 bg-gray-100 rounded-t-3xl flex-shrink-0">
              <img id="pdm-image" src="" class="w-full h-full object-cover rounded-t-3xl" />
              <button onclick="closeProductDetail()" class="absolute top-4 right-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div class="p-5 overflow-y-auto flex-1 hide-scrollbar">
              <h2 id="pdm-name" class="text-xl font-black text-gray-800 leading-tight"></h2>
              <p id="pdm-desc" class="text-sm text-gray-500 mt-2 line-clamp-3"></p>
              <div class="mt-3 flex items-center gap-2">
                 <span id="pdm-price" class="text-lg font-black text-[#ee4d2d]"></span>
                 <span id="pdm-original-price" class="text-xs font-bold text-gray-400 line-through hidden"></span>
              </div>

              {/* Tempat Injeksi Opsi Custom HTML (Radio/Checkbox dari JSON) */}
              <div id="pdm-custom-container" class="mt-6 space-y-5 border-t border-gray-100 pt-5"></div>
            </div>

            <div class="p-4 border-t border-gray-100 bg-white flex items-center gap-4 flex-shrink-0 pb-safe">
              <div class="flex items-center bg-gray-100 rounded-xl px-1">
                <button onclick="updateQty(-1)" class="w-10 h-10 flex items-center justify-center text-gray-600 font-black text-lg">-</button>
                <span id="pdm-qty" class="w-6 text-center font-black">1</span>
                <button onclick="updateQty(1)" class="w-10 h-10 flex items-center justify-center text-[#ee4d2d] font-black text-lg">+</button>
              </div>
              <button id="pdm-add-btn" class="flex-1 bg-[#ee4d2d] text-white py-3.5 rounded-xl font-bold shadow-md shadow-orange-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2" onclick="submitProductToCart()">
                <span>Tambah</span>
                <span class="w-1 h-1 rounded-full bg-white/50"></span>
                <span id="pdm-total-btn-price"></span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR (FIXED) */}
        <div class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.08)] z-[40]">
          <div class="flex justify-around items-center h-[60px] px-2 pb-safe">
            <a href="/users" class="flex flex-col items-center gap-1 text-[#ee4d2d]">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              <span class="text-[10px] font-bold">Home</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <span class="text-[10px] font-semibold">Promo</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition relative">
              <div id="nav-cart-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white hidden">0</div>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[10px] font-semibold">Keranjang</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <span class="text-[10px] font-semibold">Order</span>
            </a>
            <a href="/login" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span class="text-[10px] font-semibold">Profile</span>
            </a>
          </div>
        </div>

        {/* MODAL INPUT LOKASI (CUSTOM UI) */}
        <div id="location-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
          <div class="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300" id="location-modal-inner">
            <h3 class="text-lg font-black text-gray-800 mb-2">Pilih Titik Pengantaran</h3>
            <p class="text-xs text-gray-500 mb-4">Masukkan alamat lengkap agar pesanan Anda dapat diantar dengan tepat waktu.</p>
            
            <textarea 
              id="manual-address-input" 
              rows={3} 
              class="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 focus:ring-2 focus:ring-[#ee4d2d] focus:border-[#ee4d2d] outline-none transition-all mb-5 resize-none" 
              placeholder="Contoh: Jl. Merdeka No. 12, RT 01/02..."
            ></textarea>
            
            <div class="flex gap-3">
              <button onclick="closeLocationModal()" class="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm">Batal</button>
              <button onclick="saveManualLocation()" class="flex-1 py-3 rounded-xl font-bold text-white bg-[#ee4d2d] hover:bg-[#d64124] transition-colors text-sm shadow-md shadow-orange-500/30">Simpan Lokasi</button>
            </div>
          </div>
        </div>
      </div>

      {/* SCRIPT INTERAKTIF */}
      <script dangerouslySetInnerHTML={{ __html: `
        const DB_ADDRESS = \`${userAddress}\`;
        const PRODUCTS = ${safeItemsJson};
        const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
        
        let cartItems = 0;
        let cartTotal = 0;
        
        let currentActiveProduct = null;
        let currentQty = 1;
        let basePrice = 0;
        let additionalPrice = 0;
        
        // --- LOGIKA LOKASI (Tetap sama) ---
        function initLocation() {
          const locElement = document.getElementById('user-location');
          const arrowIcon = '<svg class="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
          
          if (DB_ADDRESS && DB_ADDRESS.trim() !== '') {
            locElement.innerHTML = \`<span class="truncate">\${DB_ADDRESS}</span> \${arrowIcon}\`;
            return;
          }
          const savedAddress = localStorage.getItem('user_saved_address');
          if (savedAddress) {
            locElement.innerHTML = \`<span class="truncate">\${savedAddress}</span> \${arrowIcon}\`;
            return;
          }
          locElement.innerHTML = '<span class="truncate">Mendeteksi lokasi...</span> <svg class="animate-spin w-4 h-4 ml-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
          
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                try {
                  const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lon}&zoom=16\`);
                  const data = await res.json();
                  let streetName = "Lokasi Saya";
                  if (data && data.address) {
                    streetName = data.address.road || data.address.village || data.address.suburb || data.display_name.split(',')[0];
                  }
                  locElement.innerHTML = \`<span class="truncate">\${streetName}</span> \${arrowIcon}\`;
                  localStorage.setItem('user_saved_address', streetName);
                } catch(e) {
                  locElement.innerHTML = \`<span class="truncate">Gagal melacak, ketuk untuk isi</span> \${arrowIcon}\`;
                }
              }, () => {
                locElement.innerHTML = \`<span class="truncate text-yellow-100">Ketuk untuk set alamat manual</span> \${arrowIcon}\`;
              });
          } else {
            locElement.innerHTML = \`<span class="truncate">Pilih lokasi pengiriman</span> \${arrowIcon}\`;
          }
        }

        function promptManualLocation() {
          const modal = document.getElementById('location-modal');
          const inner = document.getElementById('location-modal-inner');
          const input = document.getElementById('manual-address-input');
          const currentAddress = localStorage.getItem('user_saved_address') || '';
          input.value = (DB_ADDRESS && DB_ADDRESS.trim() !== '') ? DB_ADDRESS : currentAddress;
          modal.classList.remove('hidden');
          setTimeout(() => { modal.classList.remove('opacity-0'); inner.classList.remove('scale-95'); }, 10);
        }

        function closeLocationModal() {
          const modal = document.getElementById('location-modal');
          const inner = document.getElementById('location-modal-inner');
          modal.classList.add('opacity-0');
          inner.classList.add('scale-95');
          setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function saveManualLocation() {
          const val = document.getElementById('manual-address-input').value;
          if (val && val.trim() !== '') {
            localStorage.setItem('user_saved_address', val);
            document.getElementById('user-location').innerHTML = \`<span class="truncate">\${val}</span> <svg class="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>\`;
            closeLocationModal();
          } else {
            const inner = document.getElementById('location-modal-inner');
            inner.style.transform = 'translateX(5px)';
            setTimeout(() => inner.style.transform = 'translateX(-5px)', 50);
            setTimeout(() => inner.style.transform = 'translateX(5px)', 100);
            setTimeout(() => inner.style.transform = 'scale(1)', 150);
          }
        }

        // --- LOGIKA KERANJANG STANDAR ---
        function addToCart(id, name, price) {
          cartItems += 1;
          const badge = document.getElementById('nav-cart-badge');
          badge.innerText = cartItems;
          badge.classList.remove('hidden');
          badge.style.transform = 'scale(1.4)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);

          showToast(name + ' masuk keranjang!');
        }

        function showToast(msg) {
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 text-white text-[11px] font-bold px-5 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 transition-all duration-300 opacity-0 translate-y-4';
          toast.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> ' + msg;
          document.body.appendChild(toast);
          setTimeout(() => toast.classList.remove('opacity-0', 'translate-y-4'), 10);
          setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-4'); setTimeout(() => toast.remove(), 300); }, 2000);
        }

        // --- LOGIKA MODAL DETAIL PRODUK & KUSTOMISASI JSON ---
        function openProductDetail(id) {
          const item = PRODUCTS.find(p => p.id === id);
          if(!item) return;

          currentActiveProduct = item;
          currentQty = 1;
          document.getElementById('pdm-qty').innerText = currentQty;

          document.getElementById('pdm-image').src = item.image || 'https://via.placeholder.com/400';
          document.getElementById('pdm-name').innerText = item.name;
          document.getElementById('pdm-desc').innerText = item.description || '';
          
          basePrice = item.is_promo === 1 ? item.promo_price : item.price;
          document.getElementById('pdm-price').innerText = formatter.format(basePrice);
          
          const orig = document.getElementById('pdm-original-price');
          if(item.is_promo === 1) {
             orig.innerText = formatter.format(item.price);
             orig.classList.remove('hidden');
          } else {
             orig.classList.add('hidden');
          }

          // Build UI untuk opsi kustomisasi (Parse JSON dari DB)
          const container = document.getElementById('pdm-custom-container');
          container.innerHTML = '';
          additionalPrice = 0;

          if(item.is_custom === 1 && item.custom_options) {
             try {
                const options = JSON.parse(item.custom_options);
                options.forEach((optGroup, groupIdx) => {
                   let html = \`<div class="mb-4">
                       <div class="flex justify-between items-baseline mb-3">
                         <h4 class="font-black text-gray-800 text-sm">\${optGroup.title}</h4>
                         \${optGroup.required ? '<span class="text-[9px] font-bold bg-[#ee4d2d]/10 text-[#ee4d2d] px-1.5 py-0.5 rounded">Wajib</span>' : '<span class="text-[9px] font-medium text-gray-400">Opsional</span>'}
                       </div>\`;

                   optGroup.options.forEach((opt, optIdx) => {
                     const inputType = optGroup.type === 'radio' ? 'radio' : 'checkbox';
                     const inputName = \`custom_\${groupIdx}\`;
                     const priceText = opt.price > 0 ? \`+ \${formatter.format(opt.price)}\` : 'Gratis';
                     
                     html += \`<label class="flex items-center justify-between p-3 border border-gray-100 rounded-xl mb-2 cursor-pointer hover:bg-gray-50 transition-colors">
                         <div class="flex items-center gap-3">
                           <input type="\${inputType}" name="\${inputName}" value="\${opt.price}" class="w-4 h-4 text-[#ee4d2d] focus:ring-[#ee4d2d] border-gray-300 \${inputType==='radio'?'rounded-full':'rounded'}" onchange="recalculateModalPrice()">
                           <span class="text-sm font-semibold text-gray-700">\${opt.name}</span>
                         </div>
                         <span class="text-xs font-bold text-gray-500">\${priceText}</span>
                       </label>\`;
                   });
                   html += '</div>';
                   container.innerHTML += html;
                });
             } catch(e) {
                console.error("Gagal parsing custom JSON", e);
             }
          }

          recalculateModalPrice();

          const modal = document.getElementById('product-detail-modal');
          const inner = document.getElementById('pdm-inner');
          modal.classList.remove('hidden');
          setTimeout(() => {
            modal.classList.remove('opacity-0');
            inner.classList.remove('translate-y-full');
          }, 10);
        }

        function closeProductDetail() {
          const modal = document.getElementById('product-detail-modal');
          const inner = document.getElementById('pdm-inner');
          modal.classList.add('opacity-0');
          inner.classList.add('translate-y-full');
          setTimeout(() => modal.classList.add('hidden'), 300);
        }

        function updateQty(delta) {
          if(currentQty + delta >= 1) {
            currentQty += delta;
            document.getElementById('pdm-qty').innerText = currentQty;
            recalculateModalPrice();
          }
        }

        function recalculateModalPrice() {
           additionalPrice = 0;
           const inputs = document.querySelectorAll('#pdm-custom-container input:checked');
           inputs.forEach(input => { additionalPrice += parseInt(input.value) || 0; });
           const total = (basePrice + additionalPrice) * currentQty;
           document.getElementById('pdm-total-btn-price').innerText = formatter.format(total);
        }

        function submitProductToCart() {
           const finalPrice = (basePrice + additionalPrice) * currentQty;
           addToCart(currentActiveProduct.id, currentActiveProduct.name, finalPrice);
           closeProductDetail();
        }

        document.addEventListener('DOMContentLoaded', initLocation);
      `}} />
    </div>
  , { title: 'Home - ShopeeFood Clone' })
})

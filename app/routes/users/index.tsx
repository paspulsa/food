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

  // Baca cookie 'token' (standar token user pada sistem Anda)
  const token = getCookie(c, 'token');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      if (payload && payload.id) {
        // Ambil data user dari tabel 'users' berdasarkan ID dari JWT
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
      // Jika token invalid/kedaluwarsa, biarkan sebagai guest (Guest Mode)
      console.log("Token user invalid atau tidak ada");
    }
  }

  // ==========================================
  // 2. TARIK DATA DARI DATABASE (Katalog, Menu, dan Promo Banner)
  // ==========================================
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, image FROM menu_categories WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 8'
  ).all();

  const { results: promoItems } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE is_available = 1 AND is_promo = 1 ORDER BY created_at DESC LIMIT 6'
  ).all();

  const { results: recommendedItems } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE is_available = 1 AND is_promo = 0 ORDER BY created_at DESC LIMIT 10'
  ).all();

  // Tarik data Banner Promo Dinamis dari tabel app_promos
  const { results: appPromos } = await c.env.DB.prepare(
    'SELECT image, action_url FROM app_promos WHERE is_active = 1 ORDER BY created_at DESC'
  ).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

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
            
            {/* WIDGET LOKASI DINAMIS */}
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
          
          {/* BANNER PROMO (Dinamis dari app_promos) */}
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

          {/* Kategori Grid */}
          <div class="px-4 mt-4">
            <div class="grid grid-cols-4 gap-y-4 gap-x-2">
              {categories.length > 0 ? categories.map((cat: any) => (
                <div class="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div class="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-1.5 group-hover:bg-orange-50 transition overflow-hidden">
                    <img src={cat.image || `https://ui-avatars.com/api/?name=${cat.name}&background=ee4d2d&color=fff`} class="w-full h-full object-contain" alt={cat.name} />
                  </div>
                  <span class="text-[10px] text-center font-semibold text-gray-700 leading-tight">{cat.name}</span>
                </div>
              )) : (
                <div class="col-span-4 text-center text-xs text-gray-400 py-2">Belum ada kategori.</div>
              )}
            </div>
          </div>

          <div class="h-2 bg-gray-100 mt-6 w-full"></div>

          {/* Flash Sale / Promo */}
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
                      
                      <div class="relative h-32 w-full bg-gray-50 overflow-hidden">
                        <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} />
                        {isOutOfStock && (
                          <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full">HABIS</span>
                          </div>
                        )}
                      </div>
                      
                      <div class="p-2.5 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">{item.name}</h4>
                          <div class="mt-1.5 flex flex-col">
                            <span class="text-[10px] text-gray-400 line-through decoration-gray-400">{formatter.format(item.price)}</span>
                            <span class="text-sm font-black text-[#ee4d2d] leading-none mt-0.5">{formatter.format(item.promo_price)}</span>
                          </div>
                        </div>
                        <div class="mt-3 flex justify-between items-center">
                          <span class="text-[9px] font-medium text-gray-500">Stok: {item.stock}</span>
                          <button onclick={!isOutOfStock ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.promo_price})` : undefined} disabled={isOutOfStock} class={`w-6 h-6 rounded-full flex items-center justify-center transition ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-orange-50 text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white'}`}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {promoItems.length > 0 && <div class="h-2 bg-gray-100 w-full"></div>}

          {/* Rekomendasi Terlaris */}
          <div class="mt-4 pb-8">
            <div class="px-4 flex justify-between items-center mb-3">
              <h3 class="text-base font-black text-gray-800">Rekomendasi Untukmu</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 px-4">
              {recommendedItems.map((item: any) => {
                const isOutOfStock = item.stock === 0;
                return (
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden group">
                    <div class="relative h-32 w-full bg-gray-50 overflow-hidden">
                      <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} />
                      {isOutOfStock && (
                        <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                          <span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full">HABIS</span>
                        </div>
                      )}
                    </div>
                    
                    <div class="p-3 flex flex-col flex-1 justify-between">
                      <div>
                        <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug mb-1">{item.name}</h4>
                        <span class="text-sm font-black text-gray-900">{formatter.format(item.price)}</span>
                      </div>
                      <div class="mt-3 flex justify-between items-end">
                        <span class="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Stok: {item.stock}</span>
                        <button onclick={!isOutOfStock ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})` : undefined} disabled={isOutOfStock} class={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-[#ee4d2d] text-white hover:bg-orange-700'}`}>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR (FIXED) */}
        <div class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.08)] z-40">
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

      {/* SCRIPT INTERAKTIF (LOKASI GPS, MODAL & KERANJANG) */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Data alamat dari sisi server (Database Users) yang disuntikkan ke JavaScript
        const DB_ADDRESS = \`${userAddress}\`;
        
        // --- LOGIKA LOKASI (DB -> LocalStorage -> GPS) ---
        function initLocation() {
          const locElement = document.getElementById('user-location');
          const arrowIcon = '<svg class="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>';
          
          // 1. Cek Database: Jika user login dan punya alamat di profilnya
          if (DB_ADDRESS && DB_ADDRESS.trim() !== '') {
            locElement.innerHTML = \`<span class="truncate">\${DB_ADDRESS}</span> \${arrowIcon}\`;
            return;
          }

          // 2. Cek Cache LocalStorage (Bagi Guest atau yang belum isi alamat di DB)
          const savedAddress = localStorage.getItem('user_saved_address');
          if (savedAddress) {
            locElement.innerHTML = \`<span class="truncate">\${savedAddress}</span> \${arrowIcon}\`;
            return;
          }

          locElement.innerHTML = '<span class="truncate">Mendeteksi lokasi...</span> <svg class="animate-spin w-4 h-4 ml-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

          // 3. Minta akses GPS jika semuanya kosong
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
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
              }, 
              (error) => {
                locElement.innerHTML = \`<span class="truncate text-yellow-100">Ketuk untuk set alamat manual</span> \${arrowIcon}\`;
              }
            );
          } else {
            locElement.innerHTML = \`<span class="truncate">Pilih lokasi pengiriman</span> \${arrowIcon}\`;
          }
        }

        // --- KONTROL MODAL ALAMAT ---
        function promptManualLocation() {
          const modal = document.getElementById('location-modal');
          const inner = document.getElementById('location-modal-inner');
          const input = document.getElementById('manual-address-input');
          
          // Isi default value dari DB atau LocalStorage saat modal dibuka
          const currentAddress = localStorage.getItem('user_saved_address') || '';
          if (DB_ADDRESS && DB_ADDRESS.trim() !== '') {
            input.value = DB_ADDRESS;
          } else {
            input.value = currentAddress;
          }

          modal.classList.remove('hidden');
          setTimeout(() => {
            modal.classList.remove('opacity-0');
            inner.classList.remove('scale-95');
          }, 10);
        }

        function closeLocationModal() {
          const modal = document.getElementById('location-modal');
          const inner = document.getElementById('location-modal-inner');
          
          modal.classList.add('opacity-0');
          inner.classList.add('scale-95');
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 300);
        }

        function saveManualLocation() {
          const val = document.getElementById('manual-address-input').value;
          if (val && val.trim() !== '') {
            // Simpan ke sesi lokal
            localStorage.setItem('user_saved_address', val);
            
            // Perbarui UI
            document.getElementById('user-location').innerHTML = \`<span class="truncate">\${val}</span> <svg class="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>\`;
            
            closeLocationModal();
          } else {
            // Fallback animasi getar sederhana jika input kosong
            const inner = document.getElementById('location-modal-inner');
            inner.style.transform = 'translateX(5px)';
            setTimeout(() => inner.style.transform = 'translateX(-5px)', 50);
            setTimeout(() => inner.style.transform = 'translateX(5px)', 100);
            setTimeout(() => inner.style.transform = 'scale(1)', 150);
          }
        }

        // --- KERANJANG BELANJA ---
        let cartItems = 0;
        function addToCart(id, name, price) {
          cartItems += 1;
          const badge = document.getElementById('nav-cart-badge');
          badge.innerText = cartItems;
          badge.classList.remove('hidden');
          
          // Efek pop pada badge cart
          badge.style.transform = 'scale(1.4)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);

          // Toast Notifikasi
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 text-white text-[11px] font-bold px-5 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 transition-all duration-300 opacity-0 translate-y-4';
          toast.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> ' + name + ' masuk keranjang!';
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-y-4');
            toast.classList.add('opacity-100', 'translate-y-0');
          }, 10);
          
          setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => toast.remove(), 300);
          }, 2000);
        }

        document.addEventListener('DOMContentLoaded', initLocation);
      `}} />
    </div>
  , { title: 'Home - ShopeeFood Clone' })
})

import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  // 1. CEK SESI USER & LOKASI
  let userAddress = '';
  let userName = '';
  let isUserLoggedIn = false;
  const token = getCookie(c, 'token');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      if (payload && payload.id) {
        const user = await c.env.DB.prepare('SELECT name, address FROM users WHERE id = ?').bind(payload.id).first<any>();
        if (user) {
          isUserLoggedIn = true;
          userName = user.name || '';
          userAddress = user.address || '';
        }
      }
    } catch (e) { console.log("Token invalid"); }
  }

  // 2. TARIK DATA PROMO (BANNER & MODAL)
  const { results: banners } = await c.env.DB.prepare(
    "SELECT * FROM app_promos WHERE type = 'BANNER' AND is_active = 1 ORDER BY created_at DESC"
  ).all();
  
  const modalPromo = await c.env.DB.prepare(
    "SELECT * FROM app_promos WHERE type = 'MODAL' AND is_active = 1 ORDER BY created_at DESC"
  ).first<any>();

  // 3. TARIK DATA KATALOG & SISTEM CERDAS TERLARIS
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, image FROM menu_categories WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 8'
  ).all();

  const { results: promoItems } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE is_available = 1 AND is_promo = 1 ORDER BY created_at DESC LIMIT 6'
  ).all();

  const { results: bestSellers } = await c.env.DB.prepare(
    'SELECT * FROM menu_items WHERE is_available = 1 ORDER BY sold_count DESC, created_at DESC LIMIT 10'
  ).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="bg-gray-100 min-h-screen font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        `
      }} />

      <div class="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl pb-24 overflow-x-hidden">
        
        {/* HEADER & LOKASI PENGIRIMAN */}
        <div class="bg-gradient-to-b from-[#ee4d2d] to-[#ff7337] px-4 pt-6 pb-4 rounded-b-3xl shadow-sm text-white relative z-10">
          <div class="flex justify-between items-center mb-5">
            {/* TRIGGER MODAL LOKASI DI SINI */}
            <div class="max-w-[80%] cursor-pointer group" onclick="openLocationModal()">
              <p class="text-[10px] font-medium opacity-90 uppercase tracking-wider mb-0.5">
                {isUserLoggedIn ? `Hai, ${userName.split(' ')[0]}! Diantar ke` : 'Diantar ke'}
              </p>
              <h2 id="user-location" class="text-sm font-bold flex items-center gap-1.5 line-clamp-1 group-hover:text-gray-200 transition-colors">
                <div class="w-32 h-4 bg-white/20 rounded animate-pulse"></div>
              </h2>
            </div>
            
            <button class="bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-sm transition flex-shrink-0 relative">
              <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#ff7337] rounded-full"></span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
          </div>
          
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-[#ee4d2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" class="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-sm text-gray-800 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30 font-medium placeholder-gray-400" placeholder="Mau makan apa hari ini?" />
          </div>
        </div>

        {/* KONTEN UTAMA */}
        <div class="w-full -mt-2">
          
          {/* BANNER PROMO */}
          {banners.length > 0 && (
            <div class="px-4 mt-6">
              <div class="flex overflow-x-auto snap-x snap-mandatory gap-3 hide-scrollbar pb-2">
                {banners.map((banner: any) => (
                  <a href={banner.action_url || '#'} class="snap-center shrink-0 w-[88%] sm:w-[280px] block transform hover:scale-[1.02] transition-transform">
                    <img src={banner.image} class="w-full h-36 object-cover rounded-2xl shadow-sm border border-gray-100 bg-gray-200" alt="Promo" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* KATEGORI */}
          <div class="px-4 mt-5">
            <div class="grid grid-cols-4 gap-y-5 gap-x-2">
              {categories.length > 0 ? categories.map((cat: any) => (
                <div class="flex flex-col items-center gap-2 cursor-pointer group">
                  <div class="w-[52px] h-[52px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-2 group-hover:bg-orange-50 transition overflow-hidden">
                    <img src={cat.image || `https://ui-avatars.com/api/?name=${cat.name}&background=ee4d2d&color=fff`} class="w-full h-full object-contain" alt={cat.name} />
                  </div>
                  <span class="text-[10px] text-center font-bold text-gray-700 leading-tight">{cat.name}</span>
                </div>
              )) : (
                <div class="col-span-4 text-center text-xs text-gray-400 py-2">Kategori kosong.</div>
              )}
            </div>
          </div>

          <div class="h-2 bg-gray-100 mt-6 w-full"></div>

          {/* BEST SELLERS */}
          {bestSellers.length > 0 && (
            <div class="mt-4 pb-2">
              <div class="px-4 flex justify-between items-center mb-3">
                <h3 class="text-base font-black text-gray-800 flex items-center gap-1.5">
                  <span class="text-xl">🔥</span> Paling Laku di Sekitarmu
                </h3>
              </div>
              <div class="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 hide-scrollbar pb-4 pt-1">
                {bestSellers.map((item: any, index: number) => {
                  const isOutOfStock = item.stock === 0;
                  const currentPrice = item.is_promo ? item.promo_price : item.price;
                  return (
                    <div class="snap-start shrink-0 w-40 bg-white rounded-2xl shadow-sm border border-orange-100 relative flex flex-col overflow-hidden group">
                      <div class="absolute top-0 left-0 bg-gradient-to-r from-orange-500 to-[#ee4d2d] text-white text-[10px] font-black px-2.5 py-1 rounded-br-xl z-10 shadow-sm">TOP {index + 1}</div>
                      <div class="relative h-32 w-full bg-gray-50 overflow-hidden">
                        <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-110'}`} />
                        {isOutOfStock && <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"><span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">HABIS</span></div>}
                      </div>
                      <div class="p-3 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug mb-1">{item.name}</h4>
                          <span class="text-sm font-black text-[#ee4d2d]">{formatter.format(currentPrice)}</span>
                        </div>
                        <div class="mt-3 flex justify-between items-center">
                          <span class="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.sold_count} terjual</span>
                          <button onclick={!isOutOfStock ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${currentPrice})` : undefined} disabled={isOutOfStock} class={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 ${isOutOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-[#ee4d2d] text-white'}`}>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div class="h-2 bg-gray-100 w-full"></div>

          {/* EXPLORE MENU */}
          <div class="mt-4 pb-8">
            <div class="px-4 flex justify-between items-center mb-3">
              <h3 class="text-base font-black text-gray-800">Eksplor Menu Lainnya</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 px-4">
              {promoItems.map((item: any) => {
                const isOutOfStock = item.stock === 0;
                return (
                  <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden group">
                    <div class="relative h-32 w-full bg-gray-50 overflow-hidden">
                      <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} />
                      {isOutOfStock && <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center"><span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">HABIS</span></div>}
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

        {/* BOTTOM NAVIGATION BAR */}
        <div class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-40">
          <div class="flex justify-around items-center h-[65px] px-2 pb-safe">
            <a href="/users" class="flex flex-col items-center gap-1 text-[#ee4d2d]">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              <span class="text-[10px] font-bold">Home</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <span class="text-[10px] font-semibold">Promo</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition relative">
              <div id="nav-cart-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white hidden">0</div>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[10px] font-semibold">Keranjang</span>
            </a>
            <a href="/login" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span class="text-[10px] font-semibold">Profile</span>
            </a>
          </div>
        </div>
      </div>

      {/* --- MODAL BOTTOM SHEET LOKASI --- */}
      <div id="location-modal" class="fixed inset-0 z-[100] hidden items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
        <div id="location-modal-inner" class="w-full max-w-md bg-white rounded-t-3xl shadow-2xl transform translate-y-full transition-transform duration-300 p-6 pb-safe">
          {/* Header */}
          <div class="flex justify-between items-center mb-6">
             <h3 class="font-black text-gray-800 text-lg">Alamat Pengiriman</h3>
             <button onclick="closeLocationModal()" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
          
          {/* Body */}
          <div class="space-y-5">
             <button id="btn-gps" onclick="detectGPSLocation()" class="w-full flex justify-center items-center gap-2.5 p-3.5 bg-orange-50 text-[#ee4d2d] rounded-2xl font-bold text-sm border border-orange-100 hover:bg-orange-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Gunakan Lokasi Saat Ini (GPS)
             </button>
             
             <div class="relative">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
                <div class="relative flex justify-center"><span class="bg-white px-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Atau Ketik Manual</span></div>
             </div>
             
             <div>
                <textarea id="manual-address-input" rows={3} class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ee4d2d]/20 focus:border-[#ee4d2d] transition-all font-medium placeholder-gray-400 resize-none" placeholder="Cth: Jl. Sudirman No. 12, RT 01/RW 02, Jakarta Barat..."></textarea>
             </div>
             
             <button onclick="saveManualLocation()" class="w-full bg-[#ee4d2d] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#ee4d2d]/30 hover:bg-orange-700 active:scale-[0.98] transition-all">
                Simpan Alamat
             </button>
          </div>
        </div>
      </div>

      {/* --- MODAL BANNER POPUP DINAMIS --- */}
      {modalPromo && (
        <div id="promo-modal" class="fixed inset-0 z-[100] hidden items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0">
          <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transform scale-95 transition-transform duration-300" id="promo-modal-inner">
            <button onclick="closePromoModal()" class="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/50 transition z-10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <a href={modalPromo.action_url || '#'}>
              <img src={modalPromo.image} class="w-full object-cover" alt="Spesial Promo" />
            </a>
          </div>
        </div>
      )}

      {/* SCRIPT INTERAKTIF */}
      <script dangerouslySetInnerHTML={{ __html: `
        const DB_ADDRESS = \`${userAddress}\`;
        
        function showToast(message, isError = false) {
          const toast = document.createElement('div');
          toast.className = \`fixed top-6 left-1/2 transform -translate-x-1/2 backdrop-blur-md text-white px-5 py-3 rounded-full text-[11px] font-bold z-[150] shadow-2xl flex items-center gap-2 transition-all duration-300 opacity-0 -translate-y-4 border \${isError ? 'bg-red-600/95 border-red-500' : 'bg-gray-900/95 border-gray-700'}\`;
          toast.innerHTML = isError 
            ? '<svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ' + message
            : '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> ' + message;
          document.body.appendChild(toast);
          setTimeout(() => { toast.classList.remove('opacity-0', '-translate-y-4'); toast.classList.add('opacity-100', 'translate-y-0'); }, 10);
          setTimeout(() => { toast.classList.remove('opacity-100', 'translate-y-0'); toast.classList.add('opacity-0', '-translate-y-4'); setTimeout(() => toast.remove(), 300); }, 3000);
        }

        // --- LOGIKA MODAL LOKASI (BOTTOM SHEET) ---
        function openLocationModal() {
          const modal = document.getElementById('location-modal');
          const inner = document.getElementById('location-modal-inner');
          
          // Isi otomatis textarea jika sudah ada alamat
          const currentLoc = document.getElementById('user-location').innerText.trim();
          if(currentLoc !== 'Mendeteksi...' && currentLoc !== 'Ketuk untuk set lokasi' && currentLoc !== 'Pilih lokasi pengiriman') {
             document.getElementById('manual-address-input').value = localStorage.getItem('user_saved_address') || currentLoc;
          }

          modal.classList.remove('hidden');
          modal.classList.add('flex');
          setTimeout(() => {
            modal.classList.remove('opacity-0');
            inner.classList.remove('translate-y-full');
          }, 10);
        }

        function closeLocationModal() {
          const modal = document.getElementById('location-modal');
          const inner = document.getElementById('location-modal-inner');
          modal.classList.add('opacity-0');
          inner.classList.add('translate-y-full');
          setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
          }, 300);
        }

        function updateLocationUI(text) {
          const locElement = document.getElementById('user-location');
          const arrowIcon = '<svg class="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>';
          locElement.innerHTML = \`<span class="truncate">\${text}</span> \${arrowIcon}\`;
        }

        function saveManualLocation() {
          const newAddress = document.getElementById('manual-address-input').value;
          if (newAddress && newAddress.trim() !== "") {
            localStorage.setItem('user_saved_address', newAddress.trim());
            updateLocationUI(newAddress.trim());
            closeLocationModal();
            showToast('Alamat pengiriman berhasil diperbarui!');
          } else {
            showToast('Harap isi alamat dengan lengkap.', true);
          }
        }

        function detectGPSLocation() {
          const btn = document.getElementById('btn-gps');
          const originalHtml = btn.innerHTML;
          btn.innerHTML = '<svg class="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Melacak posisi...';
          
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                try {
                  const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${position.coords.latitude}&lon=\${position.coords.longitude}&zoom=16\`);
                  const data = await res.json();
                  let streetName = data.address.road || data.address.suburb || data.display_name.split(',')[0];
                  localStorage.setItem('user_saved_address', streetName);
                  updateLocationUI(streetName);
                  closeLocationModal();
                  showToast('Lokasi akurat ditemukan!');
                } catch(e) {
                  showToast('Gagal memuat alamat dari GPS.', true);
                } finally { btn.innerHTML = originalHtml; }
              }, 
              (error) => { 
                showToast('Akses GPS ditolak / Gagal melacak.', true);
                btn.innerHTML = originalHtml; 
              }
            );
          } else {
            showToast('Perangkat tidak mendukung GPS', true);
            btn.innerHTML = originalHtml;
          }
        }

        // --- INISIALISASI AWAL ---
        function initLocation() {
          if (DB_ADDRESS && DB_ADDRESS.trim() !== '') {
            updateLocationUI(DB_ADDRESS);
            return;
          }
          const savedAddress = localStorage.getItem('user_saved_address');
          if (savedAddress) {
            updateLocationUI(savedAddress);
            return;
          }
          document.getElementById('user-location').innerHTML = '<span class="truncate">Pilih lokasi pengiriman</span> <svg class="w-4 h-4 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>';
        }

        // --- MODAL POPUP PROMO AWAL ---
        function initPromoModal() {
          const modal = document.getElementById('promo-modal');
          if (!modal) return;
          if (!sessionStorage.getItem('promo_seen')) {
            setTimeout(() => {
              modal.classList.remove('hidden');
              modal.classList.add('flex');
              setTimeout(() => {
                modal.classList.remove('opacity-0');
                document.getElementById('promo-modal-inner').classList.remove('scale-95');
              }, 10);
            }, 1000);
          }
        }

        function closePromoModal() {
          const modal = document.getElementById('promo-modal');
          sessionStorage.setItem('promo_seen', 'true');
          modal.classList.add('opacity-0');
          document.getElementById('promo-modal-inner').classList.add('scale-95');
          setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
        }

        // --- KERANJANG ---
        let cartItems = 0;
        function addToCart(id, name, price) {
          cartItems += 1;
          const badge = document.getElementById('nav-cart-badge');
          badge.innerText = cartItems;
          badge.classList.remove('hidden');
          badge.style.transform = 'scale(1.4)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
          showToast(name + ' masuk keranjang!');
        }

        document.addEventListener('DOMContentLoaded', () => {
          initLocation();
          initPromoModal();
        });
      `}} />
    </div>
  , { title: 'Home - App Kuliner' })
})

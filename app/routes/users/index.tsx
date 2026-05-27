import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // 1. Tarik Data Kategori Aktif
  const { results: categories } = await c.env.DB.prepare(
    'SELECT id, name, image FROM menu_categories WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 8'
  ).all();

  // 2. Tarik Data Produk Promo (Flash Sale / Deals)
  const { results: promoItems } = await c.env.DB.prepare(
    'SELECT id, name, price, promo_price, end_promo_time, image FROM menu_items WHERE is_available = 1 AND is_promo = 1 ORDER BY created_at DESC LIMIT 6'
  ).all();

  // 3. Tarik Data Produk Rekomendasi (Non-Promo / Terlaris)
  const { results: recommendedItems } = await c.env.DB.prepare(
    'SELECT id, name, price, image FROM menu_items WHERE is_available = 1 AND is_promo = 0 ORDER BY created_at DESC LIMIT 10'
  ).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="bg-gray-100 min-h-screen font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Menyembunyikan scrollbar bawaan browser untuk slider horizontal */
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Variabel Warna Default (Bisa disesuaikan dengan tema utama) */
          :root {
            --app-primary: #ee4d2d; /* Orange Shopee style */
            --app-secondary: #ff7337;
          }
        `
      }} />

      {/* CONTAINER UTAMA (Simulasi Mobile View di Desktop) */}
      <div class="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden pb-20">
        
        {/* HEADER & SEARCH BAR (Gradient Style) */}
        <div class="bg-gradient-to-b from-[#ee4d2d] to-[#ff7337] px-4 pt-6 pb-4 rounded-b-2xl shadow-sm text-white">
          <div class="flex justify-between items-center mb-4">
            <div>
              <p class="text-[10px] font-medium opacity-90 uppercase tracking-wider">Diantar ke</p>
              <h2 class="text-sm font-bold flex items-center gap-1">
                Jl. Bulak Teko no 121, Kalideres...
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </h2>
            </div>
            <button class="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition">
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

        {/* KONTEN UTAMA SCROLLABLE */}
        <div class="overflow-y-auto h-full hide-scrollbar">
          
          {/* BANNER PROMO SLIDER */}
          <div class="px-4 mt-4">
            <div class="flex overflow-x-auto snap-x snap-mandatory gap-3 hide-scrollbar pb-2">
              {[
                { img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', title: 'Diskon 50%' },
                { img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80', title: 'Gratis Ongkir' },
                { img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', title: 'Menu Baru' }
              ].map((banner) => (
                <div class="snap-center shrink-0 w-[85%] sm:w-[280px]">
                  <img src={banner.img} class="w-full h-32 object-cover rounded-2xl shadow-sm border border-gray-100" alt={banner.title} />
                </div>
              ))}
            </div>
          </div>

          {/* ICON MENU / KATEGORI GRID */}
          <div class="px-4 mt-4">
            <div class="grid grid-cols-4 gap-y-4 gap-x-2">
              {categories.length > 0 ? categories.map((cat: any) => (
                <div class="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div class="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-2 group-hover:bg-orange-50 transition">
                    <img src={cat.image || `https://ui-avatars.com/api/?name=${cat.name}&background=ee4d2d&color=fff`} class="w-full h-full object-contain" alt={cat.name} />
                  </div>
                  <span class="text-[10px] text-center font-semibold text-gray-700 leading-tight">{cat.name}</span>
                </div>
              )) : (
                <div class="col-span-4 text-center text-xs text-gray-400 py-2">Belum ada kategori aktif.</div>
              )}
            </div>
          </div>

          {/* SEPARATOR */}
          <div class="h-2 bg-gray-100 mt-6 w-full"></div>

          {/* FLASH SALE / PROMO GERCEP SECTION */}
          {promoItems.length > 0 && (
            <div class="mt-4">
              <div class="px-4 flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-black text-gray-800 italic flex items-center gap-1">
                    <svg class="w-5 h-5 text-[#ee4d2d]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg>
                    PROMO GERCEP
                  </h3>
                  <div class="flex items-center gap-1 text-xs font-bold text-white">
                    <span class="bg-[#ee4d2d] px-1.5 py-0.5 rounded">02</span><span class="text-[#ee4d2d]">:</span>
                    <span class="bg-[#ee4d2d] px-1.5 py-0.5 rounded">14</span><span class="text-[#ee4d2d]">:</span>
                    <span class="bg-[#ee4d2d] px-1.5 py-0.5 rounded">04</span>
                  </div>
                </div>
                <a href="#" class="text-[11px] font-bold text-[#ee4d2d] hover:underline">Lihat semua</a>
              </div>

              {/* HORIZONTAL SCROLL PRODUCT CARDS */}
              <div class="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 hide-scrollbar pb-4 pt-1">
                {promoItems.map((item: any) => {
                  const discountPercent = Math.round(((item.price - item.promo_price) / item.price) * 100);
                  return (
                    <div class="snap-start shrink-0 w-36 bg-white rounded-xl shadow-sm border border-gray-100 relative flex flex-col overflow-hidden">
                      {/* Badge Diskon */}
                      <div class="absolute top-0 left-0 bg-[#ee4d2d] text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg z-10">
                        {discountPercent}% OFF
                      </div>
                      <img src={item.image || 'https://via.placeholder.com/150'} class="w-full h-32 object-cover bg-gray-50" alt={item.name} />
                      
                      <div class="p-2.5 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">{item.name}</h4>
                          <div class="mt-1.5 flex flex-col">
                            <span class="text-[10px] text-gray-400 line-through decoration-gray-400">{formatter.format(item.price)}</span>
                            <span class="text-sm font-black text-[#ee4d2d] leading-none mt-0.5">{formatter.format(item.promo_price)}</span>
                          </div>
                        </div>
                        
                        <div class="mt-3 flex justify-between items-center">
                          <span class="text-[9px] font-medium text-gray-500 flex items-center gap-0.5">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            30 Menit
                          </span>
                          <button onclick={`addToCart('${item.id}')`} class="w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SEPARATOR */}
          <div class="h-2 bg-gray-100 w-full"></div>

          {/* REKOMENDASI TERLARIS SECTION */}
          <div class="mt-4 pb-8">
            <div class="px-4 flex justify-between items-center mb-3">
              <h3 class="text-base font-black text-gray-800">Rekomendasi Untukmu</h3>
            </div>
            
            <div class="grid grid-cols-2 gap-3 px-4">
              {recommendedItems.map((item: any) => (
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                  <img src={item.image || 'https://via.placeholder.com/150'} class="w-full h-32 object-cover bg-gray-50" alt={item.name} />
                  
                  <div class="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-gray-800 line-clamp-2 leading-snug mb-1">{item.name}</h4>
                      <span class="text-sm font-black text-gray-900">{formatter.format(item.price)}</span>
                    </div>
                    
                    <div class="mt-3 flex justify-between items-end">
                      <span class="text-[9px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Terlaris</span>
                      <button onclick={`addToCart('${item.id}')`} class="w-7 h-7 bg-[#ee4d2d] text-white rounded-full flex items-center justify-center hover:bg-orange-700 shadow-md transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR (FIXED) */}
        <div class="absolute bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
          <div class="flex justify-around items-center h-16">
            <a href="#" class="flex flex-col items-center gap-1 text-[#ee4d2d]">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              <span class="text-[10px] font-bold">Home</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <span class="text-[10px] font-semibold">Promo</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition relative">
              <div class="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">2</div>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[10px] font-semibold">Keranjang</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <span class="text-[10px] font-semibold">Order</span>
            </a>
            <a href="#" class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span class="text-[10px] font-semibold">Profile</span>
            </a>
          </div>
        </div>

      </div>

      {/* SCRIPT INTERAKTIF */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Fungsi simulasi tambah keranjang
        function addToCart(id) {
          // Animasi atau toast alert singkat
          const toast = document.createElement('div');
          toast.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in transition-opacity';
          toast.innerText = 'Item berhasil ditambahkan ke keranjang!';
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
          }, 2000);
        }
      `}} />
    </div>
  , { title: 'Home - KPKembar' })
})

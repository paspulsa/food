import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const restoId = c.req.param('id');

  // 1. Ambil Data Gerai
  const resto = await c.env.DB.prepare('SELECT * FROM restaurants WHERE id = ?').bind(restoId).first<any>();
  if (!resto) return c.notFound();

  // 2. Ambil Kategori Menu Gerai (Menggunakan tabel menu_categories sesuai skema baru)
  const { results: categories } = await c.env.DB.prepare(
    'SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order ASC'
  ).bind(restoId).all();

  // 3. Ambil Item Produk Kuliner Gerai (Tersedia saja)
  const { results: items } = await c.env.DB.prepare(`
    SELECT i.* FROM menu_items i
    JOIN menu_categories c ON i.category_id = c.id
    WHERE c.restaurant_id = ? AND i.is_available = 1
  `).bind(restoId).all();

  // 4. Kelompokkan Data: Pisahkan Promo dan Filter Kategori
  const promoItems = items.filter((item: any) => item.is_promo === 1);
  const itemsByCategory = items.reduce((acc: any, item: any) => {
    if (!acc[item.category_id]) acc[item.category_id] = [];
    acc[item.category_id].push(item);
    return acc;
  }, {});

  const themeColor = resto.theme_color || '#E61010';
  const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  return c.render(
    <div class="bg-gray-100 min-h-screen font-sans">
      {/* Injeksi Tema Warna via Inline CSS Style Block */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --theme-color: ${themeColor}; }
        .bg-theme { background-color: var(--theme-color); }
        .text-theme { color: var(--theme-color); }
        .border-theme { border-color: var(--theme-color); }
        
        /* Utility untuk menyembunyikan scrollbar pada menu sticky horizontal */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Container Layar Mobile */}
      <div class="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative pb-28 overflow-x-hidden">
        
        {/* HEADER GERAI */}
        <div class="relative h-56 bg-gray-200">
          <img 
            src={resto.image || `https://ui-avatars.com/api/?name=${resto.name}&background=${themeColor.replace('#','')}&color=fff&size=400`} 
            class="w-full h-full object-cover" 
            alt="Cover" 
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          {/* Tombol Back */}
          <a href="/users" class="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </a>

          {/* Info Gerai */}
          <div class="absolute bottom-5 left-5 right-5">
            <h1 class="text-white text-3xl font-black shadow-sm drop-shadow-md tracking-tight leading-tight">{resto.name}</h1>
            <p class="text-white/80 text-xs mt-2 drop-shadow flex items-center gap-1.5 line-clamp-1 font-medium">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              {resto.address}
            </p>
          </div>
        </div>

        {/* MENU STICKY (KATEGORI) */}
        <div id="sticky-nav" class="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm overflow-x-auto hide-scrollbar whitespace-nowrap py-3 px-4 flex gap-2 border-b border-gray-100">
          {promoItems.length > 0 && (
            <a href="#section-promo" class="nav-pill px-4 py-1.5 rounded-full text-sm font-bold bg-theme text-white shadow-sm border border-transparent transition-all flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Promo Spesial
            </a>
          )}
          {categories.map((cat: any, index: number) => (
            <a href={`#section-${cat.id}`} class={`nav-pill px-4 py-1.5 rounded-full text-sm font-bold transition-all ${promoItems.length === 0 && index === 0 ? 'bg-theme text-white shadow-sm' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
              {cat.name}
            </a>
          ))}
        </div>

        {/* KONTEN KATALOG */}
        <div class="p-4 bg-gray-50/50 min-h-screen">
          
          {/* WIDGET: PROMO SPESIAL */}
          {promoItems.length > 0 && (
            <div id="section-promo" class="category-section pt-4 mb-10">
              <h2 class="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-theme" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Promo Spesial
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {promoItems.map((item: any) => (
                  <div class="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden flex group cursor-pointer hover:shadow-md transition-all relative p-3 gap-4">
                    {/* Badge Diskon */}
                    <div class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                      PROMO
                    </div>
                    
                    <div class="w-24 h-24 bg-gray-100 relative rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image || 'https://via.placeholder.com/200'} class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    
                    <div class="flex flex-col flex-1 justify-center">
                      <h3 class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{item.name}</h3>
                      <p class="text-[11px] text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                      
                      <div class="mt-2 flex flex-col">
                        <span class="text-[10px] font-bold text-gray-400 line-through">{currencyFormatter.format(item.price)}</span>
                        <div class="flex items-center justify-between">
                          <span class="text-base font-black text-theme leading-none">{currencyFormatter.format(item.promo_price)}</span>
                          <button class="w-7 h-7 rounded-full bg-theme text-white hover:scale-110 transition-transform flex items-center justify-center shadow-sm" onclick={`addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.promo_price})`}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAFTAR MENU BERDASARKAN KATEGORI */}
          {categories.length === 0 ? (
            <p class="text-center text-gray-400 py-10 font-bold">Katalog menu sedang disiapkan.</p>
          ) : categories.map((cat: any) => (
            <div id={`section-${cat.id}`} class="category-section pt-4 mb-8">
              <h2 class="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <span class="w-1.5 h-6 bg-theme rounded-full shadow-sm"></span>
                {cat.name}
              </h2>
              
              <div class="grid grid-cols-2 gap-3">
                {(!itemsByCategory[cat.id] || itemsByCategory[cat.id].length === 0) ? (
                  <p class="text-xs text-gray-400 col-span-2 italic px-2">Belum ada item untuk kategori ini.</p>
                ) : itemsByCategory[cat.id].map((item: any) => {
                  const currentPrice = item.is_promo === 1 ? item.promo_price : item.price;
                  
                  return (
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:border-theme hover:shadow-md transition-all relative">
                      <div class="h-32 bg-gray-100 relative">
                        <img src={item.image || 'https://via.placeholder.com/200'} class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {item.stock > 0 && item.stock <= 5 && (
                          <span class="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[9px] font-black px-2 py-0.5 rounded shadow-sm">Stok: {item.stock}</span>
                        )}
                        {item.stock === 0 && (
                          <div class="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span class="bg-gray-800 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm">HABIS</span>
                          </div>
                        )}
                      </div>
                      
                      <div class="p-3 flex flex-col flex-1">
                        <h3 class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight flex-1">{item.name}</h3>
                        <div class="mt-2 flex items-center justify-between">
                          <span class="text-sm font-black text-gray-900">{currencyFormatter.format(currentPrice)}</span>
                          <button 
                            disabled={item.stock === 0}
                            class={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${item.stock === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-theme/10 text-theme hover:bg-theme hover:text-white'}`}
                            onclick={item.stock > 0 ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${currentPrice})` : undefined}
                          >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* WIDGET: FLOATING CART BUTTON (BOTTOM) */}
        <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-[420px] px-6 z-50 pointer-events-none hidden" id="floating-cart-container">
          <button class="w-full bg-theme text-white rounded-2xl py-3.5 px-5 shadow-2xl shadow-black/20 flex items-center justify-between pointer-events-auto transform hover:scale-[1.02] transition-all active:scale-95">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
                <span id="cart-badge" class="absolute -top-1.5 -right-1.5 bg-red-500 border-2 border-white text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">0</span>
              </div>
              <div class="text-left">
                <p class="text-[11px] font-bold text-white/80 uppercase tracking-wider">Total Belanja</p>
                <p class="text-base font-black leading-none mt-0.5" id="cart-total">Rp 0</p>
              </div>
            </div>
            <span class="font-bold text-sm bg-white text-theme px-4 py-2 rounded-xl shadow-sm">Checkout</span>
          </button>
        </div>
      </div>

      {/* SCRIPT INTERAKTIF (CLIENT-SIDE) */}
      <script dangerouslySetInnerHTML={{ __html: `
        let cartTotal = 0;
        let cartItems = 0;
        
        // Logika Keranjang Belanja
        function addToCart(id, name, price) {
          cartTotal += price;
          cartItems += 1;
          
          // Update UI Keranjang
          document.getElementById('cart-total').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cartTotal);
          document.getElementById('cart-badge').innerText = cartItems;
          
          // Tampilkan keranjang jika belum terlihat
          const cartContainer = document.getElementById('floating-cart-container');
          if(cartContainer.classList.contains('hidden')) {
            cartContainer.classList.remove('hidden');
            cartContainer.classList.add('animate-fade-in');
          }
          
          // Notifikasi Snackbar Cantik
          const notif = document.createElement('div');
          notif.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-5 py-3 rounded-full text-xs font-bold z-[100] shadow-xl flex items-center gap-2 transition-all duration-300 opacity-0 -translate-y-4';
          notif.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> ' + name + ' ditambahkan!';
          document.body.appendChild(notif);
          
          // Animasi masuk
          setTimeout(() => {
            notif.classList.remove('opacity-0', '-translate-y-4');
            notif.classList.add('opacity-100', 'translate-y-0');
          }, 10);
          
          // Animasi keluar
          setTimeout(() => {
            notif.classList.remove('opacity-100', 'translate-y-0');
            notif.classList.add('opacity-0', '-translate-y-4');
            setTimeout(() => notif.remove(), 300);
          }, 2000);
        }

        // SCROLLSPY LOGIC: Animasi Menu Sticky Aktif saat di-scroll
        document.addEventListener('DOMContentLoaded', () => {
          const sections = document.querySelectorAll('.category-section');
          const navPills = document.querySelectorAll('.nav-pill');
          const stickyNav = document.getElementById('sticky-nav');
          const headerHeight = stickyNav.offsetHeight + 20; // Offset scroll

          // Smooth Scroll saat klik pill
          navPills.forEach(pill => {
            pill.addEventListener('click', (e) => {
              e.preventDefault();
              const targetId = pill.getAttribute('href').substring(1);
              const targetSection = document.getElementById(targetId);
              if (targetSection) {
                window.scrollTo({
                  top: targetSection.offsetTop - headerHeight,
                  behavior: 'smooth'
                });
              }
            });
          });

          // Deteksi posisi saat scroll
          window.addEventListener('scroll', () => {
            let current = '';
            
            sections.forEach(section => {
              const sectionTop = section.offsetTop;
              if (window.pageYOffset >= (sectionTop - headerHeight - 10)) {
                current = section.getAttribute('id');
              }
            });

            navPills.forEach(pill => {
              // Reset state
              pill.classList.remove('bg-theme', 'text-white', 'shadow-sm');
              pill.classList.add('bg-gray-100', 'text-gray-600', 'border-gray-200');
              
              // Set Active state
              if (pill.getAttribute('href') === '#' + current) {
                pill.classList.add('bg-theme', 'text-white', 'shadow-sm');
                pill.classList.remove('bg-gray-100', 'text-gray-600', 'border-gray-200');
                
                // Otomatis geser menu sticky agar item aktif tetap di tengah layar
                pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            });
          });
        });
      `}} />
    </div>
  , { title: `${resto.name} - Pesan Sekarang` })
})

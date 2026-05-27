import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const restoId = c.req.param('id');

  // Ambil Data Gerai
  const resto = await c.env.DB.prepare('SELECT * FROM restaurants WHERE id = ?').bind(restoId).first<any>();
  if (!resto) return c.notFound();

  // Ambil Kategori Menu Gerai Ini
  const { results: categories } = await c.env.DB.prepare(
    'SELECT * FROM menus WHERE restaurant_id = ? ORDER BY created_at ASC'
  ).bind(restoId).all();

  // Ambil Produk Menu Gerai Ini
  const { results: items } = await c.env.DB.prepare(`
    SELECT i.* FROM menu_items i
    JOIN menus m ON i.menu_id = m.id
    WHERE m.restaurant_id = ? AND i.is_available = 1
  `).bind(restoId).all();

  // Kelompokkan Produk Berdasarkan Menu Kategori
  const itemsByCategory = items.reduce((acc: any, item: any) => {
    if (!acc[item.menu_id]) acc[item.menu_id] = [];
    acc[item.menu_id].push(item);
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
      `}} />

      {/* Container Layar Mobile */}
      <div class="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative pb-24 overflow-hidden">
        
        {/* Header Cover Image */}
        <div class="relative h-48 bg-gray-200">
          <img 
            src={resto.image || `https://ui-avatars.com/api/?name=${resto.name}&background=${themeColor.replace('#','')}&color=fff&size=400`} 
            class="w-full h-full object-cover" 
            alt="Cover" 
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <a href="/users" class="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </a>

          <div class="absolute bottom-4 left-4 right-4">
            <h1 class="text-white text-2xl font-black shadow-sm drop-shadow-md">{resto.name}</h1>
            <p class="text-white/90 text-xs mt-1 drop-shadow flex items-center gap-1.5 line-clamp-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              {resto.address}
            </p>
          </div>
        </div>

        {/* Konten Katalog */}
        <div class="p-4 bg-gray-50">
          {categories.length === 0 ? (
            <p class="text-center text-gray-400 py-10 font-bold">Katalog menu sedang disiapkan.</p>
          ) : categories.map((cat: any) => (
            <div class="mb-8">
              <h2 class="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
                <span class="w-1.5 h-6 bg-theme rounded-full"></span>
                {cat.name}
              </h2>
              
              <div class="grid grid-cols-2 gap-3">
                {(!itemsByCategory[cat.id] || itemsByCategory[cat.id].length === 0) ? (
                  <p class="text-xs text-gray-400 col-span-2 italic">Belum ada item tersedia.</p>
                ) : itemsByCategory[cat.id].map((item: any) => (
                  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:border-theme transition-colors relative">
                    <div class="h-32 bg-gray-100 relative">
                      <img src={item.image || 'https://via.placeholder.com/200'} class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {item.stock <= 5 && (
                        <span class="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">Sisa {item.stock}</span>
                      )}
                    </div>
                    <div class="p-3 flex flex-col flex-1">
                      <h3 class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight flex-1">{item.name}</h3>
                      <div class="mt-2 flex items-center justify-between">
                        <span class="text-sm font-black text-theme">{currencyFormatter.format(item.price)}</span>
                        <button 
                          class="w-8 h-8 rounded-full bg-theme/10 text-theme hover:bg-theme hover:text-white transition-colors flex items-center justify-center"
                          onclick={`addToCart('${item.name}', ${item.price})`}
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Floating Cart Button (Simulasi) */}
        <div class="absolute bottom-6 left-6 right-6">
          <button class="w-full bg-theme text-white rounded-2xl py-4 px-6 shadow-xl shadow-black/10 flex items-center justify-between transform hover:-translate-y-1 transition-all">
            <div class="flex items-center gap-3">
              <div class="bg-white/20 p-2 rounded-xl">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <div class="text-left">
                <p class="text-xs font-medium text-white/80">Total Pesanan</p>
                <p class="text-sm font-black" id="cart-total">Rp 0</p>
              </div>
            </div>
            <span class="font-bold text-sm bg-white text-theme px-4 py-2 rounded-xl">Checkout</span>
          </button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        let total = 0;
        function addToCart(name, price) {
          total += price;
          document.getElementById('cart-total').innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(total);
          
          // Efek visual sederhana (Simulasi Snackbar)
          const notif = document.createElement('div');
          notif.className = 'fixed top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-bold z-50 animate-fade-in';
          notif.innerText = name + ' ditambahkan!';
          document.body.appendChild(notif);
          setTimeout(() => notif.remove(), 2000);
        }
      `}} />
    </div>
  , { title: `${resto.name} - Menu` })
})

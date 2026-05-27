import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  let isUserLoggedIn = false;
  const token = getCookie(c, 'token');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      if (payload && payload.id) isUserLoggedIn = true;
    } catch (e) {
      console.log("Token invalid");
    }
  }

  // Tarik Data Promo (Banner & Item)
  const { results: appPromos } = await c.env.DB.prepare(
    "SELECT image, action_url FROM app_promos WHERE type = 'BANNER' AND is_active = 1 ORDER BY created_at DESC"
  ).all();

  const { results: promoItems } = await c.env.DB.prepare(
    'SELECT id, category_id, name, description, price, promo_price, is_promo, image, stock, is_available, is_custom, custom_options FROM menu_items WHERE is_available = 1 AND is_promo = 1 ORDER BY created_at DESC'
  ).all();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  const safeItemsJson = JSON.stringify(promoItems).replace(/</g, '\\u003c');

  return c.render(
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
        `
      }} />

      <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-800 min-h-screen relative shadow-2xl pb-24 overflow-x-hidden transition-colors duration-300">
        
        {/* HEADER PROMO */}
        <div class="bg-white dark:bg-gray-800 px-4 pt-6 pb-4 shadow-sm sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
          <a href="/users" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </a>
          <h1 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-6 h-6 text-[#ee4d2d]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg>
            Promo Spesial
          </h1>
        </div>

        {/* BANNER PROMO */}
        {appPromos.length > 0 && (
          <div class="px-4 mt-5">
            <div class="flex flex-col gap-4">
              {appPromos.map((promo: any) => (
                <a href={promo.action_url || '#'} class="block transform hover:scale-[1.02] transition-transform shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                  <img src={promo.image} class="w-full h-40 object-cover bg-gray-200 dark:bg-gray-700" alt="Promo" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div class="h-2 bg-gray-100 dark:bg-gray-900 mt-6 w-full"></div>

        {/* GRID PRODUK PROMO */}
        <div class="mt-4 pb-8">
          <div class="px-4 flex justify-between items-center mb-4">
            <h3 class="text-base font-black text-gray-900 dark:text-white">Sedang Diskon Hari Ini</h3>
          </div>
          
          <div class="grid grid-cols-2 gap-3 px-4">
            {promoItems.length === 0 ? (
              <div class="col-span-2 text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <span class="text-gray-400 font-bold text-sm">Belum ada promo saat ini.</span>
              </div>
            ) : promoItems.map((item: any) => {
              const isOutOfStock = item.stock === 0;
              const discountPercent = Math.round(((item.price - item.promo_price) / item.price) * 100);

              return (
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-gray-700 flex flex-col overflow-hidden group relative">
                  <div class="absolute top-0 left-0 bg-[#ee4d2d] text-white text-[10px] font-black px-2 py-0.5 rounded-br-lg z-10 shadow-sm">{discountPercent}% OFF</div>
                  
                  <div class="relative h-36 w-full bg-gray-50 dark:bg-gray-700 overflow-hidden cursor-pointer" onclick={`openProductDetail('${item.id}')`}>
                    <img src={item.image || 'https://via.placeholder.com/150'} class={`w-full h-full object-cover transition-transform duration-500 ${isOutOfStock ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} />
                    {isOutOfStock && (
                      <div class="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span class="bg-gray-900 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">HABIS</span>
                      </div>
                    )}
                  </div>
                  
                  <div class="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-1 cursor-pointer" onclick={`openProductDetail('${item.id}')`}>{item.name}</h4>
                      <div class="flex flex-col">
                        <span class="text-[10px] font-medium text-gray-400 line-through">{formatter.format(item.price)}</span>
                        <span class="text-sm font-black text-[#ee4d2d]">{formatter.format(item.promo_price)}</span>
                      </div>
                    </div>
                    <div class="mt-3 flex justify-between items-end">
                      <span class="text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Sisa: {item.stock}</span>
                      
                      {item.is_custom === 1 ? (
                        <button onclick={!isOutOfStock ? `openProductDetail('${item.id}')` : undefined} disabled={isOutOfStock} class={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-colors ${isOutOfStock ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed' : 'bg-orange-50 text-[#ee4d2d] hover:bg-[#ee4d2d] hover:text-white dark:bg-[#ee4d2d]/20 dark:hover:bg-[#ee4d2d]'}`}>
                          Pilih
                        </button>
                      ) : (
                        <button onclick={!isOutOfStock ? `addToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.promo_price})` : undefined} disabled={isOutOfStock} class={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 ${isOutOfStock ? 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500 cursor-not-allowed' : 'bg-[#ee4d2d] text-white hover:bg-orange-700'}`}>
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

        {/* BOTTOM NAVIGATION BAR (FIXED) */}
        <div class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.08)] z-[40]">
          <div class="flex justify-around items-center h-[60px] px-2 pb-safe">
            <a href="/users" class="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#ee4d2d] transition-colors">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              <span class="text-[10px] font-semibold">Home</span>
            </a>
            <a href="/users/promos" class="flex flex-col items-center gap-1 text-[#ee4d2d]">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <span class="text-[10px] font-bold">Promo</span>
            </a>
            <a href="/users/cart" class="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#ee4d2d] transition-colors relative">
              <div id="nav-cart-badge" class="absolute -top-1 -right-1 bg-[#ee4d2d] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 hidden">0</div>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[10px] font-semibold">Keranjang</span>
            </a>
            <a href="/users/orders" class="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#ee4d2d] transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              <span class="text-[10px] font-semibold">Order</span>
            </a>
            <a href="/users/login" class="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#ee4d2d] transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span class="text-[10px] font-semibold">Profile</span>
            </a>
          </div>
        </div>

        {/* MODAL BOTTOM SHEET DETAIL PRODUK & KUSTOMISASI (SPOILER) */}
        <div id="product-detail-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] hidden flex flex-col justify-end opacity-0 transition-opacity duration-300">
          <div class="bg-white dark:bg-gray-800 w-full max-w-md mx-auto rounded-t-3xl max-h-[85vh] flex flex-col transform translate-y-full transition-transform duration-300" id="pdm-inner">
            <div class="relative h-56 bg-gray-100 dark:bg-gray-700 rounded-t-3xl flex-shrink-0">
              <img id="pdm-image" src="" class="w-full h-full object-cover rounded-t-3xl" />
              <button onclick="closeProductDetail()" class="absolute top-4 right-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors shadow-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div class="p-5 overflow-y-auto flex-1 hide-scrollbar pb-6">
              <h2 id="pdm-name" class="text-xl font-black text-gray-900 dark:text-white leading-tight"></h2>
              <p id="pdm-desc" class="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed"></p>
              <div class="mt-3 flex items-center gap-2">
                 <span id="pdm-price" class="text-lg font-black text-[#ee4d2d]"></span>
                 <span id="pdm-original-price" class="text-xs font-bold text-gray-400 dark:text-gray-500 line-through hidden"></span>
              </div>
              <div id="pdm-custom-container" class="mt-6 space-y-3"></div>
            </div>
            <div class="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-4 flex-shrink-0 pb-safe shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
              <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-1 border border-gray-200 dark:border-gray-600">
                <button onclick="updateQty(-1)" class="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 font-black text-xl hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l-xl transition">-</button>
                <span id="pdm-qty" class="w-6 text-center font-black text-gray-900 dark:text-white">1</span>
                <button onclick="updateQty(1)" class="w-10 h-10 flex items-center justify-center text-[#ee4d2d] font-black text-xl hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r-xl transition">+</button>
              </div>
              <button id="pdm-add-btn" class="flex-1 bg-[#ee4d2d] text-white py-3.5 rounded-xl font-bold shadow-md shadow-[#ee4d2d]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2" onclick="submitProductToCart()">
                <span>Tambah</span>
                <span class="w-1 h-1 rounded-full bg-white/50"></span>
                <span id="pdm-total-btn-price"></span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        const PRODUCTS = ${safeItemsJson};
        const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
        
        let cartTotal = 0;
        let cartItems = 0;
        let currentActiveProduct = null;
        let currentQty = 1;
        let basePrice = 0;
        let additionalPrice = 0;

        function showToast(msg, isError = false) {
          const toast = document.createElement('div');
          toast.className = \`fixed bottom-24 left-1/2 transform -translate-x-1/2 backdrop-blur-md text-white text-[11px] font-bold px-5 py-3 rounded-full shadow-2xl z-[150] flex items-center gap-2 transition-all duration-300 opacity-0 translate-y-4 border \${isError ? 'bg-red-600/95 border-red-500' : 'bg-gray-900/95 border-gray-800'}\`;
          toast.innerHTML = isError 
            ? '<svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ' + msg
            : '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> ' + msg;
          document.body.appendChild(toast);
          setTimeout(() => toast.classList.remove('opacity-0', 'translate-y-4'), 10);
          setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-4'); setTimeout(() => toast.remove(), 300); }, 2500);
        }

        // --- MANAJEMEN KERANJANG SEMENTARA ---
        function addToCart(id, name, price) {
          cartItems += 1;
          cartTotal += price;
          const badge = document.getElementById('nav-cart-badge');
          badge.innerText = cartItems;
          badge.classList.remove('hidden');
          badge.style.transform = 'scale(1.4)';
          setTimeout(() => badge.style.transform = 'scale(1)', 200);
          showToast(name + ' ditambahkan!');
        }

        // --- MODAL PRODUK & JSON ---
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
          } else { orig.classList.add('hidden'); }

          const container = document.getElementById('pdm-custom-container');
          container.innerHTML = '';
          additionalPrice = 0;

          if(item.is_custom === 1 && item.custom_options) {
             try {
                const options = JSON.parse(item.custom_options);
                options.forEach((optGroup, groupIdx) => {
                   let html = \`
                     <details class="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 shadow-sm" open>
                       <summary class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer select-none outline-none">
                         <div class="flex items-center gap-2">
                           <h4 class="font-black text-gray-900 dark:text-white text-sm">\${optGroup.title || optGroup.name}</h4>
                           \${optGroup.is_required || optGroup.required ? '<span class="text-[9px] font-bold bg-orange-100 dark:bg-[#ee4d2d]/20 text-[#ee4d2d] px-1.5 py-0.5 rounded">Wajib</span>' : '<span class="text-[9px] font-medium text-gray-500 dark:text-gray-400">Opsional</span>'}
                         </div>
                         <svg class="w-5 h-5 text-gray-400 dark:text-gray-500 transform group-open:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7-7-7-7"></path></svg>
                       </summary>
                       <div class="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                   \`;
                   const choices = optGroup.choices || optGroup.options || [];
                   choices.forEach((opt, optIdx) => {
                     const inputType = optGroup.type === 'radio' ? 'radio' : 'checkbox';
                     const inputName = \`custom_\${groupIdx}\`;
                     const priceText = opt.price > 0 ? \`+ \${formatter.format(opt.price)}\` : 'Gratis';
                     html += \`
                       <label class="flex items-center justify-between py-3 px-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-lg">
                         <div class="flex items-center gap-3">
                           <input type="\${inputType}" name="\${inputName}" value="\${opt.price}" class="w-4 h-4 text-[#ee4d2d] bg-white dark:bg-gray-700 focus:ring-[#ee4d2d] border-gray-300 dark:border-gray-600 \${inputType==='radio'?'rounded-full':'rounded'}" onchange="recalculateModalPrice()">
                           <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">\${opt.name}</span>
                         </div>
                         <span class="text-xs font-bold text-gray-500 dark:text-gray-400">\${priceText}</span>
                       </label>
                     \`;
                   });
                   html += '</div></details>';
                   container.innerHTML += html;
                });
             } catch(e) { console.error("Gagal parsing JSON", e); }
          }
          recalculateModalPrice();
          const modal = document.getElementById('product-detail-modal');
          const inner = document.getElementById('pdm-inner');
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          setTimeout(() => { modal.classList.remove('opacity-0'); inner.classList.remove('translate-y-full'); }, 10);
        }

        function closeProductDetail() {
          const modal = document.getElementById('product-detail-modal');
          const inner = document.getElementById('pdm-inner');
          modal.classList.add('opacity-0');
          inner.classList.add('translate-y-full');
          setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
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
           document.querySelectorAll('#pdm-custom-container input:checked').forEach(input => { additionalPrice += parseInt(input.value) || 0; });
           const total = (basePrice + additionalPrice) * currentQty;
           document.getElementById('pdm-total-btn-price').innerText = formatter.format(total);
        }

        function submitProductToCart() {
           const finalPrice = (basePrice + additionalPrice) * currentQty;
           for(let i=0; i < currentQty; i++){
              cartItems += 1;
              cartTotal += (basePrice + additionalPrice);
           }
           const badge = document.getElementById('nav-cart-badge');
           badge.innerText = cartItems;
           badge.classList.remove('hidden');
           badge.style.transform = 'scale(1.4)';
           setTimeout(() => badge.style.transform = 'scale(1)', 200);
           showToast(currentActiveProduct.name + ' ditambahkan ke pesanan!');
           closeProductDetail();
        }
      `}} />
    </div>
  , { title: 'Promo Spesial - ShopeeFood Clone' })
})

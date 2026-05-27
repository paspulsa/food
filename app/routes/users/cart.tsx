import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

export default createRoute(async (c) => {
  let userAddress = '';
  let userName = '';
  let userPhone = '';
  let isUserLoggedIn = false;

  const token = getCookie(c, 'token');
  
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      if (payload && payload.id) {
        const user = await c.env.DB.prepare(
          'SELECT name, address, phone FROM users WHERE id = ?'
        ).bind(payload.id).first<any>();
        
        if (user) {
          isUserLoggedIn = true;
          userName = user.name || '';
          userAddress = user.address || '';
          userPhone = user.phone || '';
        }
      }
    } catch (e) {}
  }

  return c.render(
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        `
      }} />

      <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-800 min-h-screen relative shadow-2xl pb-24 overflow-x-hidden transition-colors duration-300">
        
        {/* HEADER KERANJANG */}
        <div class="bg-white dark:bg-gray-800 px-4 pt-6 pb-4 shadow-sm sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <a href="/users" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </a>
            <h1 class="text-lg font-black text-gray-900 dark:text-white">Keranjang Saya</h1>
          </div>
          <button class="text-sm font-bold text-[#ee4d2d]">Hapus Semua</button>
        </div>

        {/* ALAMAT PENGANTARAN */}
        <div class="p-4 mt-2">
          <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700 flex items-start gap-3 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1.5 h-full bg-[#ee4d2d]"></div>
            <div class="bg-orange-50 dark:bg-[#ee4d2d]/10 p-2 rounded-full text-[#ee4d2d] flex-shrink-0 mt-0.5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <h3 class="text-sm font-black text-gray-900 dark:text-white">Alamat Pengantaran</h3>
                <button class="text-[11px] font-bold text-[#ee4d2d] bg-orange-50 dark:bg-[#ee4d2d]/10 px-2 py-1 rounded">Ubah</button>
              </div>
              <p class="text-xs font-bold text-gray-700 dark:text-gray-300 mb-0.5">{userName || 'Tamu'}</p>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed" id="cart-address-display">
                {userAddress || 'Mendeteksi lokasi dari sistem Anda...'}
              </p>
            </div>
          </div>
        </div>

        {/* LIST ITEM KERANJANG (Simulasi UI State Kosong/Terisi) */}
        <div class="px-4">
          <h3 class="text-sm font-black text-gray-900 dark:text-white mb-3">Pesanan Anda</h3>
          
          <div id="cart-items-container" class="space-y-4">
            {/* Tampilan ini akan dirender ulang oleh Javascript jika menggunakan LocalStorage. 
                Saat ini disajikan UI simulasi (*Mockup*) pesanan. */}
            <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-3 relative">
              <img src="https://via.placeholder.com/150" class="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-gray-600 flex-shrink-0" />
              <div class="flex flex-col justify-between flex-1">
                <div>
                  <h4 class="text-sm font-bold text-gray-900 dark:text-white leading-tight">Nasi Goreng Spesial + Telur</h4>
                  <p class="text-[10px] text-gray-500 mt-0.5">Catatan: Pedas sedang, jangan pakai sayur.</p>
                </div>
                <div class="flex justify-between items-end mt-2">
                  <span class="text-sm font-black text-[#ee4d2d]">Rp 28.000</span>
                  <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-0.5">
                    <button class="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 font-black text-lg">-</button>
                    <span class="w-6 text-center font-black text-xs text-gray-900 dark:text-white">1</span>
                    <button class="w-7 h-7 flex items-center justify-center text-[#ee4d2d] font-black text-lg">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CATATAN TAMBAHAN UNTUK RESTO */}
        <div class="px-4 mt-6">
          <textarea rows={2} class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#ee4d2d] transition-colors resize-none shadow-sm" placeholder="Ada pesan tambahan untuk restoran? (Cth: Minta banyakin saus)"></textarea>
        </div>

        {/* RINGKASAN PEMBAYARAN */}
        <div class="px-4 mt-6">
          <h3 class="text-sm font-black text-gray-900 dark:text-white mb-3">Ringkasan Pembayaran</h3>
          <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3 text-xs font-medium text-gray-600 dark:text-gray-400">
            <div class="flex justify-between">
              <span>Subtotal Harga (1 Barang)</span>
              <span class="font-bold text-gray-900 dark:text-white">Rp 28.000</span>
            </div>
            <div class="flex justify-between">
              <span>Ongkos Kirim</span>
              <span class="font-bold text-gray-900 dark:text-white">Rp 10.000</span>
            </div>
            <div class="flex justify-between border-b border-dashed border-gray-200 dark:border-gray-600 pb-3">
              <span>Biaya Layanan & Pengemasan</span>
              <span class="font-bold text-gray-900 dark:text-white">Rp 3.000</span>
            </div>
            <div class="flex justify-between pt-1">
              <span class="font-black text-sm text-gray-900 dark:text-white">Total Pembayaran</span>
              <span class="font-black text-lg text-[#ee4d2d]">Rp 41.000</span>
            </div>
          </div>
        </div>

        {/* WIDGET FIXED BUTTON CHECKOUT */}
        <div class="fixed bottom-[60px] left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 z-40 pb-safe">
          <button class="w-full bg-[#ee4d2d] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#ee4d2d]/30 active:scale-[0.98] transition-transform flex justify-between px-5 items-center">
            <span class="text-sm">Pesan & Antar Sekarang</span>
            <span class="text-sm bg-white/20 px-3 py-1 rounded-lg">Rp 41.000</span>
          </button>
        </div>

        {/* BOTTOM NAVIGATION BAR (FIXED) */}
        <div class="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.08)] z-[40]">
          <div class="flex justify-around items-center h-[60px] px-2 pb-safe">
            <a href="/users" class="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#ee4d2d] transition-colors">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
              <span class="text-[10px] font-semibold">Home</span>
            </a>
            <a href="/users/promos" class="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-[#ee4d2d] transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              <span class="text-[10px] font-semibold">Promo</span>
            </a>
            <a href="/users/cart" class="flex flex-col items-center gap-1 text-[#ee4d2d] relative">
              <div id="nav-cart-badge" class="absolute -top-1 -right-1 bg-[#ee4d2d] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 hidden">0</div>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span class="text-[10px] font-bold">Keranjang</span>
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

      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // Inisialisasi Alamat dari LocalStorage jika belum login
        document.addEventListener('DOMContentLoaded', () => {
          const dbAddress = \`${userAddress}\`;
          if (!dbAddress) {
            const savedAddress = localStorage.getItem('user_saved_address');
            if (savedAddress) {
              document.getElementById('cart-address-display').innerText = savedAddress;
            }
          }
        });
      `}} />
    </div>
  , { title: 'Keranjang Saya - ShopeeFood Clone' })
})

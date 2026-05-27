import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil gerai aktif dengan koordinat GPS
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, image, latitude, longitude, theme_color FROM restaurants WHERE isActive = 1 ORDER BY created_at DESC'
  ).all()

  return c.render(
    <div class="bg-[#F8F9FA] min-h-screen font-sans">
      <div class="max-w-md mx-auto bg-white min-h-screen shadow-xl relative pb-20">
        
        {/* TOP HEADER */}
        <div class="p-6 pb-2 bg-white">
          <div class="flex items-center justify-between mb-4">
             <div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lokasi Anda</p>
                <div class="flex items-center gap-1 text-gray-800 font-black text-sm">
                   <svg class="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg>
                   <span id="user-location-text">Mendeteksi lokasi...</span>
                </div>
             </div>
             <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
             </button>
          </div>
          <input type="text" placeholder="Mau makan apa hari ini?" class="w-full p-3 bg-gray-100 rounded-2xl border-0 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>

        {/* RESTAURANT LIST */}
        <div class="p-4" id="restaurant-list">
          <h2 class="text-lg font-black text-gray-800 mb-4 px-1">Restoran Terdekat</h2>
          {restaurants.map((resto: any) => (
            <a 
              href={`/users/${resto.id}`} 
              class="resto-card block bg-white rounded-3xl mb-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              data-lat={resto.latitude || 0}
              data-lng={resto.longitude || 0}
            >
              <div class="relative h-40">
                <img src={resto.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600'} class="w-full h-full object-cover" />
                <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1">
                  <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  4.8
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-black text-gray-800 text-base">{resto.name}</h3>
                <div class="flex items-center justify-between mt-2">
                   <p class="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">{resto.address}</p>
                   <span class="distance-text text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-md">- km</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* BOTTOM NAV */}
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex justify-around p-4 z-50">
            <button class="text-orange-500 flex flex-col items-center"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg><span class="text-[9px] font-bold mt-1">Home</span></button>
            <button class="text-gray-400 flex flex-col items-center"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg><span class="text-[9px] font-bold mt-1">Pesanan</span></button>
            <button class="text-gray-400 flex flex-col items-center"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg><span class="text-[9px] font-bold mt-1">Profil</span></button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        // Script lokasi GPS tetap sama untuk menghitung jarak ke tiap card
        navigator.geolocation.getCurrentPosition(pos => {
           const {latitude: uLat, longitude: uLng} = pos.coords;
           document.getElementById('user-location-text').innerText = "Titik Anda";
           document.querySelectorAll('.resto-card').forEach(card => {
              const rLat = parseFloat(card.dataset.lat); const rLng = parseFloat(card.dataset.lng);
              const R = 6371;
              const dLat = (rLat-uLat)*Math.PI/180; const dLng = (rLng-uLng)*Math.PI/180;
              const a = Math.sin(dLat/2)**2 + Math.cos(uLat*Math.PI/180)*Math.cos(rLat*Math.PI/180)*Math.sin(dLng/2)**2;
              const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              card.querySelector('.distance-text').innerText = d.toFixed(1) + ' km';
           });
        });
      `}} />
    </div>
  , { title: 'Pilih Restoran' })
})

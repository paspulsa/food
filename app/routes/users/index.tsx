import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  // Ambil semua gerai yang berstatus Aktif
  const { results: restaurants } = await c.env.DB.prepare(
    'SELECT id, name, address, image, latitude, longitude, theme_color FROM restaurants WHERE isActive = 1 ORDER BY created_at DESC'
  ).all();

  return c.render(
    <div class="bg-gray-100 min-h-screen font-sans">
      {/* Container pembatas agar menyerupai layar Mobile di Desktop */}
      <div class="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header ala Mobile App */}
        <div class="bg-white p-4 shadow-sm z-10 sticky top-0">
          <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Lokasi Pengantaran</p>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span id="user-location-text" class="text-sm font-black text-gray-800 truncate">Mencari kordinat GPS...</span>
          </div>
        </div>

        {/* Daftar Gerai */}
        <div class="flex-1 overflow-y-auto p-4 space-y-4" id="restaurant-list">
          {restaurants.length === 0 ? (
            <div class="text-center py-20">
              <p class="text-gray-400 font-bold">Belum ada gerai yang buka saat ini.</p>
            </div>
          ) : restaurants.map((resto: any) => (
            <a 
              href={`/users/${resto.id}`} 
              class="resto-card block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              data-lat={resto.latitude || 0}
              data-lng={resto.longitude || 0}
            >
              <div class="relative h-36 bg-gray-100">
                <img 
                  src={resto.image || `https://ui-avatars.com/api/?name=${resto.name}&background=${(resto.theme_color || 'E61010').replace('#','')}&color=fff&size=400`} 
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={resto.name} 
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="absolute bottom-3 left-3 flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={`background-color: ${resto.theme_color || '#E61010'}`}></span>
                  <h3 class="text-white font-black text-lg shadow-sm">{resto.name}</h3>
                </div>
              </div>
              <div class="p-4 flex justify-between items-center bg-white">
                <div class="flex-1 min-w-0 pr-4">
                  <p class="text-xs text-gray-500 truncate font-medium">{resto.address}</p>
                </div>
                <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  <span class="distance-text text-xs font-black text-gray-700">- km</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Script Geolocation Client-Side */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Rumus Haversine murni JavaScript
        function calculateDistance(lat1, lon1, lat2, lon2) {
          const R = 6371; // Radius Bumi (KM)
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }

        document.addEventListener('DOMContentLoaded', () => {
          const locText = document.getElementById('user-location-text');
          const cards = Array.from(document.querySelectorAll('.resto-card'));
          const listContainer = document.getElementById('restaurant-list');

          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                locText.innerText = "Lokasi Akurat Ditemukan";
                locText.classList.add('text-green-600');

                // Hitung jarak dan urutkan elemen
                cards.forEach(card => {
                  const restoLat = parseFloat(card.getAttribute('data-lat'));
                  const restoLng = parseFloat(card.getAttribute('data-lng'));
                  
                  if(restoLat && restoLng) {
                    const dist = calculateDistance(userLat, userLng, restoLat, restoLng);
                    card.setAttribute('data-distance', dist);
                    card.querySelector('.distance-text').innerText = dist.toFixed(1) + ' km';
                  } else {
                    card.setAttribute('data-distance', 9999);
                    card.querySelector('.distance-text').innerText = 'Jauh';
                  }
                });

                // Urutkan ulang DOM dari yang terdekat
                cards.sort((a, b) => parseFloat(a.getAttribute('data-distance')) - parseFloat(b.getAttribute('data-distance')));
                cards.forEach(card => listContainer.appendChild(card));
              },
              (error) => {
                locText.innerText = "Gagal membaca GPS perangkat";
                locText.classList.add('text-red-500');
              },
              { enableHighAccuracy: true }
            );
          } else {
            locText.innerText = "Browser tidak mendukung GPS";
          }
        });
      `}} />
    </div>
  , { title: 'Pilih Gerai Pesan Antar' })
})

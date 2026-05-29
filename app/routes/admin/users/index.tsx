import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB;
  
  // ==========================================
  // FETCH DATA USERS, POINTS, DAN ORDERS
  // ==========================================
  // Ambil semua pengguna
  const { results: users } = await db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  
  // Ambil data poin untuk setiap pengguna
  const { results: points } = await db.prepare('SELECT user_id, balance FROM points').all();
  const pointsMap = points.reduce((acc: any, p: any) => {
    acc[p.user_id] = p.balance;
    return acc;
  }, {});

  // Ambil data riwayat transaksi (orders)
  const { results: orders } = await db.prepare(
    'SELECT id, user_id, status, total_price, points_used, coupon_discount, created_at FROM orders ORDER BY created_at DESC'
  ).all();
  
  const ordersMap = orders.reduce((acc: any, o: any) => {
    if (!acc[o.user_id]) acc[o.user_id] = [];
    acc[o.user_id].push(o);
    return acc;
  }, {});

  // Gabungkan semua data untuk diinjeksi ke JavaScript Client-Side
  const usersData = users.map((u: any) => ({
    ...u,
    points: pointsMap[u.id] || 0,
    orders: ordersMap[u.id] || [],
    total_spent: (ordersMap[u.id] || []).filter((o:any) => o.status === 'COMPLETED' || o.status === 'PROCESSING' || o.status === 'PAID').reduce((sum:number, o:any) => sum + o.total_price, 0)
  }));

  const safeUsersJson = JSON.stringify(usersData).replace(/</g, '\\u003c');
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // Fungsi Helper untuk Warna Badge Role
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/30';
      case 'CASHIER': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30';
      case 'KITCHEN': return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-500/30';
      case 'WAITER': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  return c.render(
    <div class="space-y-6 pb-10">
      {/* Dependency Notifikasi */}
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

      {/* HEADER SECTION */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Manajemen Pelanggan & Role
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola data pelanggan, atur hak akses sistem, pantau saldo poin, dan riwayat transaksi.</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 flex gap-4">
          <span class="text-sm font-bold text-gray-600 dark:text-gray-300">Total: <span class="text-primary">{users.length} User</span></span>
        </div>
      </div>

      {/* TABEL PENGGUNA */}
      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr class="bg-gray-50/70 dark:bg-darkbg/50 text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
                <th class="px-6 py-4 font-semibold">Profil Pengguna</th>
                <th class="px-6 py-4 font-semibold">Kontak</th>
                <th class="px-6 py-4 font-semibold">Akses / Role</th>
                <th class="px-6 py-4 font-semibold">Total Order</th>
                <th class="px-6 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-darkborder text-sm">
              {usersData.length === 0 ? (
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic bg-white dark:bg-darkpanel">
                    Belum ada data pengguna yang mendaftar.
                  </td>
                </tr>
              ) : usersData.map((u: any) => (
                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} class="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover" alt="Avatar" />
                      <div>
                        <p class="font-bold text-gray-900 dark:text-white">{u.name}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs font-medium">
                    {u.phone || <span class="text-gray-400 italic">Belum diisi</span>}
                  </td>
                  <td class="px-6 py-4">
                    <span class={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="font-bold text-gray-800 dark:text-gray-200">{u.orders.length}</span> <span class="text-xs text-gray-400">Trx</span>
                  </td>
                  <td class="px-6 py-4 text-right space-x-2">
                    <button onclick={`showUserDetail('${u.id}')`} class="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                      Detail
                    </button>
                    <button onclick={`changeRole('${u.id}', '${u.role}', '${u.name.replace(/'/g, "\\'")}')`} class="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                      Ubah Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL DETAIL PENGGUNA & RIWAYAT TRANSAKSI
          ========================================================= */}
      <div id="user-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] hidden flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-gray-50 dark:bg-gray-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]" id="user-modal-inner">
          
          <div class="flex justify-between items-center p-5 bg-white dark:bg-darkpanel border-b border-gray-200 dark:border-darkborder shrink-0">
             <h3 class="font-black text-gray-800 dark:text-white text-lg flex items-center gap-2">
               <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"></path></svg>
               Profil & Riwayat Pelanggan
             </h3>
             <button onclick="closeUserModal()" class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>

          <div class="flex-1 overflow-y-auto p-5 hide-scrollbar">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div class="lg:col-span-1 space-y-4">
                <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-200 dark:border-darkborder text-center shadow-sm relative overflow-hidden">
                  <div class="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-primary to-orange-400 opacity-20"></div>
                  <img id="m-avatar" src="" class="w-24 h-24 rounded-full mx-auto border-4 border-white dark:border-darkpanel shadow-md relative z-10 object-cover" />
                  <h4 id="m-name" class="font-black text-lg text-gray-900 dark:text-white mt-3"></h4>
                  <span id="m-role" class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1"></span>
                  <p id="m-email" class="text-xs text-gray-500 dark:text-gray-400 mt-2"></p>
                </div>

                <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-200 dark:border-darkborder shadow-sm space-y-4">
                  <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No. WhatsApp</p>
                    <p id="m-phone" class="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5"></p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jenis Kelamin</p>
                    <p id="m-gender" class="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5"></p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alamat Utama</p>
                    <p id="m-address" class="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 leading-relaxed"></p>
                  </div>
                  <div class="pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                    <div class="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800/30">
                      <p class="text-[10px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">Saldo Poin</p>
                      <p id="m-points" class="text-lg font-black text-green-700 dark:text-green-400 mt-1"></p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                      <p class="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider">Total Belanja</p>
                      <p id="m-spent" class="text-lg font-black text-blue-700 dark:text-blue-400 mt-1"></p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="lg:col-span-2">
                <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-200 dark:border-darkborder shadow-sm h-full flex flex-col">
                  <div class="p-5 border-b border-gray-100 dark:border-darkborder flex justify-between items-center">
                    <h4 class="font-bold text-gray-800 dark:text-white">Riwayat Transaksi</h4>
                    <span id="m-order-count" class="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg"></span>
                  </div>
                  <div class="overflow-x-auto flex-1 p-2">
                    <table class="w-full text-left whitespace-nowrap">
                      <thead class="text-[11px] uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th class="px-4 py-3 rounded-l-lg">Tanggal & Waktu</th>
                          <th class="px-4 py-3">ID Pesanan</th>
                          <th class="px-4 py-3">Poin/Kupon</th>
                          <th class="px-4 py-3 text-right">Total Tagihan</th>
                          <th class="px-4 py-3 text-center rounded-r-lg">Status</th>
                        </tr>
                      </thead>
                      <tbody id="m-history" class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        {/* Diinjeksi oleh JS */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* SCRIPT KONTROL LOGIKA */}
      <script dangerouslySetInnerHTML={{ __html: `
        const USERS_DATA = ${safeUsersJson};
        const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

        function getBadgeClassJS(role) {
          switch(role) {
            case 'ADMIN': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-500/30';
            case 'CASHIER': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30';
            case 'KITCHEN': return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-500/30';
            case 'WAITER': return 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30';
            default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
          }
        }

        function showUserDetail(userId) {
          const user = USERS_DATA.find(u => u.id === userId);
          if (!user) return;

          document.getElementById('m-avatar').src = user.avatar || \`https://ui-avatars.com/api/?name=\${user.name}&background=random\`;
          document.getElementById('m-name').innerText = user.name;
          document.getElementById('m-email').innerText = user.email;
          document.getElementById('m-phone').innerText = user.phone || '-';
          document.getElementById('m-gender').innerText = user.gender === 'UNKNOWN' ? 'Tidak Disetel' : user.gender;
          document.getElementById('m-address').innerText = user.address || 'Alamat belum diisi.';
          document.getElementById('m-points').innerText = formatter.format(user.points);
          document.getElementById('m-spent').innerText = formatter.format(user.total_spent);
          document.getElementById('m-order-count').innerText = \`\${user.orders.length} Pesanan\`;

          const roleBadge = document.getElementById('m-role');
          roleBadge.innerText = user.role;
          roleBadge.className = \`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 border \${getBadgeClassJS(user.role)}\`;

          const tbody = document.getElementById('m-history');
          if (user.orders.length === 0) {
             tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-10 text-center text-gray-400 italic">Belum pernah melakukan transaksi.</td></tr>';
          } else {
             tbody.innerHTML = user.orders.map(o => {
               let statusClass = 'bg-gray-100 text-gray-600';
               if(o.status === 'COMPLETED') statusClass = 'bg-green-100 text-green-700 border border-green-200';
               if(o.status === 'PENDING' || o.status === 'UNPAID') statusClass = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
               if(o.status === 'PROCESSING' || o.status === 'PAID') statusClass = 'bg-blue-100 text-blue-700 border border-blue-200';
               if(o.status === 'CANCELLED') statusClass = 'bg-red-100 text-red-700 border border-red-200';

               const usedInfo = (o.points_used > 0 ? \`<span class="text-xs text-green-500 font-bold block">Poin: -\${formatter.format(o.points_used)}</span>\` : '') + 
                                (o.coupon_discount > 0 ? \`<span class="text-xs text-orange-500 font-bold block">Kupon: -\${formatter.format(o.coupon_discount)}</span>\` : '');

               return \`
                 <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                   <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">\${new Date(o.created_at).toLocaleString('id-ID')}</td>
                   <td class="px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">\${o.id}</td>
                   <td class="px-4 py-3">\${usedInfo || '-'}</td>
                   <td class="px-4 py-3 text-right font-black text-gray-900 dark:text-white">\${formatter.format(o.total_price)}</td>
                   <td class="px-4 py-3 text-center">
                     <span class="px-2 py-1 text-[9px] font-bold rounded uppercase \${statusClass}">\${o.status}</span>
                   </td>
                 </tr>
               \`;
             }).join('');
          }

          const modal = document.getElementById('user-modal');
          const inner = document.getElementById('user-modal-inner');
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          setTimeout(() => {
            modal.classList.remove('opacity-0');
            inner.classList.remove('scale-95');
          }, 10);
        }

        function closeUserModal() {
          const modal = document.getElementById('user-modal');
          const inner = document.getElementById('user-modal-inner');
          modal.classList.add('opacity-0');
          inner.classList.add('scale-95');
          setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
          }, 300);
        }

        // FUNGSI UBAH ROLE YANG DIPERBAIKI (Tembak ke API Backend)
        async function changeRole(userId, currentRole, userName) {
          const allowedRoles = ['ADMIN', 'CASHIER', 'KITCHEN', 'WAITER', 'USER'];
          
          let inputOptions = {};
          allowedRoles.forEach(r => inputOptions[r] = r);

          const { value: newRole } = await Swal.fire({
            title: 'Ubah Akses Role',
            html: \`Pilih hak akses sistem baru untuk <b>\${userName}</b>:\`,
            icon: 'question',
            input: 'select',
            inputOptions: inputOptions,
            inputValue: currentRole,
            showCancelButton: true,
            confirmButtonColor: '#ee4d2d',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Simpan Akses',
            cancelButtonText: 'Batal'
          });

          if (newRole && newRole !== currentRole) {
            Swal.fire({
                title: 'Menyimpan...',
                text: 'Mohon tunggu sebentar',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            // AMBIL TOKEN DARI COOKIE
            const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
            if (!token) return Swal.fire('Error', 'Sesi login kedaluwarsa.', 'error');

            try {
              // TEMBAK KE ENDPOINT API BACKEND YANG BENAR
              const res = await fetch('/api/v1/protected/admin/users/' + userId + '/role', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token 
                },
                body: JSON.stringify({ role: newRole })
              });
              
              const data = await res.json();
              if (data.success) {
                Swal.fire('Berhasil!', data.message, 'success').then(() => window.location.reload());
              } else {
                Swal.fire('Gagal', data.message, 'error');
              }
            } catch (e) {
              Swal.fire('Error', 'Terjadi kesalahan jaringan.', 'error');
            }
          }
        }
      `}} />
    </div>
  , { title: 'Manajemen Pelanggan - Admin SPOS' })
})

import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const { results: users } = await c.env.DB.prepare(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.render(
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Manajemen Akses Pengguna</h2>
          <p class="text-gray-500 text-sm mt-1">Kelola lisensi hak akses pengguna aplikasi mobile dan administrator web.</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/70 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
              <th class="px-6 py-4 font-semibold">Identitas Pengguna</th>
              <th class="px-6 py-4 font-semibold">Tanggal Terdaftar</th>
              <th class="px-6 py-4 font-semibold">Hak Akses Saat Ini</th>
              <th class="px-6 py-4 text-right font-semibold">Aksi Modifikasi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 text-sm">
            {users.map((user: any) => (
              <tr class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="font-bold text-gray-800">{user.name}</div>
                  <div class="text-xs text-gray-400 font-mono mt-0.5">{user.email}</div>
                </td>
                <td class="px-6 py-4 text-gray-500 font-medium">{new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                <td class="px-6 py-4">
                  <span class={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-100 text-slate-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <select 
                    class="text-xs font-bold border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:border-primary bg-white cursor-pointer"
                    onchange={`updateUserRole('${user.id}', this.value, '${user.name}', '${user.email}')`}
                  >
                    <option value="USER" selected={user.role === 'USER'}>Set USER</option>
                    <option value="ADMIN" selected={user.role === 'ADMIN'}>Set ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ambil token dari cookie di sisi client secara dinamis untuk otorisasi API */}
      <script dangerouslySetInnerHTML={{ __html: `
        async function updateUserRole(userId, newRole, name, email) {
          const cookies = document.cookie.split('; ');
          const adminToken = cookies.find(row => row.startsWith('admin_token='))?.split('=')[1];
          
          if (!adminToken) {
            alert('Sesi masuk kedaluwarsa. Silakan login kembali.');
            return;
          }

          if(!confirm('Apakah Anda yakin ingin mengubah hak akses ' + name + ' menjadi ' + newRole + '?')) return;

          try {
            const res = await fetch('/api/v1/protected/admin/users/' + userId, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminToken
              },
              body: JSON.stringify({ name: name, email: email, role: newRole })
            });
            const data = await res.json();
            if(data.success) {
              window.location.reload();
            } else {
              alert(data.message || 'Gagal memperbarui konfigurasi pengguna.');
            }
          } catch(err) {
            alert('Kesalahan jaringan saat menghubungi klaster server.');
          }
        }
      `}} />
    </div>
  , { title: 'Manajemen Pengguna' })
})

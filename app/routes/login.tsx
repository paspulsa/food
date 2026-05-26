import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="flex items-center justify-center h-screen bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-sm border-t-4 border-blue-600">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
        
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" id="email" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" id="password" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
            Masuk ke Dashboard
          </button>
        </form>
        
        <div id="error-msg" class="text-red-500 text-sm mt-4 text-center hidden bg-red-50 p-2 rounded border border-red-200"></div>
        
        {/* Logika Client-Side untuk Authentication */}
        <script>
          {`
            document.getElementById('login-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              const errorMsg = document.getElementById('error-msg');
              
              errorMsg.classList.add('hidden'); // Sembunyikan error lama
              
              try {
                // Menembak API Backend Hono Anda
                const res = await fetch('/api/v1/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                
                // Pastikan login sukses dan yang masuk adalah ADMIN
                if (data.success && data.currentAuthority === 'ADMIN') {
                  // Simpan token ke dalam Cookie untuk dibaca oleh _middleware.ts
                  document.cookie = "admin_token=" + data.token + "; path=/; max-age=86400;";
                  
                  // Arahkan ke halaman Admin
                  window.location.href = '/admin';
                } else {
                  errorMsg.innerText = data.message || 'Akses ditolak. Anda bukan Administrator.';
                  errorMsg.classList.remove('hidden');
                }
              } catch (err) {
                errorMsg.innerText = 'Gagal terhubung ke server. Coba lagi.';
                errorMsg.classList.remove('hidden');
              }
            });
          `}
        </script>
      </div>
    </div>,
    { title: 'Login Admin - KPKembar' }
  )
})

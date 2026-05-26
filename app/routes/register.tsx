import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-md border-t-4 border-green-600">
        <h2 class="text-2xl font-bold mb-2 text-center text-gray-800">Daftar Akun Baru</h2>
        <p class="text-sm text-gray-600 text-center mb-6">Silakan lengkapi data di bawah untuk mendaftar</p>
        
        <form id="register-form" class="space-y-4">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-1">Nama Lengkap</label>
            <input type="text" id="name" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-1">Email</label>
            <input type="email" id="email" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-1">Password</label>
            <input type="password" id="password" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-1">Umur</label>
              <input type="number" id="age" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-gray-700 text-sm font-bold mb-1">Jenis Kelamin</label>
              <select id="gender" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="UNKNOWN">Pilih</option>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-1">Nomor Telepon</label>
            <input type="text" id="phone" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-1">Alamat</label>
            <textarea id="address" rows={2} class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
          </div>
          
          <button type="submit" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-200">
            Daftar Sekarang
          </button>
        </form>
        
        <div id="msg" class="text-sm mt-4 text-center hidden p-3 rounded border"></div>
        
        <div class="text-center mt-6">
          <p class="text-sm text-gray-600">
            Sudah punya akun? <a href="/login" class="text-blue-600 hover:underline">Login di sini</a>
          </p>
        </div>
        
        <script>
          {`
            document.getElementById('register-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const msgBox = document.getElementById('msg');
              msgBox.classList.add('hidden');
              
              const payload = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                age: parseInt(document.getElementById('age').value) || null,
                gender: document.getElementById('gender').value,
                phone: document.getElementById('phone').value || null,
                address: document.getElementById('address').value || null
              };
              
              try {
                const res = await fetch('/api/v1/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                
                if (data.success) {
                  msgBox.innerText = data.message;
                  msgBox.className = "text-sm mt-4 text-center p-3 rounded border bg-green-50 text-green-700 border-green-200";
                  msgBox.classList.remove('hidden');
                  document.getElementById('register-form').reset();
                } else {
                  msgBox.innerText = data.message || 'Terjadi kesalahan saat mendaftar.';
                  msgBox.className = "text-sm mt-4 text-center p-3 rounded border bg-red-50 text-red-700 border-red-200";
                  msgBox.classList.remove('hidden');
                }
              } catch (err) {
                msgBox.innerText = 'Gagal terhubung ke server.';
                msgBox.className = "text-sm mt-4 text-center p-3 rounded border bg-red-50 text-red-700 border-red-200";
                msgBox.classList.remove('hidden');
              }
            });
          `}
        </script>
      </div>
    </div>,
    { title: 'Pendaftaran Akun - KPKembar' }
  )
})

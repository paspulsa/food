import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-8 rounded shadow-md w-full max-w-sm border-t-4 border-green-600">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">Daftar Akun User</h2>
        
        {/* Tambahkan onsubmit="event.preventDefault(); submitForm();" di sini */}
        <form id="register-form" class="space-y-4" onsubmit="event.preventDefault(); submitRegister();">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Nama Lengkap</label>
            <input type="text" id="name" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" id="email" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" id="password" class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" required />
          </div>
          <button type="submit" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition duration-200">
            Daftar Sekarang
          </button>
        </form>
        
        <div id="msg-box" class="text-sm mt-4 text-center hidden p-2 rounded border"></div>
        
        <div class="text-center mt-4">
          <a href="/login" class="text-sm text-blue-600 hover:underline">Sudah punya akun? Login</a>
        </div>
        
        {/* Gunakan dangerouslySetInnerHTML agar script tidak di-escape oleh JSX */}
        <script dangerouslySetInnerHTML={{ __html: `
          async function submitRegister() {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msgBox = document.getElementById('msg-box');
            
            msgBox.classList.add('hidden');
            
            try {
              const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
              });
              
              const data = await res.json();
              
              if (data.success) {
                msgBox.innerText = data.message;
                msgBox.className = 'text-sm mt-4 text-center p-2 rounded border bg-green-100 text-green-700 border-green-200 block';
                document.getElementById('register-form').reset();
              } else {
                msgBox.innerText = data.message || 'Gagal mendaftar.';
                msgBox.className = 'text-sm mt-4 text-center p-2 rounded border bg-red-100 text-red-700 border-red-200 block';
              }
            } catch (err) {
              msgBox.innerText = 'Gagal terhubung ke server.';
              msgBox.className = 'text-sm mt-4 text-center p-2 rounded border bg-red-100 text-red-700 border-red-200 block';
            }
          }
        `}} />
      </div>
    </div>,
    { title: 'Register - KPKembar' }
  )
})

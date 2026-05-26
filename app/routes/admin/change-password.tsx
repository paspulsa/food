import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="max-w-md mx-auto bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Ubah Password</h2>
        <p class="text-sm text-gray-500 mt-1">Amankan akun akses admin Anda dengan memperbarui kata sandi secara berkala.</p>
      </div>

      <form action="/api/v1/protected/admin/change-password" method="POST" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Password Lama</label>
          <input 
            type="password" 
            name="old_password" 
            required 
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Masukkan password saat ini"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
          <input 
            type="password" 
            name="new_password" 
            required 
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Minimal 6 karakter"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
          <input 
            type="password" 
            name="confirm_password" 
            required 
            class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Ulangi password baru Anda"
          />
        </div>

        <div class="pt-2">
          <button 
            type="submit" 
            class="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md transition-colors"
          >
            Simpan Perubahan Password
          </button>
        </div>
      </form>
    </div>
    , { title: 'Ubah Password Admin' }
  )
})

import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="max-w-md mx-auto bg-white dark:bg-darkpanel rounded-2xl shadow-sm border border-gray-100 dark:border-darkborder p-6 space-y-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">Ubah Password</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Amankan akun akses admin Anda dengan memperbarui kata sandi secara berkala.</p>
      </div>

      <form action="/api/v1/protected/admin/change-password" method="POST" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password Lama</label>
          <input 
            type="password" 
            name="old_password" 
            required 
            class="w-full px-4 py-2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-primary dark:focus:border-primary transition-colors"
            placeholder="Masukkan password saat ini"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
          <input 
            type="password" 
            name="new_password" 
            required 
            class="w-full px-4 py-2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-primary dark:focus:border-primary transition-colors"
            placeholder="Minimal 6 karakter"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Konfirmasi Password Baru</label>
          <input 
            type="password" 
            name="confirm_password" 
            required 
            class="w-full px-4 py-2 bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-primary dark:focus:border-primary transition-colors"
            placeholder="Ulangi password baru Anda"
          />
        </div>

        <div class="pt-2">
          <button 
            type="submit" 
            class="w-full py-2.5 px-4 bg-primary hover:opacity-90 text-white font-bold rounded-xl shadow-md shadow-primary/20 transition-all"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
    , { title: 'Ubah Password - SPOS' }
  )
})

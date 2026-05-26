import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div class="flex items-center justify-center h-screen bg-gray-100">
      <div class="text-center bg-white p-10 rounded-lg shadow-md">
        <h1 class="text-3xl font-bold text-gray-800 mb-4">Sistem Aktif</h1>
        <p class="text-gray-600 mb-8">API Backend & Dashboard Admin KPKembar berjalan normal.</p>
        <a href="/admin" class="bg-blue-600 text-white font-semibold px-6 py-3 rounded hover:bg-blue-700 transition">
          Masuk ke Dashboard Admin
        </a>
      </div>
    </div>,
    { title: 'Beranda - KPKembar' }
  )
})

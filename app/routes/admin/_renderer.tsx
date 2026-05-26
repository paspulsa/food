import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children }) => {
  return (
    <div class="flex h-screen bg-gray-100">
      <aside class="w-64 bg-gray-900 text-white flex flex-col">
        <div class="h-16 flex items-center justify-center border-b border-gray-800">
          <h1 class="text-xl font-bold">KPKembar Admin</h1>
        </div>
        <nav class="flex-1 p-4 space-y-2">
          <a href="/admin" class="block py-2 px-4 rounded hover:bg-gray-800">Dashboard</a>
          <a href="/admin/restaurants" class="block py-2 px-4 rounded hover:bg-gray-800">Restoran</a>
          <a href="/admin/menus" class="block py-2 px-4 rounded hover:bg-gray-800">Katalog Menu</a>
          <a href="/admin/orders" class="block py-2 px-4 rounded hover:bg-gray-800">Pesanan</a>
        </nav>
      </aside>
      <main class="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
})

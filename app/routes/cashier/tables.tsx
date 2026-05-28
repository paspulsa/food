import { createRoute } from 'honox/factory'
import { getCookie } from 'hono/cookie'

export const POST = createRoute(async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  if (body.action === 'free_table') {
    await db.prepare("UPDATE tables SET status = 'IDLE' WHERE id = ?").bind(body.table_id).run();
    return c.json({ success: true, message: `Meja ${body.table_id} berhasil dikosongkan.` });
  }
  return c.json({ success: false }, 400);
});

export default createRoute(async (c) => {
  const shiftActive = getCookie(c, 'shift_cashier');
  if (!shiftActive) return c.redirect('/cashier'); // Lempar ke halaman buka shift

  const db = c.env.DB;
  const { results: tables } = await db.prepare(`SELECT id, name, status FROM tables ORDER BY name ASC`).all();

  return c.render(
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
      
      {/* NAVBAR PWA */}
      <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
         <div class="flex items-center gap-6">
            <h1 class="font-black text-xl text-yellow-600 flex items-center gap-2">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
               Super Kasir
            </h1>
            <div class="hidden md:flex gap-2">
               <a href="/cashier" class="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors">Antrean Bayar</a>
               <a href="/cashier/tables" class="px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 font-bold border border-yellow-200 dark:border-yellow-800">Manajemen Meja</a>
               <a href="/cashier/report" class="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition-colors">Laporan Keuangan</a>
            </div>
         </div>
         <button onclick="endShift()" class="text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors">Akhiri Shift</button>
      </nav>

      <div class="max-w-7xl mx-auto px-6 py-8">
         <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-8 shadow-sm">
            <p class="text-sm text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Klik tombol 'Kosongkan Meja' jika pelanggan sudah pulang namun sesi mejanya masih nyangkut di sistem.
            </p>
         </div>

         <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {tables.map((t: any) => {
               const isOccupied = t.status === 'OCCUPIED';
               return (
                 <div class={`p-6 rounded-3xl border-2 transition-all shadow-md ${isOccupied ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                    <div class={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isOccupied ? 'bg-red-100 dark:bg-red-900/50 text-red-600' : 'bg-green-100 dark:bg-green-900/50 text-green-600'}`}>
                       <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    </div>
                    <h3 class="text-xl font-black text-gray-900 dark:text-white">{t.name}</h3>
                    <p class={`text-xs font-black uppercase tracking-wider mt-1 ${isOccupied ? 'text-red-500' : 'text-green-500'}`}>
                       {isOccupied ? 'Terisi / Dipesan' : 'Tersedia'}
                    </p>
                    
                    {isOccupied && (
                       <button onclick={`freeTable('${t.id}', '${t.name}')`} class="mt-5 w-full bg-white dark:bg-gray-800 border-2 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 font-bold py-3 rounded-xl transition-all shadow-sm active:scale-95">
                         Kosongkan Meja
                       </button>
                    )}
                 </div>
               )
            })}
         </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        async function endShift() {
           await fetch('/cashier', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action: 'end_shift'}) });
           window.location.href = '/cashier';
        }
        function freeTable(tableId, tableName) {
          Swal.fire({
            title: 'Kosongkan Meja?',
            text: \`Matikan sesi tamu di \${tableName}?\`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#3b82f6', confirmButtonText: 'Ya, Kosongkan!'
          }).then(async (result) => {
            if (result.isConfirmed) {
              const res = await fetch('/cashier/tables', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'free_table', table_id: tableId }) });
              const data = await res.json();
              if(data.success) { Swal.fire('Berhasil!', data.message, 'success').then(()=>window.location.reload()); }
            }
          });
        }
      `}} />
    </div>
  , { title: 'Meja - PWA Kasir' })
})

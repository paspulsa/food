import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const db = c.env.DB;

  if (c.req.method === 'POST') {
    try {
      const body = await c.req.json();
      if (body.action === 'cook') {
        await db.prepare("UPDATE orders SET kitchen_status = 'COOKING', status = 'PREPARING' WHERE id = ?").bind(body.order_id).run();
        return c.json({ success: true });
      } else if (body.action === 'ready') {
        await db.prepare("UPDATE orders SET kitchen_status = 'READY' WHERE id = ?").bind(body.order_id).run();
        return c.json({ success: true });
      }
    } catch (e: any) { return c.json({ success: false }, 500); }
  }

  const { results: orders } = await db.prepare(`
    SELECT o.id, COALESCE(o.guest_name, u.name, 'Tamu') as customer_name, o.table_id, o.order_type, o.kitchen_status, o.notes, o.created_at,
    (SELECT json_group_array(json_object('name', m.name, 'qty', od.quantity, 'note', od.note)) 
     FROM order_details od JOIN menu_items m ON od.menu_item_id = m.id WHERE od.order_id = o.id) as items_json
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status IN ('PROCESSING', 'PREPARING') AND o.kitchen_status IN ('WAITING', 'COOKING')
    ORDER BY o.created_at ASC
  `).all();

  return c.render(
    <div class="min-h-screen bg-gray-900 pb-10">
      <div class="flex items-center justify-between bg-gray-800 p-6 border-b border-gray-700 shadow-sm sticky top-0 z-10">
        <div>
          <h2 class="text-3xl font-black text-white">👨‍🍳 Kitchen Display (KDS)</h2>
          <p class="text-gray-400 text-sm mt-1">Daftar pesanan lunas yang wajib segera disiapkan.</p>
        </div>
        <div class="bg-red-500/20 text-red-500 border border-red-500/50 px-5 py-2.5 rounded-xl font-bold text-lg animate-pulse">
          Antrean Masak: {orders.length}
        </div>
      </div>

      <div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((o: any) => {
          let items = [];
          try { items = JSON.parse(o.items_json || '[]'); } catch(e) {}
          const isCooking = o.kitchen_status === 'COOKING';
          
          return (
            <div class={`p-5 rounded-3xl shadow-2xl border-2 flex flex-col transition-all ${isCooking ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700'}`}>
               <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                 <div>
                   <h3 class="text-2xl font-black text-white">{o.table_id !== 'TAKEAWAY' ? `MEJA ${o.table_id}` : 'TAKEAWAY'}</h3>
                   <p class="text-sm font-bold text-gray-400 mt-1">{o.customer_name} • {new Date(o.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                 </div>
                 <span class={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${isCooking ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-700 text-gray-300'}`}>
                    {isCooking ? 'Sedang Dimasak' : 'Menunggu'}
                 </span>
               </div>
               
               <div class="flex-1 space-y-3 mb-6">
                 {items.map((it:any) => (
                   <div class="flex justify-between items-start bg-gray-700/40 p-4 rounded-2xl border border-gray-600/50">
                      <div class="flex-1 pr-4">
                        <p class="text-white font-bold text-lg leading-tight">{it.name}</p>
                        {it.note && <p class="text-yellow-400 text-sm font-bold mt-1.5 bg-yellow-400/10 inline-block px-2 py-1 rounded">📝 {it.note}</p>}
                      </div>
                      <div class="text-2xl font-black text-white bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">{it.qty}x</div>
                   </div>
                 ))}
                 {o.notes && (
                   <div class="mt-4 p-4 border-l-4 border-red-500 bg-red-500/10 text-red-200 text-sm font-bold rounded-r-xl">
                     Pesan Tambahan: {o.notes}
                   </div>
                 )}
               </div>

               {isCooking ? (
                 <button onclick={`updateKitchen('${o.id}', 'ready')`} class="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-black py-5 rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                   Selesai & Siap Diantar!
                 </button>
               ) : (
                 <button onclick={`updateKitchen('${o.id}', 'cook')`} class="w-full bg-[#ee4d2d] hover:bg-orange-600 text-white text-xl font-black py-5 rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                   Mulai Masak
                 </button>
               )}
            </div>
          )
        })}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        setInterval(() => window.location.reload(), 10000);

        async function updateKitchen(orderId, actionType) {
            try {
              const res = await fetch('/kitchen', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ action: actionType, order_id: orderId })
              });
              const data = await res.json();
              if(data.success) window.location.reload();
            } catch(e) { alert('Gangguan koneksi.'); }
        }
      `}} />
    </div>
  , { title: 'Kitchen Display - RMS' })
})

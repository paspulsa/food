import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const orderId = c.req.param('id');

  // 1. Ambil Data Induk (Header Pesanan) + Relasi User & Restoran
  const order: any = await c.env.DB.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone, r.name as restaurant_name 
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.id = ?
  `).bind(orderId).first();

  if (!order) {
    return c.render(
      <div class="p-10 text-center">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Pesanan Tidak Ditemukan</h2>
        <a href="/admin/orders" class="text-primary hover:underline mt-2 inline-block">Kembali ke Daftar Pesanan</a>
      </div>, { title: 'Not Found' }
    );
  }

  // 2. Ambil Data Anak (Detail Item) + Harga Master untuk Kalkulasi Custom Addon
  const { results: items } = await c.env.DB.prepare(`
    SELECT od.*, m.name as item_name, m.image as item_image, m.price as base_price, m.promo_price, m.is_promo
    FROM order_details od
    JOIN menu_items m ON od.menu_item_id = m.id
    WHERE od.order_id = ?
  `).bind(orderId).all();

  // 3. Ambil Data Transaksi (Untuk MDR, Kode Unik, dan Total Bayar Real)
  const transaction: any = await c.env.DB.prepare(
    'SELECT amount, final_amount, status, raw_qris, unique_code FROM transactions WHERE order_id = ?'
  ).bind(orderId).first();

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // ==========================================
  // KALKULASI REVERSE ENGINEERING BIAYA
  // ==========================================
  let subtotal = 0;
  let ongkir = 0;

  if (order.order_type === 'VOUCHER') {
      subtotal = order.total_price;
      ongkir = 0;
  } else {
      subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      ongkir = Math.max(0, order.total_price - subtotal + order.coupon_discount);
  }

  const uniqueCode = transaction ? (transaction.unique_code || 0) : 0;
  
  let mdrFee = 0;
  let finalBayar = order.total_price;
  
  if (transaction) {
      finalBayar = transaction.final_amount;
      mdrFee = Math.max(0, finalBayar - order.total_price - uniqueCode + order.points_used);
  } else if (order.status === 'PROCESSING' || order.status === 'COMPLETED') {
      finalBayar = 0;
      mdrFee = 0; 
  }

  const totalTagihan = order.total_price + mdrFee;

  return c.render(
    <div class="space-y-6 print:space-y-0 print:bg-white print:m-0 print:p-0">
      
      {/* STYLE KHUSUS UNTUK PRINTER THERMAL (58mm) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page { margin: 0; padding: 0; }
            body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .thermal-receipt {
              width: 58mm; 
              padding: 2mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.2;
              color: black;
              background: white;
              margin: 0 auto;
            }
            .thermal-border { border-bottom: 1px dashed black; margin: 4px 0; }
          }
        `
      }} />

      {/* ========================================================
          1. UI APLIKASI WEB (Dihide saat cetak)
          ======================================================== */}
      <div class="print:hidden">
        {/* HEADER PAGE */}
        <div class="flex items-center justify-between bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm mb-6">
          <div class="flex items-center gap-4">
            <a href="/admin/orders" class="p-2 bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </a>
            <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
                Pesanan #{order.id.substring(0,8)}
                <span class={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                  order.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                  order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                  order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                  'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                }`}>{order.status}</span>
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-xs mt-1 font-mono">
                Tanggal: {new Date(order.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <button onclick="window.print()" class="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition active:scale-95">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Cetak Struk
          </button>
        </div>

        {/* INFO CARDS GRID */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1: Info Pelanggan */}
          <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm flex flex-col">
            <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Informasi Pelanggan</h3>
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">
                {order.user_name.charAt(0)}
              </div>
              <div>
                <p class="font-bold text-gray-800 dark:text-gray-200">{order.user_name}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{order.user_email || '-'}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{order.user_phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Metode & Tipe Pesanan */}
          <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm flex flex-col">
             <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Metode Transaksi</h3>
             <div class="space-y-4">
               <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                   Tipe Pesanan
                 </span>
                 <span class="font-bold text-gray-800 dark:text-gray-200">{order.order_type || 'DINE_IN'}</span>
               </div>
               <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                   Metode Bayar
                 </span>
                 <span class={`text-[11px] font-bold px-2 py-1 rounded border ${
                   order.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500/30' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-500/30'
                 }`}>
                   {order.payment_method || 'CASH'}
                 </span>
               </div>
             </div>
          </div>

          {/* Card 3: Info Restoran & Pengiriman */}
          <div class="bg-white dark:bg-darkpanel p-5 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm flex flex-col">
            <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Info Gerai & Alamat</h3>
            <div class="space-y-2 text-sm">
              <p class="font-bold text-gray-800 dark:text-gray-200">Mitra: {order.restaurant_name}</p>
              <div class="p-3 bg-gray-50 dark:bg-darkbg rounded-lg border border-gray-100 dark:border-darkborder">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Catatan / Alamat Kirim:</p>
                <p class="font-medium text-gray-700 dark:text-gray-300 line-clamp-2 text-xs">{order.address || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABEL DETAIL ITEM (ORDER DETAILS) */}
        <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden mb-6">
          <div class="px-6 py-5 border-b border-gray-100 dark:border-darkborder bg-gray-50/50 dark:bg-darkbg/40">
            <h3 class="font-bold text-gray-800 dark:text-white">Rincian Item Dipesan</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
                  <th class="px-6 py-4 font-semibold">Produk</th>
                  <th class="px-6 py-4 font-semibold text-right">Harga Satuan</th>
                  <th class="px-6 py-4 font-semibold text-center">Kuantitas</th>
                  <th class="px-6 py-4 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-darkborder text-sm">
                {items.length === 0 ? (
                   <tr><td colspan="4" class="px-6 py-8 text-center italic text-gray-400">{order.order_type === 'VOUCHER' ? 'Voucher Digital' : 'Data item tidak ditemukan.'}</td></tr>
                ) : items.map((item: any) => {
                  // Perhitungan Custom Add-on Rincian
                  const currentBasePrice = item.is_promo ? item.promo_price : item.base_price;
                  const addonPrice = item.price - currentBasePrice;

                  return (
                  <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-4">
                        <img src={item.item_image || 'https://via.placeholder.com/150'} class="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-darkborder" />
                        <div>
                          <span class="font-bold text-gray-800 dark:text-gray-200 block">{item.item_name}</span>
                          {item.note && (
                            <span class="text-xs font-semibold text-orange-500 dark:text-orange-400 block mt-1">
                              Custom: {item.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                       <div class="font-medium text-gray-800 dark:text-gray-200">{formatter.format(item.price)}</div>
                       {item.note && addonPrice > 0 && (
                          <div class="text-[10px] text-gray-400 mt-1 space-y-0.5">
                             <p>Dasar: {formatter.format(currentBasePrice)}</p>
                             <p class="text-orange-500">Tambahan: +{formatter.format(addonPrice)}</p>
                          </div>
                       )}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="inline-block px-3 py-1 bg-gray-100 dark:bg-darkbg rounded-lg font-bold text-gray-700 dark:text-gray-300">{item.quantity} x</span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-gray-800 dark:text-gray-200">
                      {formatter.format(item.price * item.quantity)}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* SUMMARY TOTAL (SESUAI DENGAN FRONTEND USER) */}
          <div class="p-6 bg-gray-50 dark:bg-darkbg/40 flex justify-end">
            <div class="w-full sm:w-1/2 md:w-1/3 space-y-3">
              <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal Item</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{formatter.format(subtotal)}</span>
              </div>
              
              {ongkir > 0 && (
                <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Ongkos Kirim</span>
                  <span class="font-medium text-gray-700 dark:text-gray-300">{formatter.format(ongkir)}</span>
                </div>
              )}

              {mdrFee > 0 && (
                <div class="flex justify-between text-sm text-yellow-600">
                  <span>Biaya Layanan (MDR)</span>
                  <span class="font-bold">{formatter.format(mdrFee)}</span>
                </div>
              )}

              {order.coupon_discount > 0 && (
                <div class="flex justify-between text-sm text-green-500">
                  <span>Diskon Kupon</span>
                  <span class="font-bold">-{formatter.format(order.coupon_discount)}</span>
                </div>
              )}

              <div class="border-t border-dashed border-gray-200 dark:border-darkborder pt-2 pb-1 flex justify-between items-center">
                <span class="font-bold text-sm text-gray-800 dark:text-gray-200">Total Tagihan</span>
                <span class="font-bold text-sm text-gray-800 dark:text-gray-200">{formatter.format(totalTagihan)}</span>
              </div>

              {order.points_used > 0 && (
                <div class="flex justify-between text-sm text-[#ee4d2d]">
                  <span>Potongan Poin</span>
                  <span class="font-bold">-{formatter.format(order.points_used)}</span>
                </div>
              )}

              {uniqueCode > 0 && (
                <div class="flex justify-between text-sm text-[#ee4d2d]">
                  <span>Kode Unik</span>
                  <span class="font-bold">+{uniqueCode}</span>
                </div>
              )}

              <div class="border-t border-gray-200 dark:border-darkborder pt-3 flex justify-between items-center">
                <span class="text-lg font-bold text-gray-800 dark:text-gray-200">Total Bayar</span>
                <span class="text-2xl font-black text-primary">{formatter.format(finalBayar)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. STRUK PRINTER THERMAL (HANYA MUNCUL SAAT DI-PRINT)
          ======================================================== */}
      <div class="hidden print:block thermal-receipt">
        <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 4px;">KEDAI PANGSIT KEMBAR 88</div>
        <div style="text-align: center; margin-bottom: 8px;">
          Food Court Modern<br/>
          Telp: 0812-xxxx-xxxx
        </div>
        
        <div class="thermal-border"></div>
        <table style="width: 100%; text-align: left; margin-bottom: 4px;">
          <tr><td style="width: 35%;">No. Ord</td><td style="width: 5%;">:</td><td>{order.id}</td></tr>
          <tr><td>Tanggal</td><td>:</td><td>{new Date(order.created_at).toLocaleString('id-ID')}</td></tr>
          <tr><td>Status</td><td>:</td><td>{order.status}</td></tr>
          <tr><td style="vertical-align: top;">Cust</td><td style="vertical-align: top;">:</td><td>{order.user_name}</td></tr>
        </table>
        <div class="thermal-border"></div>

        {/* RINCIAN ITEM STRUK */}
        <table style="width: 100%; text-align: left; margin-bottom: 8px;">
          {items.length === 0 ? (
            <tr><td colspan="3" style="text-align: center; font-style: italic;">{order.order_type === 'VOUCHER' ? 'Voucher Digital' : '-'}</td></tr>
          ) : items.map((item: any) => (
            <tr>
              <td style="width: 15%; vertical-align: top;">{item.quantity}x</td>
              <td style="width: 55%; vertical-align: top;">
                {item.item_name}
                {/* Print Rincian Add-on jika ada */}
                {item.note && <div style="font-size: 9px; color: #333; margin-top: 1px;">+ {item.note}</div>}
              </td>
              <td style="width: 30%; text-align: right; vertical-align: top;">{formatter.format(item.price * item.quantity).replace('Rp', '')}</td>
            </tr>
          ))}
        </table>

        <div class="thermal-border"></div>
        
        {/* RINGKASAN BIAYA STRUK */}
        <table style="width: 100%; font-weight: bold;">
          <tr><td style="padding-bottom: 2px;">Subtotal</td><td style="text-align: right;">{formatter.format(subtotal).replace('Rp', '')}</td></tr>
          {ongkir > 0 && <tr><td style="padding-bottom: 2px;">Ongkir</td><td style="text-align: right;">{formatter.format(ongkir).replace('Rp', '')}</td></tr>}
          {mdrFee > 0 && <tr><td style="padding-bottom: 2px;">MDR</td><td style="text-align: right;">{formatter.format(mdrFee).replace('Rp', '')}</td></tr>}
          {order.coupon_discount > 0 && <tr><td style="padding-bottom: 2px;">Kupon</td><td style="text-align: right;">-{formatter.format(order.coupon_discount).replace('Rp', '')}</td></tr>}
          
          <div class="thermal-border"></div>

          <tr><td style="padding-top: 2px;">Tagihan</td><td style="text-align: right; padding-top: 2px;">{formatter.format(totalTagihan).replace('Rp', '')}</td></tr>
          {order.points_used > 0 && <tr><td style="padding-bottom: 2px;">Pot. Poin</td><td style="text-align: right;">-{formatter.format(order.points_used).replace('Rp', '')}</td></tr>}
          {uniqueCode > 0 && <tr><td style="padding-bottom: 2px;">Kd. Unik</td><td style="text-align: right;">+{uniqueCode}</td></tr>}
          
          <tr>
            <td style="font-size: 13px; padding-top: 4px;">TOT. BAYAR</td>
            <td style="text-align: right; font-size: 13px; padding-top: 4px;">{formatter.format(finalBayar).replace('Rp', '')}</td>
          </tr>
        </table>
        
        <div class="thermal-border" style="margin-top: 8px;"></div>
        
        <div style="text-align: center; margin-top: 10px; font-size: 10px;">
          Terima kasih atas pesanan Anda!<br/>
          <span style="font-style: italic;">Powered by SPOS</span>
        </div>
      </div>

    </div>
  , { title: `Detail Pesanan #${orderId.substring(0,8)} - SPOS Admin` })
})

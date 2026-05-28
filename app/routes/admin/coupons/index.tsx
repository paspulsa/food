import { createRoute } from 'honox/factory'

export default createRoute(async (c) => {
  const { results: coupons } = await c.env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();

  return c.render(
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-darkpanel p-6 rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Manajemen Kupon & Voucher</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Buat diskon untuk menarik pelanggan. Support subsidi silang dan voucher penuh.</p>
        </div>
        <button onclick="openModal()" class="w-full sm:w-auto bg-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2">
          + Buat Kupon Baru
        </button>
      </div>

      <div class="bg-white dark:bg-darkpanel rounded-2xl border border-gray-100 dark:border-darkborder shadow-sm overflow-hidden overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-gray-50 dark:bg-darkbg text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-darkborder">
              <th class="px-6 py-4">Kode Kupon</th>
              <th class="px-6 py-4">Nilai Diskon</th>
              <th class="px-6 py-4">Min. Belanja</th>
              <th class="px-6 py-4">Batas Pakai</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-darkborder text-sm">
            {coupons.map((p: any) => (
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-6 py-4 font-black text-primary uppercase">{p.code}</td>
                <td class="px-6 py-4 font-bold dark:text-gray-200">
                  {p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% (Max Rp${p.max_discount})` : `Rp ${p.discount_value.toLocaleString()}`}
                </td>
                <td class="px-6 py-4 dark:text-gray-300">Rp {p.min_purchase.toLocaleString()}</td>
                <td class="px-6 py-4 dark:text-gray-300">
                  {p.usage_limit > 0 ? `${p.used_count} / ${p.usage_limit} kali` : 'Unlimited'}
                </td>
                <td class="px-6 py-4">
                  <button onclick={`toggleStatus('${p.id}', ${p.is_active})`} class={`px-2.5 py-1 text-[10px] font-bold rounded-full ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <button onclick={`deleteCoupon('${p.id}')`} class="text-xs font-bold text-red-500 hover:text-red-700">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <div id="formModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-darkpanel w-full max-w-lg rounded-2xl p-6 shadow-2xl">
          <div class="flex justify-between items-center mb-4">
             <h3 class="font-bold text-lg dark:text-white">Buat Kupon Baru</h3>
             <button onclick="closeModal()" class="text-gray-400 font-bold hover:text-gray-700">X</button>
          </div>
          <form onsubmit="event.preventDefault(); submitData();" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Kode Voucher</label>
              <input type="text" id="c_code" required placeholder="Cth: MAKANGRATIS" class="w-full p-2.5 border rounded-lg uppercase dark:bg-darkbg dark:text-white dark:border-darkborder" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Tipe Diskon</label>
                <select id="c_type" onchange="toggleMaxDiscount()" class="w-full p-2.5 border rounded-lg dark:bg-darkbg dark:text-white dark:border-darkborder">
                  <option value="FIXED">Potongan Harga (Rp)</option>
                  <option value="PERCENTAGE">Persentase (%)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Nilai Diskon</label>
                <input type="number" id="c_val" required placeholder="Cth: 15000 / 50" class="w-full p-2.5 border rounded-lg dark:bg-darkbg dark:text-white dark:border-darkborder" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Min. Belanja (Rp)</label>
                <input type="number" id="c_min" value="0" class="w-full p-2.5 border rounded-lg dark:bg-darkbg dark:text-white dark:border-darkborder" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Maks. Diskon Rp (Jika %)</label>
                <input type="number" id="c_max" value="0" class="w-full p-2.5 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-darkborder" disabled />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Limit Kuota (0 = Bebas)</label>
                <input type="number" id="c_limit" value="0" class="w-full p-2.5 border rounded-lg dark:bg-darkbg dark:text-white dark:border-darkborder" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-500 mb-1">Kedaluwarsa Pada</label>
                <input type="datetime-local" id="c_exp" class="w-full p-2.5 border rounded-lg dark:bg-darkbg dark:text-white dark:border-darkborder" />
              </div>
            </div>
            <button type="submit" class="w-full bg-primary text-white py-3 font-bold rounded-xl mt-2">Simpan & Terbitkan Kupon</button>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function openModal() { document.getElementById('formModal').classList.remove('hidden'); }
        function closeModal() { document.getElementById('formModal').classList.add('hidden'); }
        
        function toggleMaxDiscount() {
          const type = document.getElementById('c_type').value;
          const maxInput = document.getElementById('c_max');
          if (type === 'PERCENTAGE') { maxInput.disabled = false; maxInput.classList.remove('bg-gray-100', 'dark:bg-gray-800'); } 
          else { maxInput.disabled = true; maxInput.value = 0; maxInput.classList.add('bg-gray-100', 'dark:bg-gray-800'); }
        }

        async function submitData() {
          const payload = {
            code: document.getElementById('c_code').value,
            discount_type: document.getElementById('c_type').value,
            discount_value: document.getElementById('c_val').value,
            min_purchase: document.getElementById('c_min').value,
            max_discount: document.getElementById('c_max').value,
            usage_limit: document.getElementById('c_limit').value,
            valid_until: document.getElementById('c_exp').value || null
          };
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          const res = await fetch('/api/v1/protected/admin/coupons', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if(res.ok) window.location.reload(); else alert(json.message);
        }

        async function toggleStatus(id, curr) {
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          await fetch('/api/v1/protected/admin/coupons/' + id + '/status', {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ is_active: curr === 1 ? 0 : 1 })
          });
          window.location.reload();
        }

        async function deleteCoupon(id) {
          if(!confirm('Hapus kupon ini?')) return;
          const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='))?.split('=')[1];
          await fetch('/api/v1/protected/admin/coupons/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
          window.location.reload();
        }
      `}} />
    </div>
  , { title: 'Manajemen Voucher' })
})

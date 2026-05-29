import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const gobizRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const getGojekHeaders = (token: string | null, deviceId: string) => ({
    'Host': 'api.gobiz.co.id',
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
    'x-appid': 'go-biz-web-dashboard',
    'x-client-id': 'go-biz-web-new',
    'x-appversion': 'platform-v3.98.0',
    'x-deviceos': 'Web',
    'x-phonemake': 'Google',
    'x-phonemodel': 'Chrome',
    'x-platform': 'Web',
    'x-uniqueid': deviceId,
    'x-user-type': 'merchant',
    'x-user-locale': 'en-US',
    'gojek-country-code': 'ID',
    'gojek-timezone': 'Asia/Jakarta',
    'Authentication-Type': 'go-id',
    'Origin': 'https://portal.gofoodmerchant.co.id',
    'Referer': 'https://portal.gofoodmerchant.co.id/',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

async function getConfig(db: D1Database) {
    let config: any = await db.prepare('SELECT * FROM config WHERE id = 1').first();
    if (!config) {
        await db.prepare('INSERT OR IGNORE INTO config (id) VALUES (1)').run();
        config = await db.prepare('SELECT * FROM config WHERE id = 1').first();
    }
    return config;
}

const requireGoBizAuth = async (c: any, next: any) => {
    const config: any = await getConfig(c.env.DB);
    if (!config || !config.access_token) return c.json({ status: 'error', message: 'Session expired' }, 401);
    c.set('config', config);
    await next();
};

function getDateRange(filter: string) {
    const now = new Date();
    const jakartaDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    let startWib = new Date(`${jakartaDateStr}T00:00:00+07:00`);
    let endWib = new Date(`${jakartaDateStr}T23:59:59+07:00`);

    if (filter === 'week') {
        const day = startWib.getDay() || 7; 
        if (day !== 1) startWib.setDate(startWib.getDate() - (day - 1));
    } else if (filter === 'month') {
        startWib.setDate(1); 
    }
    return { from: startWib.toISOString(), to: endWib.toISOString() };
}

gobizRouter.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const deviceId = crypto.randomUUID(); 
        if (!body.email) return c.json({ error: "Email wajib diisi" }, 400);

        const resp = await fetch('https://api.gobiz.co.id/goid/login/request', {
            method: 'POST', headers: getGojekHeaders(null, deviceId),
            body: JSON.stringify({ client_id: "go-biz-web-new", email: body.email })
        });
        
        const text = await resp.text();
        let data: any;
        try { data = JSON.parse(text); } catch(e) { return c.json({ error: "API Error" }, 400); }

        if (resp.ok && (data?.data?.otp_token || data?.otp_token)) {
            return c.json({ status: 'success', otp_token: data?.data?.otp_token || data?.otp_token, device_id: deviceId });
        }
        return c.json({ error: 'Gojek Reject', details: data }, 400);
    } catch (e: any) { return c.json({ error: e.message }, 500); }
});

gobizRouter.post('/verify', async (c) => {
    try {
        const body = await c.req.json();
        const { otp, otp_token, device_id } = body;
        
        const tokenResp = await fetch('https://api.gobiz.co.id/goid/token', {
            method: 'POST', headers: getGojekHeaders(null, device_id),
            body: JSON.stringify({ client_id: "go-biz-web-new", grant_type: "otp", data: { otp_token, otp: String(otp) } })
        });
        
        const tokenData: any = await tokenResp.json();
        if (!tokenData.access_token) return c.json({ error: 'OTP Salah' }, 401);

        const profileResp = await fetch('https://api.gobiz.co.id/v1/merchants/search?from=0&size=1', {
            method: 'POST', headers: getGojekHeaders(tokenData.access_token, device_id),
            body: JSON.stringify({ from: 0, size: 1 })
        });
        
        const profileData: any = await profileResp.json();
        const merchant = profileData.hits?.[0];

        if(!merchant) return c.json({error: "Merchant tidak ditemukan"}, 404);

        await c.env.DB.prepare(`
            UPDATE config SET merchant_id = ?, merchant_name = ?, access_token = ?, refresh_token = ?, device_id = ?, updated_at = ? WHERE id = 1
        `).bind(merchant.id, merchant.outlet_name, tokenData.access_token, tokenData.refresh_token, device_id, Math.floor(Date.now() / 1000)).run();

        return c.json({ status: 'success' });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
});

gobizRouter.post('/refresh', async (c) => {
    const config: any = await getConfig(c.env.DB);
    if (!config || !config.refresh_token) return c.json({ error: 'No refresh token available' }, 401);
    try {
        const resp = await fetch('https://api.gobiz.co.id/goid/token', {
            method: 'POST', headers: getGojekHeaders(null, config.device_id),
            body: JSON.stringify({ client_id: "go-biz-web-new", grant_type: "refresh_token", data: { refresh_token: config.refresh_token } })
        });
        const data: any = await resp.json();
        if (resp.ok && data.access_token) {
            const now = Math.floor(Date.now() / 1000);
            const newRefreshToken = data.refresh_token || config.refresh_token;
            await c.env.DB.prepare('UPDATE config SET access_token = ?, refresh_token = ?, updated_at = ? WHERE id = 1').bind(data.access_token, newRefreshToken, now).run();
            return c.json({ status: 'success' });
        }
        await c.env.DB.prepare('UPDATE config SET access_token = NULL, refresh_token = NULL WHERE id = 1').run();
        return c.json({ error: 'Session permanently expired' }, 401);
    } catch (e: any) { return c.json({ error: e.message }, 500); }
});

gobizRouter.post('/logout', async (c) => {
    await c.env.DB.prepare('UPDATE config SET access_token = NULL, refresh_token = NULL WHERE id = 1').run();
    return c.json({ status: 'success' });
});

gobizRouter.get('/balance', requireGoBizAuth, async (c) => {
    const config = c.get('config');
    const db = c.env.DB;
    try {
        // --- 1. TITIK NOL: JAM 22:00 WIB (Kemarin atau Hari Ini) ---
        const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
        const jktDate = new Date(nowStr);
        if (jktDate.getHours() < 22) jktDate.setDate(jktDate.getDate() - 1);
        
        const yyyy = jktDate.getFullYear();
        const mm = String(jktDate.getMonth() + 1).padStart(2, '0');
        const dd = String(jktDate.getDate()).padStart(2, '0');
        const cutOffTimeISO = `${yyyy}-${mm}-${dd}T22:00:00+07:00`;
        const cutOffTimeMs = new Date(cutOffTimeISO).getTime();

        // --- 2. HITUNG PEMASUKAN (SETTLEMENT) SETELAH TITIK NOL ---
        const balancePayload = { 
            from: 0, size: 500, sort: { time: { order: "desc" } }, 
            included_categories: { incoming: ["transaction_share", "action"] }, 
            query: [{ op: "and", clauses: [{ field: "metadata.transaction.merchant_id", op: "equal", value: config.merchant_id }, { field: "metadata.transaction.status", op: "in", value: ["settlement"] }, { field: "metadata.transaction.transaction_time", op: "gt", value: cutOffTimeISO }] }] 
        };
        const balanceResp = await fetch('https://api.gobiz.co.id/journals/search', { method: 'POST', headers: getGojekHeaders(config.access_token, config.device_id), body: JSON.stringify(balancePayload) });
        
        if (balanceResp.status === 401) return c.json({ error: 'Session expired' }, 401);
        
        const balanceData: any = await balanceResp.json();
        let totalPemasukan = 0; 
        const processedBalanceIds = new Set();
        (balanceData.hits || []).forEach((h: any) => {
            const metaTx = h.metadata?.transaction || {};
            const orderId = metaTx.order_id || h.reference_id;
            if (!processedBalanceIds.has(orderId)) { 
                processedBalanceIds.add(orderId); 
                totalPemasukan += ((h.amount || metaTx.amount || 0) / 100); 
            }
        });

        // --- 3. HITUNG PENGELUARAN (PAYOUT MANUAL) SETELAH TITIK NOL ---
        let totalPengeluaran = 0;
        try {
            // Tarik riwayat payout terbaru dari Gojek
            const payoutResp = await fetch(`https://api.gobiz.co.id/v1/merchants/payouts?page=1&per=10`, { 
                method: 'GET', headers: getGojekHeaders(config.access_token, config.device_id) 
            });
            const payoutData: any = await payoutResp.json();
            
            (payoutData.payouts || []).forEach((p: any) => {
                const payoutTime = new Date(p.created_at).getTime();
                // Jika pemilik warung melakukan payout manual SETELAH jam 10 malam terakhir
                if (payoutTime > cutOffTimeMs) {
                    totalPengeluaran += (parseFloat(p.net_amount || p.amount || 0) / 100);
                }
            });
        } catch (err) {
            console.error("Gagal menarik data pengeluaran manual", err);
        }

        // --- 4. SALDO AKHIR = PEMASUKAN - PENGELUARAN ---
        let realBalance = totalPemasukan - totalPengeluaran;
        if (realBalance < 0) realBalance = 0; // Mencegah tampilan minus jika ada delay sinkronisasi API

        // --- 5. LOGIKA REKAP DATA: HARI, MINGGU, BULAN ---
        const { from: monthFrom, to: monthTo } = getDateRange('month');
        const { from: weekFrom } = getDateRange('week');
        const { from: todayFrom } = getDateRange('today');

        const statsPayload = { 
            from: 0, size: 1000, 
            included_categories: { incoming: ["transaction_share", "action"] }, 
            query: [{ op: "and", clauses: [{ field: "metadata.transaction.merchant_id", op: "equal", value: config.merchant_id }, { field: "metadata.transaction.status", op: "in", value: ["settlement"] }, { field: "metadata.transaction.transaction_time", op: "gte", value: monthFrom }, { field: "metadata.transaction.transaction_time", op: "lte", value: monthTo }] }] 
        };
        const statsResp = await fetch('https://api.gobiz.co.id/journals/search', { method: 'POST', headers: getGojekHeaders(config.access_token, config.device_id), body: JSON.stringify(statsPayload) });
        const statsData: any = await statsResp.json();
        
        let todayCount = 0, todayAmount = 0;
        let weekCount = 0, weekAmount = 0;
        let monthCount = 0, monthAmount = 0;
        const processedStatsIds = new Set();
        
        const tFrom = new Date(todayFrom).getTime();
        const wFrom = new Date(weekFrom).getTime();

        (statsData.hits || []).forEach((h: any) => {
            const metaTx = h.metadata?.transaction || {};
            const orderId = metaTx.order_id || h.reference_id;
            if (!processedStatsIds.has(orderId)) { 
                processedStatsIds.add(orderId); 
                const amt = ((h.amount || metaTx.amount || 0) / 100);
                const txTime = new Date(h.time || metaTx.transaction_time).getTime();
                
                monthCount++; monthAmount += amt;
                if (txTime >= wFrom) { weekCount++; weekAmount += amt; }
                if (txTime >= tFrom) { todayCount++; todayAmount += amt; }
            }
        });

        return c.json({ 
            status: 'success', 
            balance: realBalance, 
            today: { count: todayCount, amount: todayAmount },
            week: { count: weekCount, amount: weekAmount },
            month: { count: monthCount, amount: monthAmount }
        });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
});

gobizRouter.get('/mutations', requireGoBizAuth, async (c) => {
    const config = c.get('config');
    const { from, to } = getDateRange(c.req.query('filter') || 'today');
    try {
        const payload = { from: 0, size: 500, sort: { time: { order: "desc" } }, included_categories: { incoming: ["transaction_share", "action"] }, query: [{ op: "and", clauses: [{ field: "metadata.transaction.merchant_id", op: "equal", value: config.merchant_id }, { field: "metadata.transaction.transaction_time", op: "gte", value: from }, { field: "metadata.transaction.transaction_time", op: "lte", value: to }] }] };
        const resp = await fetch('https://api.gobiz.co.id/journals/search', { method: 'POST', headers: getGojekHeaders(config.access_token, config.device_id), body: JSON.stringify(payload) });
        
        if (resp.status === 401) return c.json({ error: 'Session expired' }, 401);

        const data: any = await resp.json();
        const cleanData: any[] = []; const processedIds = new Set();
        (data.hits || []).forEach((hit: any) => {
            const metaTx = hit.metadata?.transaction || {};
            const orderId = metaTx.order_id || hit.reference_id;
            if (!processedIds.has(orderId)) {
                processedIds.add(orderId);
                cleanData.push({ time: hit.time || metaTx.transaction_time, amount: (hit.amount || metaTx.amount) / 100, status: metaTx.status || hit.status, order_id: orderId });
            }
        });
        return c.json({ status: 'success', transactions: cleanData });
    } catch (e: any) { return c.json({ error: e.message }, 500); }
});

gobizRouter.post('/config/range', async (c) => {
    const {min,max} = await c.req.json(); 
    await c.env.DB.prepare('UPDATE config SET unique_min=?, unique_max=? WHERE id=1').bind(min,max).run(); 
    return c.json({success:true}); 
});

gobizRouter.post('/config/master-qr', async (c) => {
    const {raw_qris} = await c.req.json(); 
    await c.env.DB.prepare('UPDATE config SET master_raw_qris=? WHERE id=1').bind(raw_qris).run(); 
    return c.json({success:true}); 
});

gobizRouter.get('/trx/list', async (c) => {
    try { 
        const {results} = await c.env.DB.prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50').all(); 
        return c.json({transactions:results}); 
    } catch(e) { return c.json({transactions:[]}); } 
});

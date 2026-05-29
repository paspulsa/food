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

// Murni menyontek struktur request JSON dari logs Anda
function buildGojekQuery(merchantId: string, fromISO: string, toISO?: string) {
    const clauses: any[] = [
        { op: "not", clauses: [{ op: "or", clauses: [{ field: "metadata.source", op: "in", value: ["GOSAVE_ONLINE", "GoSave", "GODEALS_ONLINE"] }, { field: "metadata.gopay.source", op: "in", value: ["GOSAVE_ONLINE", "GoSave", "GODEALS_ONLINE"] }] }] },
        { field: "metadata.transaction.status", op: "in", value: ["settlement", "capture", "refund", "partial_refund"] },
        { op: "or", clauses: [{ op: "or", clauses: [{ field: "metadata.transaction.payment_type", op: "in", value: ["qris", "gopay", "offline_credit_card", "offline_debit_card", "credit_card"] }] }] },
        { field: "metadata.transaction.transaction_time", op: "gte", value: fromISO },
        { field: "metadata.transaction.merchant_id", op: "equal", value: merchantId }
    ];
    if (toISO) {
        // Masukkan sebelum index terakhir agar rapi
        clauses.splice(clauses.length - 1, 0, { field: "metadata.transaction.transaction_time", op: "lte", value: toISO });
    }
    
    return {
        from: 0, size: 500, sort: { time: { order: "desc" } },
        included_categories: { incoming: ["transaction_share", "action"] },
        query: [{ op: "and", clauses }]
    };
}

async function fetchStats(config: any, fromISO: string, toISO: string, label: string) {
    const payload = buildGojekQuery(config.merchant_id, fromISO, toISO);
    console.log(`[DEBUG - STATS ${label}] Query Payload:`, JSON.stringify(payload));
    try {
        const resp = await fetch('https://api.gobiz.co.id/journals/search', { method: 'POST', headers: getGojekHeaders(config.access_token, config.device_id), body: JSON.stringify(payload) });
        if (!resp.ok) {
            console.error(`[DEBUG - STATS ${label}] Fetch failed with status:`, resp.status);
            return { count: 0, amount: 0 };
        }
        const data: any = await resp.json();
        console.log(`[DEBUG - STATS ${label}] Hits found:`, data.hits?.length || 0);
        
        let count = 0, amount = 0;
        const processed = new Set();
        (data.hits || []).forEach((h: any) => {
            const metaTx = h.metadata?.transaction || {};
            const orderId = metaTx.order_id || h.reference_id;
            if (!processed.has(orderId)) { 
                processed.add(orderId); 
                if (metaTx.status === 'settlement') {
                    count++; 
                    amount += ((h.amount || metaTx.amount || 0) / 100); 
                }
            }
        });
        return { count, amount };
    } catch(e) { 
        console.error(`[DEBUG - STATS ${label}] Exception:`, e);
        return { count: 0, amount: 0 }; 
    }
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
    console.log("[DEBUG - BALANCE] Memulai proses fetch balance untuk merchant:", config.merchant_id);
    
    try {
        // --- 1. MENCARI TANGGAL PAYOUT TERAKHIR SEBAGAI TITIK NOL ---
        console.log("[DEBUG - BALANCE] Memanggil API Payout Gojek...");
        const payoutResp = await fetch(`https://api.gobiz.co.id/v1/merchants/payouts?page=1&per=10`, { 
            method: 'GET', headers: getGojekHeaders(config.access_token, config.device_id) 
        });
        
        let lastPayoutDateISO = "";
        let lastPayoutLabel = "Belum ada payout";

        if (payoutResp.ok) {
            const payoutData: any = await payoutResp.json();
            if (payoutData.payouts && payoutData.payouts.length > 0) {
                // Konversi tanggal created_at (format ISO dengan timezone) ke String ISO murni berakhiran 'Z' (UTC)
                lastPayoutDateISO = new Date(payoutData.payouts[0].created_at).toISOString();
                
                // Format agar cantik dibaca frontend: "29 Mei, 17:13"
                const dateObj = new Date(lastPayoutDateISO);
                lastPayoutLabel = dateObj.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB';
                
                console.log(`[DEBUG - BALANCE] Payout ditemukan! Timestamp asli: ${payoutData.payouts[0].created_at}, ISO UTC: ${lastPayoutDateISO}`);
            } else {
                console.log("[DEBUG - BALANCE] Riwayat payout kosong.");
            }
        } else {
            console.error("[DEBUG - BALANCE] Gagal fetch payout:", await payoutResp.text());
        }

        // Fallback jika tidak ada riwayat payout sama sekali
        if (!lastPayoutDateISO) {
            const { from } = getDateRange('today');
            lastPayoutDateISO = from;
            lastPayoutLabel = "Hari ini 00:00";
            console.log("[DEBUG - BALANCE] Menggunakan fallback:", lastPayoutDateISO);
        }

        // --- 2. HITUNG SALDO SETELAH WAKTU PAYOUT TERSEBUT ---
        const balancePayload = buildGojekQuery(config.merchant_id, lastPayoutDateISO);
        console.log("[DEBUG - BALANCE] Payload request jurnal:", JSON.stringify(balancePayload));
        
        const balanceResp = await fetch('https://api.gobiz.co.id/journals/search', { method: 'POST', headers: getGojekHeaders(config.access_token, config.device_id), body: JSON.stringify(balancePayload) });
        
        if (balanceResp.status === 401) {
            console.log("[DEBUG - BALANCE] Session Expired (401)");
            return c.json({ error: 'Session expired' }, 401);
        }
        
        const balanceData: any = await balanceResp.json();
        console.log(`[DEBUG - BALANCE] Ditemukan ${balanceData.hits?.length || 0} riwayat transaksi setelah payout.`);
        
        let realBalance = 0; 
        const processedBalanceIds = new Set();
        
        (balanceData.hits || []).forEach((h: any) => {
            const metaTx = h.metadata?.transaction || {};
            const orderId = metaTx.order_id || h.reference_id;
            if (!processedBalanceIds.has(orderId)) { 
                processedBalanceIds.add(orderId); 
                if (metaTx.status === 'settlement') {
                    const amount = (h.amount || metaTx.amount || 0) / 100;
                    realBalance += amount; 
                    console.log(`[DEBUG - BALANCE] + Menjumlahkan Rp ${amount} (Order: ${orderId})`);
                }
            }
        });

        console.log(`[DEBUG - BALANCE] Total Saldo Akhir: Rp ${realBalance}`);

        // --- 3. REKAP DATA: HARI INI, MINGGU INI, BULAN INI ---
        const { from: tFrom, to: tTo } = getDateRange('today');
        const { from: wFrom, to: wTo } = getDateRange('week');
        const { from: mFrom, to: mTo } = getDateRange('month');

        const today = await fetchStats(config, tFrom, tTo, 'TODAY');
        const week = await fetchStats(config, wFrom, wTo, 'WEEK');
        const month = await fetchStats(config, mFrom, mTo, 'MONTH');

        return c.json({ 
            status: 'success', 
            balance: realBalance, 
            last_payout_label: lastPayoutLabel, // Lempar string cantik ini ke UI HTML
            today, week, month
        });
    } catch (e: any) { 
        console.error("[DEBUG - BALANCE] CATCH ERROR:", e);
        return c.json({ error: e.message }, 500); 
    }
});

gobizRouter.get('/mutations', requireGoBizAuth, async (c) => {
    const config = c.get('config');
    const { from, to } = getDateRange(c.req.query('filter') || 'today');
    try {
        const payload = buildGojekQuery(config.merchant_id, from, to);
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

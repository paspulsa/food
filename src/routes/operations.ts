import { Hono } from 'hono';
import { Bindings, Variables } from '../types';

export const operationsRouter = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// 1. API: Buka Shift Kasir
operationsRouter.post('/shift/start', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json();
    const payload = c.get('jwtPayload'); 
    const cashierName = payload.name as string;

    try {
        const shiftId = 'SHF-' + crypto.randomUUID().substring(0,8).toUpperCase();
        
        // Catat Sesi Kasir
        await db.prepare(`INSERT INTO cashier_shifts (id, cashier_name, starting_cash, starting_app_balance) VALUES (?, ?, ?, ?)`).bind(shiftId, cashierName, body.start_cash || 0, body.start_app || 0).run();
        
        // Catat Absensi Staf Terpilih
        if (body.active_staff && Array.isArray(body.active_staff)) {
            for (const staffId of body.active_staff) {
                const staffInfo: any = await db.prepare("SELECT name, role FROM users WHERE id = ?").bind(staffId).first();
                if(staffInfo) {
                    await db.prepare("INSERT INTO shift_attendance (id, shift_id, staff_id, staff_name, role) VALUES (?, ?, ?, ?, ?)")
                        .bind(crypto.randomUUID(), shiftId, staffId, staffInfo.name, staffInfo.role).run();
                }
            }
        }

        // Generate Snapshot Stok Awal
        await db.prepare(`INSERT INTO shift_stock_snapshots (id, shift_id, snapshot_type, menu_item_id, item_name, stock_quantity) SELECT lower(hex(randomblob(16))), ?, 'START', id, name, stock FROM menu_items`).bind(shiftId).run();

        return c.json({ success: true, message: 'Shift berhasil dibuka!', shift_id: shiftId });
    } catch (e: any) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// 2. API: Tutup Shift Kasir
operationsRouter.post('/shift/close', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json();
    
    if(!body.shift_id) return c.json({ success: false, message: 'Shift ID tidak ditemukan' }, 400);

    try {
        // Bebaskan sisa staf yang masih aktif
        await db.prepare("UPDATE shift_attendance SET clock_out = CURRENT_TIMESTAMP, reason_left = 'Shift Ditutup Kasir', status = 'ENDED' WHERE shift_id = ? AND status = 'ACTIVE'").bind(body.shift_id).run();
        
        // Buat Snapshot Stok Akhir
        await db.prepare(`INSERT INTO shift_stock_snapshots (id, shift_id, snapshot_type, menu_item_id, item_name, stock_quantity) SELECT lower(hex(randomblob(16))), ?, 'END', id, name, stock FROM menu_items`).bind(body.shift_id).run();
        
        // Tutup Sesi Kasir
        await db.prepare("UPDATE cashier_shifts SET end_time = CURRENT_TIMESTAMP, status = 'CLOSED' WHERE id = ?").bind(body.shift_id).run();
        
        return c.json({ success: true, message: 'Laporan Penutupan Sesi berhasil di-generate!' });
    } catch (e: any) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// 3. API: Keluarkan Staf
operationsRouter.post('/shift/kick-staff', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json();

    try {
        await db.prepare("UPDATE shift_attendance SET clock_out = CURRENT_TIMESTAMP, reason_left = ?, status = 'ENDED' WHERE id = ?")
            .bind(body.reason, body.attendance_id).run();
        return c.json({ success: true, message: 'Staf berhasil diizinkan pulang.' });
    } catch (e: any) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// 4. API: Terima Pembayaran Tunai (Update Transaction & Order)
operationsRouter.post('/transactions/pay-cash', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json();

    try {
        await db.prepare("UPDATE transactions SET status = 'PAID' WHERE order_id = ?").bind(body.order_id).run();
        await db.prepare("UPDATE orders SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.order_id).run();
        return c.json({ success: true, message: 'Pembayaran Diterima' });
    } catch (e: any) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

// 5. API: Force Ubah Status Order (Oleh Kasir)
operationsRouter.post('/transactions/force-status', async (c) => {
    const db = c.env.DB;
    const body = await c.req.json();

    try {
        await db.prepare("UPDATE orders SET status = ?, kitchen_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.new_status, body.new_kitchen, body.order_id).run();
        return c.json({ success: true, message: 'Status berhasil dipaksa ubah' });
    } catch (e: any) {
        return c.json({ success: false, message: e.message }, 500);
    }
});

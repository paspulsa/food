import type { Context } from 'hono';

// Gunakan export const POST murni tanpa wrapper createRoute
export const POST = async (c: Context) => {
    try {
        // 1. Ambil request body sebagai teks murni (mencegah error JSON parse)
        const rawBody = await c.req.text();
        
        // 2. Tampilkan RAW Response murni ke Console / Real-time Logs Cloudflare
        console.log("========== RAW WEBHOOK PAYLOAD START ==========");
        console.log(rawBody);
        console.log("========== RAW WEBHOOK PAYLOAD END ==========");

        // 3. (Opsional) Jika Anda ingin menyimpannya sebentar di database untuk dicek via D1 Console
        // await (c.env as any).DB.prepare('INSERT INTO webhook_logs (payload) VALUES (?)').bind(rawBody).run();

        // 4. Balas dengan 200 OK agar bot gateway tidak melakukan spam error
        return c.json({ 
            success: true, 
            message: 'Raw webhook data captured successfully'
        }, 200);

    } catch (error: any) { 
        console.error("Kesalahan saat menangkap raw webhook:", error);
        return c.json({ success: false, message: error.message }, 500); 
    }
};

import { Hono } from 'hono';
import { Bindings } from '../types';

export const uploadRouter = new Hono<{ Bindings: Bindings }>();

uploadRouter.post('/', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as File;

  if (!file) {
    return c.json({ success: false, message: 'Tidak ada berkas yang diunggah!' }, 400);
  }

  // Membuat nama acak unik dan mendeteksi ekstensi berkas
  const extension = file.name.split('.').pop();
  const uniqueKey = `${crypto.randomUUID()}.${extension}`;
  
  // Mengonversi berkas unggahan menjadi ArrayBuffer untuk dikirim ke R2 Bucket
  const arrayBuffer = await file.arrayBuffer();

  await c.env.IMAGE_BUCKET.put(uniqueKey, arrayBuffer, {
    httpMetadata: { contentType: file.type }
  });

  // Membentuk URL publik akses gambar
  const fileUrl = `${c.env.R2_PUBLIC_URL}/${uniqueKey}`;

  return c.json({
    success: true,
    message: 'Berkas berhasil diunggah ke Cloudflare R2',
    url: fileUrl,
    fileName: uniqueKey
  });
});
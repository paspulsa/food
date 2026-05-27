import { Hono } from 'hono';
import { Bindings } from '../types';

export const uploadRouter = new Hono<{ Bindings: Bindings }>();

// Kredensial Cloudinary Anda
const CLOUD_NAME = 'dop2dlzqp';
const API_KEY = '511514329953514';
const API_SECRET = 'Pum7GsjmcrCuc0F0mJDO0stSQTw';

uploadRouter.post('/', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as File;

  if (!file) {
    return c.json({ success: false, message: 'Tidak ada berkas yang diunggah!' }, 400);
  }

  try {
    // 1. Buat Timestamp Detik Ini
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 2. Buat Signature Autentikasi Cloudinary (Web Crypto API)
    // Algoritma Wajib Cloudinary: SHA-1 dari string: timestamp={timestamp}{api_secret}
    const signatureString = `timestamp=${timestamp}${API_SECRET}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Siapkan FormData persis seperti dokumen Cloudinary REST API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    
    // (Opsional) Pisahkan di dalam folder Cloudinary agar rapi
    formData.append('folder', 'food_delivery'); 

    // 4. Lakukan POST Transmisi Biner ke Server Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json() as any;

    if (!response.ok || result.error) {
      console.error("Cloudinary Error:", result.error);
      return c.json({ success: false, message: 'Gagal mengunggah gambar ke Cloudinary' }, 500);
    }

    // 5. Kembalikan Tautan Optimal Cloudinary ke Aplikasi Klien (Frontend)
    // Parameter f_auto dan q_auto akan merampingkan gambar otomatis di CDN
    const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');

    return c.json({
      success: true,
      message: 'Berkas sukses diunggah ke Cloudinary',
      url: optimizedUrl,
      fileName: result.public_id
    });

  } catch (error: any) {
    console.error("Kesalahan Unggah:", error);
    return c.json({ success: false, message: 'Terjadi kesalahan sistem saat unggah gambar.' }, 500);
  }
});

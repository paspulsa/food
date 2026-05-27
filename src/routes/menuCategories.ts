// Buat Kategori Baru
menuCategoryRouter.post('/', async (c) => {
  const body = await c.req.json();
  const id = crypto.randomUUID();

  try {
    await c.env.DB.prepare(
      `INSERT INTO menu_categories (
        id, restaurant_id, name, description, sort_order, is_active, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.restaurant_id,
      body.name,
      body.description || null,
      body.sort_order || 0,
      body.is_active !== undefined ? body.is_active : 1,
      body.image || null
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil ditambahkan', data: { id } }, 201);
  } catch (error: any) {
    // --- LOGGING JELAS UNTUK POST ---
    console.error("=== D1 ERROR INSERT KATEGORI ===");
    console.error("Pesan Error D1:", error.message);
    console.error("Payload yang dikirim:", JSON.stringify(body, null, 2));
    console.error("================================");
    
    return c.json({ success: false, message: 'Gagal insert: ' + error.message }, 500);
  }
});

// Update Kategori
menuCategoryRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    await c.env.DB.prepare(
      `UPDATE menu_categories 
       SET name = ?, description = ?, sort_order = ?, is_active = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`
    ).bind(
      body.name,
      body.description || null,
      body.sort_order || 0,
      body.is_active !== undefined ? body.is_active : 1,
      body.image || null,
      id
    ).run();

    return c.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error: any) {
    // --- LOGGING JELAS UNTUK PUT ---
    console.error("=== D1 ERROR UPDATE KATEGORI ===");
    console.error("Target ID:", id);
    console.error("Pesan Error D1:", error.message);
    console.error("Payload yang dikirim:", JSON.stringify(body, null, 2));
    console.error("================================");
    
    return c.json({ success: false, message: 'Gagal update: ' + error.message }, 500);
  }
});

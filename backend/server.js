import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db.js';

import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Helper para salvar imagem base64
const saveBase64Image = async (base64Str) => {
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str; // Já é URL ou inválido
  
  const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

  if (IMGBB_API_KEY) {
    try {
      const base64Data = base64Str.split(',')[1];
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ image: base64Data })
      });
      const result = await response.json();
      if (result.success) {
        return result.data.url;
      }
      console.error('ImgBB Upload Error:', result);
    } catch (err) {
      console.error('Falha no upload para o ImgBB:', err);
    }
  }

  // Fallback para upload local (se não tiver chave do ImgBB)
  const matches = base64Str.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return base64Str;
  
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const filename = `img_${Date.now()}_${Math.floor(Math.random()*1000)}.${ext}`;
  
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  fs.writeFileSync(path.join('uploads', filename), data);
  
  return `/uploads/${filename}`;
};


// Middleware JWT
export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'Token não fornecido' });
  jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.userId = decoded.id;
    next();
  });
};

// Autenticação (Login)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });
    
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: 'Senha incorreta' });
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: admin.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no login' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const [hojeRows] = await db.query(`
      SELECT COUNT(*) as total_orders, SUM(total) as total_revenue
      FROM orders 
      WHERE DATE(created_at) = CURDATE() AND status != 'cancelado'
    `);
    
    const [topProducts] = await db.query(`
      SELECT product_name, SUM(quantity) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelado'
      GROUP BY product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({ hoje: hojeRows[0], topProducts });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

// ── Categories ──
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

app.post('/api/categories', verifyToken, async (req, res) => {
  const { id, name, icon } = req.body;
  try {
    await db.query('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)', [id, name, icon]);
    res.status(201).json({ id, name, icon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

app.put('/api/categories/:id', verifyToken, async (req, res) => {
  const { name, icon } = req.body;
  try {
    await db.query('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [name, icon, req.params.id]);
    res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

app.delete('/api/categories/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// ── Addons ──
app.get('/api/addons', async (req, res) => {
  try {
    const [addons] = await db.query('SELECT * FROM addons');
    const [relations] = await db.query('SELECT * FROM addon_categories');

    const formattedAddons = addons.map(addon => {
      const categoryIds = relations
        .filter(r => r.addon_id === addon.id)
        .map(r => r.category_id);
      return { ...addon, categoryIds, price: Number(addon.price) };
    });

    res.json(formattedAddons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar adicionais' });
  }
});

app.post('/api/addons', verifyToken, async (req, res) => {
  const { id, name, price, categoryIds } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('INSERT INTO addons (id, name, price) VALUES (?, ?, ?)', [id, name, price]);
    if (categoryIds && categoryIds.length > 0) {
      for (const cid of categoryIds) {
        await connection.query('INSERT INTO addon_categories (addon_id, category_id) VALUES (?, ?)', [id, cid]);
      }
    }
    await connection.commit();
    res.status(201).json({ message: 'Adicional criado com sucesso' });
  } catch (error) {
    try { await connection.rollback(); } catch (err) {}
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar adicional' });
  } finally {
    connection.release();
  }
});

app.put('/api/addons/:id', verifyToken, async (req, res) => {
  const { name, price, categoryIds } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('UPDATE addons SET name = ?, price = ? WHERE id = ?', [name, price, req.params.id]);
    await connection.query('DELETE FROM addon_categories WHERE addon_id = ?', [req.params.id]);
    if (categoryIds && categoryIds.length > 0) {
      for (const cid of categoryIds) {
        await connection.query('INSERT INTO addon_categories (addon_id, category_id) VALUES (?, ?)', [req.params.id, cid]);
      }
    }
    await connection.commit();
    res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    try { await connection.rollback(); } catch (err) {}
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar adicional' });
  } finally {
    connection.release();
  }
});

app.delete('/api/addons/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM addons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar adicional' });
  }
});

// ── Products ──
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);

    const [productAddonsRows] = await db.query(`
      SELECT pa.product_id, a.* 
      FROM product_addons pa
      JOIN addons a ON pa.addon_id = a.id
    `);

    const [productImagesRows] = await db.query(`
      SELECT * FROM product_images
    `);

    const formattedProducts = products.map(p => {
      const addons = productAddonsRows
        .filter(pa => pa.product_id === p.id)
        .map(a => ({
          id: a.id,
          name: a.name,
          price: Number(a.price)
        }));

      const images = productImagesRows
        .filter(img => img.product_id === p.id)
        .map(img => img.image_url);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        image: p.image,
        images: images.length ? images : (p.image ? [p.image] : []),
        category: p.category_id,
        addons: addons,
        isPromo: Boolean(p.is_promo),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        promoExpiry: p.promo_expiry,
        promoStock: p.promo_stock,
        orderCount: p.order_count,
        isMadeToOrder: Boolean(p.is_made_to_order)
      };
    });

    res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/products', verifyToken, async (req, res) => {
  const { id, name, description, price, image, images, category, isPromo, originalPrice, promoExpiry, promoStock, addons, isMadeToOrder } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Processa e salva as imagens
    const savedImages = await Promise.all((images || []).map(saveBase64Image));
    const mainImage = savedImages.length > 0 ? savedImages[0] : (image ? await saveBase64Image(image) : null);

    const formattedPromoExpiry = promoExpiry ? new Date(promoExpiry).toISOString().slice(0, 19).replace('T', ' ') : null;

    await connection.query(
      'INSERT INTO products (id, name, description, price, image, category_id, is_promo, original_price, promo_expiry, promo_stock, is_made_to_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, price, mainImage, category, isPromo, originalPrice || null, formattedPromoExpiry, promoStock !== undefined ? promoStock : null, isMadeToOrder || false]
    );
    
    if (savedImages && savedImages.length > 0) {
      for (const imgUrl of savedImages) {
        await connection.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [id, imgUrl]);
      }
    }

    if (addons && addons.length > 0) {
      for (const a of addons) {
        await connection.query('INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)', [id, a.id]);
      }
    }
    await connection.commit();
    res.status(201).json({ message: 'Produto criado com sucesso' });
  } catch (error) {
    try { await connection.rollback(); } catch (err) {}
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  } finally {
    connection.release();
  }
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { name, description, price, image, images, category, isPromo, originalPrice, promoExpiry, promoStock, addons, isMadeToOrder } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Processa e salva as novas imagens (mantém as que já são URLs)
    const savedImages = await Promise.all((images || []).map(saveBase64Image));
    const mainImage = savedImages.length > 0 ? savedImages[0] : (image ? await saveBase64Image(image) : null);

    const formattedPromoExpiry = promoExpiry ? new Date(promoExpiry).toISOString().slice(0, 19).replace('T', ' ') : null;

    await connection.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category_id = ?, is_promo = ?, original_price = ?, promo_expiry = ?, promo_stock = ?, is_made_to_order = ? WHERE id = ?',
      [name, description, price, mainImage, category, isPromo, originalPrice || null, formattedPromoExpiry, promoStock !== undefined ? promoStock : null, isMadeToOrder || false, req.params.id]
    );
    
    // Deleta as imagens antigas e re-insere
    await connection.query('DELETE FROM product_images WHERE product_id = ?', [req.params.id]);
    if (savedImages && savedImages.length > 0) {
      for (const imgUrl of savedImages) {
        await connection.query('INSERT INTO product_images (product_id, image_url) VALUES (?, ?)', [req.params.id, imgUrl]);
      }
    }

    await connection.query('DELETE FROM product_addons WHERE product_id = ?', [req.params.id]);
    if (addons && addons.length > 0) {
      for (const a of addons) {
        await connection.query('INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)', [req.params.id, a.id]);
      }
    }
    await connection.commit();
    res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    try { await connection.rollback(); } catch (err) {}
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  } finally {
    connection.release();
  }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// ── Loyalty ──
app.get('/api/loyalty/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM loyalty_settings WHERE id = 1');
    res.json(rows[0] || { active: 0, spent_amount: 1, points_earned: 1, points_for_discount: 10, discount_amount: 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao ler config de fidelidade' });
  }
});

app.put('/api/loyalty/settings', verifyToken, async (req, res) => {
  const { active, spent_amount, points_earned, points_for_discount, discount_amount } = req.body;
  try {
    await db.query(
      'UPDATE loyalty_settings SET active=?, spent_amount=?, points_earned=?, points_for_discount=?, discount_amount=? WHERE id=1',
      [active ? 1 : 0, spent_amount, points_earned, points_for_discount, discount_amount]
    );
    res.json({ message: 'Configurações de fidelidade atualizadas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar fidelidade' });
  }
});

app.get('/api/loyalty/customer/:cpf', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT points FROM customers WHERE cpf = ?', [req.params.cpf]);
    res.json({ points: rows.length ? rows[0].points : 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao ler saldo do cliente' });
  }
});

// ── Store Settings ──
app.get('/api/store/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM store_settings WHERE id = 1');
    res.json(rows[0] || {
      has_delivery: 1,
      has_table: 1,
      has_pickup: 1,
      accepts_pix: 1,
      accepts_cash: 1,
      accepts_card: 1,
      opening_time: "10:00",
      closing_time: "22:00",
      delivery_fee: 0.00,
      delivery_info_text: "Entregas apenas depois das 14:00"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar configurações da loja' });
  }
});

app.put('/api/store/settings', verifyToken, async (req, res) => {
  const { 
    has_delivery, has_table, has_pickup, 
    accepts_pix, accepts_cash, accepts_card, 
    opening_time, closing_time, delivery_fee, delivery_info_text 
  } = req.body;
  try {
    await db.query(
      `UPDATE store_settings SET 
        has_delivery = ?, has_table = ?, has_pickup = ?, 
        accepts_pix = ?, accepts_cash = ?, accepts_card = ?, 
        opening_time = ?, closing_time = ?, delivery_fee = ?, delivery_info_text = ? 
       WHERE id = 1`,
      [
        has_delivery ? 1 : 0, has_table ? 1 : 0, has_pickup ? 1 : 0,
        accepts_pix ? 1 : 0, accepts_cash ? 1 : 0, accepts_card ? 1 : 0,
        opening_time, closing_time, delivery_fee, delivery_info_text || "Entregas apenas depois das 14:00"
      ]
    );
    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// ── Orders ──
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    console.log(orders)
    // Para simplificar no MVP, buscamos os itens de todos os pedidos recentes e montamos a árvore
    // Numa app real, usaríamos JOINs complexos ou carregaríamos itens por pedido.
    const orderIds = orders.map(o => o.id);
    let items = [];
    let itemAddons = [];
    let timelines = [];

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      [items] = await db.query(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds);
      
      const itemIds = items.map(i => i.id);
      if (itemIds.length > 0) {
        const itemPlaceholders = itemIds.map(() => '?').join(',');
        [itemAddons] = await db.query(`SELECT * FROM order_item_addons WHERE order_item_id IN (${itemPlaceholders})`, itemIds);
      }

      [timelines] = await db.query(`SELECT * FROM order_timelines WHERE order_id IN (${placeholders}) ORDER BY timestamp ASC`, orderIds);
    }

    const formattedOrders = orders.map(o => {
      const oItems = items.filter(i => i.order_id === o.id).map(i => {
        const addons = itemAddons.filter(a => a.order_item_id === i.id).map(a => ({
          name: a.name,
          price: Number(a.price),
          quantity: a.quantity
        }));
        return {
          productName: i.product_name,
          productPrice: Number(i.product_price),
          quantity: i.quantity,
          notes: i.notes || '',
          addons
        };
      });

      const oTimeline = timelines.filter(t => t.order_id === o.id).map(t => ({
        status: t.status,
        timestamp: t.timestamp
      }));

      return {
        id: o.id,
        number: o.order_number,
        total: Number(o.total),
        consumeType: o.consume_type,
        paymentMethod: o.payment_method,
        address: o.address || '',
        mesa: o.mesa || '',
        customerWhatsApp: o.customer_whatsapp || '',
        customerCPF: o.customer_cpf || '',
        status: o.status,
        createdAt: o.created_at,
        items: oItems,
        timeline: oTimeline,
        customerName: o.customer_name || '',
        changeNeededFor: o.change_needed_for ? Number(o.change_needed_for) : undefined,
        deliveryFee: o.delivery_fee ? Number(o.delivery_fee) : 0
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

app.post('/api/orders', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // extrai dados do body baseado no formato do mock (Order)
    const { 
      id, number, consumeType, paymentMethod, address, mesa, 
      customerWhatsApp, customerCPF, status, total, items, timeline,
      usedPoints, discountAmount, customerName, changeNeededFor, deliveryFee
    } = req.body;
    const queryOrder = `
      INSERT INTO orders (id, total, consume_type, payment_method, address, mesa, customer_whatsapp, customer_cpf, status, customer_name, change_needed_for, delivery_fee) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(queryOrder, [
      id, total, consumeType, paymentMethod, address || null, mesa || null, customerWhatsApp, customerCPF || null, status, customerName || null, changeNeededFor || null, deliveryFee || 0
    ]);

    // Busca o order_number gerado pelo AUTO_INCREMENT
    const [[insertedOrder]] = await connection.query('SELECT order_number FROM orders WHERE id = ?', [id]);
    const generatedOrderNumber = insertedOrder ? insertedOrder.order_number : 1;

    // itens
    for (const item of items) {
      const queryItem = `
        INSERT INTO order_items (order_id, product_name, product_price, quantity, notes)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [resultItem] = await connection.query(queryItem, [
        id, item.productName, item.productPrice, item.quantity, item.notes
      ]);
      const orderItemId = resultItem.insertId;

      // addons do item
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const queryAddon = `
            INSERT INTO order_item_addons (order_item_id, name, price, quantity)
            VALUES (?, ?, ?, ?)
          `;
          await connection.query(queryAddon, [orderItemId, addon.name, addon.price, addon.quantity]);
        }
      }
    }

    // timeline
    if (timeline && timeline.length > 0) {
      for (const t of timeline) {
        await connection.query('INSERT INTO order_timelines (order_id, status, timestamp) VALUES (?, ?, ?)', [
          id, t.status, new Date(t.timestamp)
        ]);
      }
    } else {
       await connection.query('INSERT INTO order_timelines (order_id, status) VALUES (?, ?)', [
          id, status
        ]);
    }

    // Processamento de pontos de fidelidade
    const [settingsRows] = await connection.query('SELECT * FROM loyalty_settings WHERE id = 1');
    const settings = settingsRows[0];
    
    if (settings && Boolean(settings.active) && customerCPF) {
      // 1. Descontar pontos usados
      if (usedPoints && Number(usedPoints) > 0) {
        await connection.query(
          'UPDATE customers SET points = GREATEST(0, points - ?) WHERE cpf = ?', 
          [Number(usedPoints), customerCPF]
        );
      }
      
      // 2. Acumular novos pontos baseados no total (que já inclui o desconto)
      const spendToEarn = Number(settings.spent_amount) || 1;
      const pointsToEarnValue = Number(settings.points_earned) || 1;
      const earned = Math.floor(Number(total) / spendToEarn) * pointsToEarnValue;
      
      if (earned > 0) {
        await connection.query(
          'INSERT INTO customers (cpf, points) VALUES (?, ?) ON DUPLICATE KEY UPDATE points = points + ?', 
          [customerCPF, earned, earned]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Pedido criado com sucesso', orderNumber: generatedOrderNumber });
  } catch (error) {
    try { await connection.rollback(); } catch (err) {}
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pedido', details: error.message });
  } finally {
    connection.release();
  }
});

app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    await db.query('INSERT INTO order_timelines (order_id, status) VALUES (?, ?)', [id, status]);
    res.json({ message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Auto-inicialização da tabela de store_settings
const initDbSettings = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS \`store_settings\` (
        \`id\` INT PRIMARY KEY DEFAULT 1,
        \`has_delivery\` TINYINT DEFAULT 1,
        \`has_table\` TINYINT DEFAULT 1,
        \`has_pickup\` TINYINT DEFAULT 1,
        \`accepts_pix\` TINYINT DEFAULT 1,
        \`accepts_cash\` TINYINT DEFAULT 1,
        \`accepts_card\` TINYINT DEFAULT 1,
        \`opening_time\` VARCHAR(5) DEFAULT "10:00",
        \`closing_time\` VARCHAR(5) DEFAULT "22:00",
        \`delivery_fee\` DECIMAL(10,2) DEFAULT 0.00,
        \`delivery_info_text\` VARCHAR(255) DEFAULT "Entregas apenas depois das 14:00"
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await db.query(`
      INSERT IGNORE INTO \`store_settings\` (id, has_delivery, has_table, has_pickup, accepts_pix, accepts_cash, accepts_card, opening_time, closing_time, delivery_fee, delivery_info_text)
      VALUES (1, 1, 1, 1, 1, 1, 1, '10:00', '22:00', 0.00, 'Entregas apenas depois das 14:00');
    `);
    console.log("Banco de dados e tabela store_settings inicializados.");
  } catch (err) {
    console.error("Falha ao auto-inicializar tabela store_settings:", err);
  }
};
initDbSettings();

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
  });
}

export default app;

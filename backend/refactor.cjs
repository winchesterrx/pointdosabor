const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// 1. Imports and Server setup
content = content.replace(
  "import fs from 'fs';\nimport path from 'path';\n\ndotenv.config();\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;",
  `import fs from 'fs';\nimport path from 'path';\nimport http from 'http';\nimport { Server } from 'socket.io';\nimport jwt from 'jsonwebtoken';\nimport bcrypt from 'bcrypt';\n\ndotenv.config();\n\nconst app = express();\nconst server = http.createServer(app);\nconst io = new Server(server, { cors: { origin: '*' } });\nconst PORT = process.env.PORT || 3000;\nconst JWT_SECRET = process.env.JWT_SECRET || 'pointdosabor-secret-key-super-secure';`
);

// 2. Add verifyToken and new routes after saveBase64Image
const newRoutes = `
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
    const [hojeRows] = await db.query(\`
      SELECT COUNT(*) as total_orders, SUM(total) as total_revenue
      FROM orders 
      WHERE DATE(created_at) = CURDATE() AND status != 'cancelado'
    \`);
    
    const [topProducts] = await db.query(\`
      SELECT product_name, SUM(quantity) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelado'
      GROUP BY product_name
      ORDER BY total_sold DESC
      LIMIT 5
    \`);

    res.json({ hoje: hojeRows[0], topProducts });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});
`;

content = content.replace('// ── Categories ──', newRoutes + '\n// ── Categories ──');

// 3. Protect routes
const protectedRoutes = [
  "app.post('/api/categories'",
  "app.put('/api/categories/:id'",
  "app.delete('/api/categories/:id'",
  "app.post('/api/addons'",
  "app.put('/api/addons/:id'",
  "app.delete('/api/addons/:id'",
  "app.post('/api/products'",
  "app.put('/api/products/:id'",
  "app.delete('/api/products/:id'",
  "app.put('/api/loyalty/settings'",
  "app.put('/api/store/settings'",
  "app.put('/api/orders/:id/status'"
];

for (const route of protectedRoutes) {
  content = content.replace(route + ", async (req, res)", route + ", verifyToken, async (req, res)");
}

// 4. POST /api/orders - stock and io.emit
content = content.replace(
  "const queryItem = `\n        INSERT INTO order_items (order_id, product_name, product_price, quantity, notes)\n        VALUES (?, ?, ?, ?, ?)\n      `;",
  `// Stock reduction
      const [prodRows] = await connection.query('SELECT id, manage_stock, stock_quantity FROM products WHERE name = ?', [item.productName]);
      if (prodRows.length > 0) {
        const prod = prodRows[0];
        if (prod.manage_stock && prod.stock_quantity !== null) {
          await connection.query('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?', [item.quantity, prod.id]);
        }
      }

      const queryItem = \`
        INSERT INTO order_items (order_id, product_name, product_price, quantity, notes)
        VALUES (?, ?, ?, ?, ?)
      \`;`
);

content = content.replace(
  "await connection.commit();\n    res.status(201).json({ message: 'Pedido criado com sucesso', orderNumber: generatedOrderNumber });",
  "await connection.commit();\n    io.emit('new_order', { id, number: generatedOrderNumber, customerName, total });\n    res.status(201).json({ message: 'Pedido criado com sucesso', orderNumber: generatedOrderNumber });"
);

// 5. PUT /api/orders/:id/status - io.emit
content = content.replace(
  "await db.query('INSERT INTO order_timelines (order_id, status) VALUES (?, ?)', [id, status]);\n    res.json({ message: 'Status atualizado com sucesso' });",
  "await db.query('INSERT INTO order_timelines (order_id, status) VALUES (?, ?)', [id, status]);\n    io.emit('order_status_updated', { id, status });\n    res.json({ message: 'Status atualizado com sucesso' });"
);

// 6. server.listen
content = content.replace(
  "app.listen(PORT, () => {\n    console.log(`Backend rodando na porta ${PORT}`);\n  });",
  "server.listen(PORT, () => {\n    console.log(`Backend rodando na porta ${PORT} com WebSockets`);\n  });"
);

fs.writeFileSync('server.js', content, 'utf8');
console.log('server.js updated successfully.');

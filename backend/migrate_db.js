import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function run() {
  try {
    console.log("Adding columns to products...");
    await pool.query('ALTER TABLE `products` ADD COLUMN `manage_stock` BOOLEAN DEFAULT FALSE;');
    await pool.query('ALTER TABLE `products` ADD COLUMN `stock_quantity` INT DEFAULT NULL;');
    console.log("Products altered.");
  } catch(e) { console.log("Products alter error (maybe already exists):", e.message); }

  try {
    console.log("Creating admins table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`admins\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    await pool.query(`
      INSERT IGNORE INTO \`admins\` (\`username\`, \`password_hash\`) VALUES
      ('admin', '$2a$10$TKh8H1.PfQx37YgCzwi.ZeCw.gWj7wO59O1Y0O131R35Y442t7jTq');
    `);
    console.log("Admins table created and populated.");
  } catch(e) { console.log("Admins table error:", e.message); }

  process.exit(0);
}

run();

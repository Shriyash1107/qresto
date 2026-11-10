const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'qresto.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    restaurant_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS qr_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    short_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'single',
    destination_url TEXT,
    is_active INTEGER DEFAULT 1,
    fg_color TEXT DEFAULT '#000000',
    bg_color TEXT DEFAULT '#FFFFFF',
    logo_url TEXT,
    total_scans INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS multi_links (
    id TEXT PRIMARY KEY,
    qr_code_id TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT DEFAULT 'link',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    qr_code_id TEXT NOT NULL,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT,
    country TEXT,
    city TEXT,
    destination_url TEXT,
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
  CREATE INDEX IF NOT EXISTS idx_qr_codes_short_id ON qr_codes(short_id);
  CREATE INDEX IF NOT EXISTS idx_scans_qr_code_id ON scans(qr_code_id);
  CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at);
`);

module.exports = db;

export const SQLITE_SCHEMA_STATEMENTS = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  displayName TEXT NOT NULL,
  role TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  userId INTEGER NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  shortName TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  defaultPrice REAL NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  qty INTEGER NOT NULL,
  initialQty INTEGER NOT NULL DEFAULT 0,
  lowStockAlertMode TEXT NOT NULL DEFAULT 'off',
  lowStockAlertValue INTEGER,
  unitOfMeasure TEXT NOT NULL DEFAULT 'pc',
  active INTEGER NOT NULL,
  variants TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  blobData TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventoryLogs (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  productName TEXT NOT NULL,
  variantId TEXT,
  variantName TEXT,
  type TEXT NOT NULL,
  qty INTEGER NOT NULL,
  reference TEXT NOT NULL,
  beforeQty INTEGER NOT NULL,
  afterQty INTEGER NOT NULL,
  createdById INTEGER NOT NULL,
  createdByName TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  originalSaleId TEXT,
  lines TEXT NOT NULL,
  subtotal REAL NOT NULL,
  amountPaid REAL NOT NULL,
  changeAmount REAL NOT NULL,
  itemCount INTEGER NOT NULL,
  status TEXT NOT NULL,
  createdById INTEGER NOT NULL,
  createdByName TEXT NOT NULL,
  voidedById INTEGER,
  voidedByName TEXT,
  voidedAt TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  masterPasswordHash TEXT NOT NULL,
  autoPrint TEXT NOT NULL DEFAULT 'off',
  continuousBarcodeScanning INTEGER NOT NULL,
  vatPercentage REAL NOT NULL,
  receiptMainText TEXT NOT NULL,
  receiptAddress TEXT NOT NULL,
  receiptContactNumber TEXT NOT NULL,
  receiptTin TEXT NOT NULL,
  receiptBottomText TEXT NOT NULL,
  officialReceiptMainText TEXT NOT NULL DEFAULT 'Tofu POS',
  officialReceiptAddress TEXT NOT NULL DEFAULT '',
  officialReceiptContactNumber TEXT NOT NULL DEFAULT '',
  officialReceiptTin TEXT NOT NULL DEFAULT '',
  officialReceiptBottomText TEXT NOT NULL DEFAULT 'Thank You',
  invoiceNextNumber INTEGER NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoiceNumber TEXT NOT NULL UNIQUE,
  saleId TEXT NOT NULL,
  lines TEXT NOT NULL,
  subtotal REAL NOT NULL,
  amountPaid REAL NOT NULL,
  changeAmount REAL NOT NULL,
  vatPercentage REAL NOT NULL,
  netAmount REAL NOT NULL,
  vatAmount REAL NOT NULL,
  createdById INTEGER NOT NULL,
  createdByName TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dataArchives (
  id TEXT PRIMARY KEY,
  saleCount INTEGER NOT NULL,
  invoiceCount INTEGER NOT NULL,
  salesTotal REAL NOT NULL,
  status TEXT NOT NULL,
  archivedById INTEGER NOT NULL,
  archivedByName TEXT NOT NULL,
  restoredById INTEGER,
  restoredByName TEXT,
  restoredAt TEXT,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
`

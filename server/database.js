const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'wineshop.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- Branches / Wine Outlets
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Retail Store', -- Retail Store, Boutique Cellar, Central Warehouse
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      phone TEXT,
      email TEXT,
      license_number TEXT,
      manager_name TEXT,
      is_active INTEGER DEFAULT 1,
      is_warehouse INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT,
      description TEXT
    );

    -- Products (Wine Catalog & Spirits/Accessories)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      wine_type TEXT, -- Red, White, Rosé, Sparkling, Fortified, Dessert
      varietal TEXT,  -- Cabernet Sauvignon, Pinot Noir, Chardonnay, etc.
      vintage_year INTEGER, -- 2018, 2021, etc. (NULL for NV)
      region TEXT,    -- Bordeaux, Napa Valley, Tuscany, Rioja, Marlborough
      country TEXT,   -- France, USA, Italy, Spain, New Zealand, Australia
      bottle_size TEXT DEFAULT '750ml',
      abv REAL DEFAULT 13.5, -- Alcohol By Volume %
      unit TEXT DEFAULT 'Bottle',
      bottles_per_case INTEGER DEFAULT 12,
      cost_price REAL NOT NULL DEFAULT 0.0,
      selling_price REAL NOT NULL DEFAULT 0.0,
      wholesale_price REAL DEFAULT 0.0,
      tax_rate REAL DEFAULT 18.0, -- Liquor tax / VAT percentage
      min_stock_level INTEGER DEFAULT 10,
      description TEXT,
      tasting_notes TEXT,
      food_pairing TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Inventory per Branch
    CREATE TABLE IF NOT EXISTS branch_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 0,
      rack_location TEXT,
      batch_lot TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(branch_id, product_id)
    );

    -- Inter-branch Stock Transfers
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_no TEXT UNIQUE NOT NULL,
      from_branch_id INTEGER NOT NULL REFERENCES branches(id),
      to_branch_id INTEGER NOT NULL REFERENCES branches(id),
      status TEXT DEFAULT 'Pending', -- Pending, In Transit, Received, Cancelled
      transfer_date DATE NOT NULL,
      received_date DATE,
      notes TEXT,
      created_by TEXT DEFAULT 'Admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0.0
    );

    -- Stock Adjustments (Breakage, corked, tasting samples, shrinkage)
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adjustment_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      adjustment_type TEXT NOT NULL, -- 'IN' or 'OUT'
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL, -- Bottle Breakage, Corked/Spoiled, Sommelier Tasting, Shrinkage/Audit, Promotional Gift
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Vendors / Wineries / Distributors
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      tax_id TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      payment_terms_days INTEGER DEFAULT 30,
      opening_balance REAL DEFAULT 0.0,
      current_balance REAL DEFAULT 0.0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchases (Bills & Orders from Wineries)
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      vendor_id INTEGER NOT NULL REFERENCES vendors(id),
      supplier_invoice_no TEXT,
      purchase_date DATE NOT NULL,
      due_date DATE,
      status TEXT DEFAULT 'Received', -- Received, Ordered, Cancelled
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      paid_amount REAL DEFAULT 0.0,
      balance_amount REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      tax_rate REAL DEFAULT 0.0,
      tax_amount REAL DEFAULT 0.0,
      total_cost REAL NOT NULL
    );

    -- Customers (Retail, Corporate, Wine Club Members)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      tax_id TEXT,
      address TEXT,
      city TEXT,
      loyalty_tier TEXT DEFAULT 'Silver Cellar', -- Silver Cellar, Gold Reserve, Platinum Sommelier
      loyalty_points INTEGER DEFAULT 0,
      age_verified INTEGER DEFAULT 1, -- Mandatory 21+ compliance
      opening_balance REAL DEFAULT 0.0,
      current_balance REAL DEFAULT 0.0,
      credit_limit REAL DEFAULT 5000.0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sales Invoices (POS & Wholesale)
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      customer_id INTEGER REFERENCES customers(id),
      customer_name TEXT DEFAULT 'Walk-in Guest',
      customer_phone TEXT,
      invoice_date DATE NOT NULL,
      due_date DATE,
      invoice_type TEXT DEFAULT 'POS Counter', -- POS Counter, Wholesale/Corporate, Wine Tasting Event
      payment_method TEXT DEFAULT 'Cash', -- Cash, Credit Card, UPI / QR, Bank Transfer, Split, Account Credit
      status TEXT DEFAULT 'Paid', -- Paid, Unpaid, Partially Paid, Void
      subtotal REAL NOT NULL DEFAULT 0.0,
      discount_rate REAL DEFAULT 0.0,
      discount_amount REAL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      paid_amount REAL DEFAULT 0.0,
      balance_amount REAL DEFAULT 0.0,
      change_returned REAL DEFAULT 0.0,
      notes TEXT,
      created_by TEXT DEFAULT 'Sommelier Cashier',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      cost_price REAL DEFAULT 0.0,
      discount_amount REAL DEFAULT 0.0,
      tax_rate REAL DEFAULT 0.0,
      tax_amount REAL DEFAULT 0.0,
      line_total REAL NOT NULL
    );

    -- Bank Accounts & Cash Drawers
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_code TEXT UNIQUE NOT NULL,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_type TEXT DEFAULT 'Checking / Current', -- Checking / Current, Savings, Cash Drawer POS, Merchant Settlement
      branch_id INTEGER REFERENCES branches(id), -- NULL if corporate central account
      opening_balance REAL DEFAULT 0.0,
      current_balance REAL DEFAULT 0.0,
      currency TEXT DEFAULT 'USD',
      gl_account_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Bank Transactions (Statement & Reconciliation)
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_no TEXT UNIQUE NOT NULL,
      bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
      transaction_date DATE NOT NULL,
      type TEXT NOT NULL, -- Deposit, Withdrawal, Transfer, Bank Fee, Interest
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      reference_no TEXT,
      description TEXT,
      reconciliation_status TEXT DEFAULT 'Cleared', -- Cleared, Pending, Reconciled
      reconciliation_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Chart of Accounts (Double Entry Bookkeeping)
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
      sub_type TEXT,      -- Current Asset, Fixed Asset, Current Liability, Operating Expense, etc.
      description TEXT,
      balance REAL DEFAULT 0.0,
      is_system INTEGER DEFAULT 1
    );

    -- Journal Entries & Lines
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_no TEXT UNIQUE NOT NULL,
      entry_date DATE NOT NULL,
      branch_id INTEGER REFERENCES branches(id),
      reference_type TEXT, -- SALES_INVOICE, PURCHASE_BILL, CUSTOMER_RECEIPT, VENDOR_PAYMENT, EXPENSE, MANUAL_JOURNAL, STOCK_ADJUSTMENT
      reference_id INTEGER,
      narration TEXT,
      total_debit REAL NOT NULL,
      total_credit REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
      debit REAL DEFAULT 0.0,
      credit REAL DEFAULT 0.0,
      notes TEXT
    );

    -- Customer Receipts (Money received from sales or account settlement)
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      customer_id INTEGER REFERENCES customers(id),
      sales_invoice_id INTEGER REFERENCES sales_invoices(id),
      bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
      receipt_date DATE NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL, -- Cash, Credit Card, Bank Transfer, UPI
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Vendor Payments & Operating Expenses
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_no TEXT UNIQUE NOT NULL,
      branch_id INTEGER NOT NULL REFERENCES branches(id),
      vendor_id INTEGER REFERENCES vendors(id),
      purchase_id INTEGER REFERENCES purchases(id),
      bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
      expense_account_id INTEGER REFERENCES chart_of_accounts(id),
      payment_date DATE NOT NULL,
      amount REAL NOT NULL,
      payment_mode TEXT NOT NULL, -- Cash, Check, Wire Transfer, Credit Card
      payment_type TEXT NOT NULL, -- 'Vendor Bill Payment' or 'Operating Expense'
      payee_name TEXT,
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  db,
  initDatabase
};

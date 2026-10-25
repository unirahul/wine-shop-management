const { db, initDatabase } = require('./database');
const AccountingEngine = require('./services/accountingEngine');

function seedDatabase() {
  initDatabase();

  const branchCount = db.prepare('SELECT COUNT(*) as c FROM branches').get().c;
  if (branchCount > 0) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('Seeding Wine Shop ERP Database...');

  // 1. Chart of Accounts
  const coa = [
    { code: '1010', name: 'Petty Cash & POS Cash Drawers', type: 'Asset', sub_type: 'Current Asset', description: 'Counter cash across all wine shop branches' },
    { code: '1020', name: 'Operating Bank Accounts', type: 'Asset', sub_type: 'Current Asset', description: 'Commercial checking and savings accounts' },
    { code: '1030', name: 'Credit Card Merchant Settlement', type: 'Asset', sub_type: 'Current Asset', description: 'Undeposited card gateway funds' },
    { code: '1100', name: 'Accounts Receivable (Trade Debtors)', type: 'Asset', sub_type: 'Current Asset', description: 'Amounts due from corporate/wholesale customers' },
    { code: '1200', name: 'Wine & Spirits Inventory', type: 'Asset', sub_type: 'Current Asset', description: 'Stock on hand in cellars and retail floors' },
    { code: '1250', name: 'Goods in Transit (Branch Transfers)', type: 'Asset', sub_type: 'Current Asset', description: 'Wine moving between branches' },
    { code: '1500', name: 'Cellar Equipment & Climate Units', type: 'Asset', sub_type: 'Fixed Asset', description: 'Temperature controlled cellars and fixtures' },

    { code: '2010', name: 'Accounts Payable (Trade Creditors)', type: 'Liability', sub_type: 'Current Liability', description: 'Amounts owed to wineries, importers, distributors' },
    { code: '2020', name: 'State Liquor Excise Tax Payable', type: 'Liability', sub_type: 'Current Liability', description: 'Liquor excise duty collected' },
    { code: '2030', name: 'Sales Tax / VAT Payable', type: 'Liability', sub_type: 'Current Liability', description: 'Sales tax collected on retail' },
    { code: '2050', name: 'Customer Advances & Wine Club Deposits', type: 'Liability', sub_type: 'Current Liability', description: 'Prepayments for futures and club allocations' },

    { code: '3010', name: "Owner's Capital", type: 'Equity', sub_type: 'Equity', description: 'Initial invested capital' },
    { code: '3020', name: 'Retained Earnings', type: 'Equity', sub_type: 'Equity', description: 'Accumulated profits retained in wine business' },

    { code: '4010', name: 'Retail Wine & Spirits Sales', type: 'Revenue', sub_type: 'Operating Revenue', description: 'Counter POS and walk-in sales' },
    { code: '4020', name: 'Wholesale & Restaurant Wine Sales', type: 'Revenue', sub_type: 'Operating Revenue', description: 'B2B allocations to restaurants and hotels' },
    { code: '4030', name: 'Wine Tasting & Sommelier Events', type: 'Revenue', sub_type: 'Other Revenue', description: 'Tasting room flights and masterclasses' },
    { code: '4040', name: 'Corkage & Storage Fees', type: 'Revenue', sub_type: 'Other Revenue', description: 'Private cellar locker and corkage fees' },

    { code: '5010', name: 'Cost of Wine Sold (COGS)', type: 'Expense', sub_type: 'Cost of Goods Sold', description: 'Direct acquisition cost of sold bottles' },
    { code: '5020', name: 'Inbound Freight & Customs Duties', type: 'Expense', sub_type: 'Cost of Goods Sold', description: 'Shipping & import duties from European wineries' },
    { code: '5030', name: 'Wine Breakage, Spoilage & Corked Loss', type: 'Expense', sub_type: 'Cost of Goods Sold', description: 'Damaged bottles, cork taint, oxidized wine write-offs' },

    { code: '6010', name: 'Cellar Climate Control & Electricity', type: 'Expense', sub_type: 'Operating Expense', description: 'Chilling, humidity control and energy bills' },
    { code: '6020', name: 'Store Rent & Cellar Lease', type: 'Expense', sub_type: 'Operating Expense', description: 'Retail premises lease' },
    { code: '6030', name: 'Sommelier & Staff Salaries', type: 'Expense', sub_type: 'Operating Expense', description: 'Store managers and certified sommeliers' },
    { code: '6040', name: 'Liquor Licenses & Regulatory Compliance', type: 'Expense', sub_type: 'Operating Expense', description: 'State ABC liquor licensing fees' },
    { code: '6050', name: 'Card Processing & Banking Fees', type: 'Expense', sub_type: 'Operating Expense', description: 'POS merchant processing fees' },
    { code: '6060', name: 'Packaging, Gift Wooden Crates & Bags', type: 'Expense', sub_type: 'Operating Expense', description: 'Premium wooden boxes, gift sleeves, bubble wraps' }
  ];

  const insertCoa = db.prepare('INSERT INTO chart_of_accounts (code, name, type, sub_type, description, balance) VALUES (?, ?, ?, ?, ?, ?)');
  for (const c of coa) {
    insertCoa.run(c.code, c.name, c.type, c.sub_type, c.description, 0);
  }

  // 2. Branches
  const branches = [
    { code: 'BR-01', name: 'Grand Cru Cellars - Downtown Flagship', type: 'Retail Store & Tasting Lounge', address: '450 Fifth Avenue', city: 'New York', state: 'NY', zip_code: '10018', phone: '+1 212-555-0144', email: 'downtown@grandcruwines.com', license_number: 'NY-LIQ-884910', manager_name: 'Jean-Luc Moreau', is_warehouse: 0 },
    { code: 'BR-02', name: 'Vintage Reserve - Uptown Galleria', type: 'Retail Wine & Spirits Boutique', address: '9600 Wilshire Blvd', city: 'Beverly Hills', state: 'CA', zip_code: '90212', phone: '+1 310-555-0182', email: 'uptown@grandcruwines.com', license_number: 'CA-ABC-491022', manager_name: 'Victoria Sterling', is_warehouse: 0 },
    { code: 'BR-03', name: 'Sommelier Vault - Central Distribution & Warehouse', type: 'Central Warehouse & Hub', address: '1200 Silverado Trail', city: 'Napa', state: 'CA', zip_code: '94558', phone: '+1 707-555-0199', email: 'logistics@grandcruwines.com', license_number: 'CA-WHS-229104', manager_name: 'Robert Mondale', is_warehouse: 1 },
    { code: 'BR-04', name: 'Boutique Cellar - Marina Bay Harbor', type: 'Boutique Waterfront Store', address: '300 Ocean Drive', city: 'Miami', state: 'FL', zip_code: '33139', phone: '+1 305-555-0118', email: 'marina@grandcruwines.com', license_number: 'FL-DBPR-718290', manager_name: 'Camilla Rodriguez', is_warehouse: 0 }
  ];

  const insertBranch = db.prepare(`
    INSERT INTO branches (code, name, type, address, city, state, zip_code, phone, email, license_number, manager_name, is_warehouse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of branches) {
    insertBranch.run(b.code, b.name, b.type, b.address, b.city, b.state, b.zip_code, b.phone, b.email, b.license_number, b.manager_name, b.is_warehouse);
  }

  // 3. Bank Accounts
  const bankAccs = [
    { code: 'BNK-CHASE-01', name: 'Chase Commercial Operating', bank_name: 'JPMorgan Chase', number: '9841-2094-1182', type: 'Checking / Current', branch_id: null, gl: '1020', balance: 145000.0 },
    { code: 'BNK-WF-02', name: 'Wells Fargo Liquidity Reserve', bank_name: 'Wells Fargo', number: '4481-9920-3301', type: 'Savings', branch_id: null, gl: '1020', balance: 85000.0 },
    { code: 'CASH-BR01', name: 'Downtown POS Cash Drawer', bank_name: 'In-Store Safe', number: 'SAFE-DT-01', type: 'Cash Drawer POS', branch_id: 1, gl: '1010', balance: 3500.0 },
    { code: 'CASH-BR02', name: 'Uptown POS Cash Drawer', bank_name: 'In-Store Safe', number: 'SAFE-UP-02', type: 'Cash Drawer POS', branch_id: 2, gl: '1010', balance: 2800.0 },
    { code: 'CASH-BR04', name: 'Marina POS Cash Drawer', bank_name: 'In-Store Safe', number: 'SAFE-MB-04', type: 'Cash Drawer POS', branch_id: 4, gl: '1010', balance: 2100.0 },
    { code: 'GATEWAY-STRIPE', name: 'Credit Card Merchant Settlement', bank_name: 'Stripe Payments', number: 'ACCT-STRIPE-MERCHANT', type: 'Merchant Settlement', branch_id: null, gl: '1030', balance: 18450.0 }
  ];

  const insertBank = db.prepare(`
    INSERT INTO bank_accounts (account_code, account_name, bank_name, account_number, account_type, branch_id, gl_account_id, current_balance, opening_balance)
    VALUES (?, ?, ?, ?, ?, ?, (SELECT id FROM chart_of_accounts WHERE code = ?), ?, ?)
  `);
  for (const b of bankAccs) {
    insertBank.run(b.code, b.name, b.bank_name, b.number, b.type, b.branch_id, b.gl, b.balance, b.balance);
  }

  // 4. Categories
  const categories = [
    { name: 'Red Wine', slug: 'red-wine', description: 'Full-bodied, medium, and light reds' },
    { name: 'White Wine', slug: 'white-wine', description: 'Crisp, aromatic, and oaked whites' },
    { name: 'Rosé Wine', slug: 'rose-wine', description: 'Fresh, dry and floral rosés' },
    { name: 'Champagne & Sparkling', slug: 'champagne-sparkling', description: 'Traditional method champagnes and prosecco' },
    { name: 'Fortified & Dessert Wine', slug: 'fortified-dessert', description: 'Ports, sherries, sauternes and ice wines' },
    { name: 'Sommelier Accessories', slug: 'accessories', description: 'Crystal decanters, corkscrews and wine chillers' }
  ];
  const insertCat = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
  for (const c of categories) {
    insertCat.run(c.name, c.slug, c.description);
  }

  // 5. Products (Wines)
  const wines = [
    {
      sku: 'WINE-FRA-001', barcode: '325869100101', name: 'Château Margaux Premier Grand Cru Classé',
      category_id: 1, wine_type: 'Red', varietal: 'Cabernet Sauvignon / Merlot', vintage_year: 2018,
      region: 'Margaux, Bordeaux', country: 'France', bottle_size: '750ml', abv: 14.0,
      cost_price: 520.00, selling_price: 850.00, wholesale_price: 720.00, tax_rate: 18.0, min_stock_level: 6,
      description: 'Legendary First Growth Bordeaux boasting silky tannins, crushed violets, cassis, and black truffles.',
      tasting_notes: 'Blackcurrant, cedarwood, violet perfume, graphite, seamlessly fine-grained tannins.',
      food_pairing: 'Prime Ribeye, Roast Venison, Aged Comté Cheese'
    },
    {
      sku: 'WINE-USA-002', barcode: '085000100202', name: 'Caymus Vineyards Cabernet Sauvignon',
      category_id: 1, wine_type: 'Red', varietal: 'Cabernet Sauvignon', vintage_year: 2021,
      region: 'Napa Valley, California', country: 'USA', bottle_size: '750ml', abv: 14.6,
      cost_price: 58.00, selling_price: 98.00, wholesale_price: 82.00, tax_rate: 18.0, min_stock_level: 15,
      description: 'Rich, opulent Napa Cabernet with plush layers of dark berries, French oak vanilla, and cacao.',
      tasting_notes: 'Ripe blackberry, dark cherry, warm vanilla, toasted oak, velvety finish.',
      food_pairing: 'Braised Beef Short Ribs, Grilled Porterhouse'
    },
    {
      sku: 'WINE-NZL-003', barcode: '941400100303', name: 'Cloudy Bay Sauvignon Blanc',
      category_id: 2, wine_type: 'White', varietal: 'Sauvignon Blanc', vintage_year: 2023,
      region: 'Marlborough', country: 'New Zealand', bottle_size: '750ml', abv: 13.0,
      cost_price: 19.50, selling_price: 34.00, wholesale_price: 27.00, tax_rate: 18.0, min_stock_level: 24,
      description: 'The global benchmark for vibrant Marlborough Sauvignon Blanc with citrus zest and passionfruit punch.',
      tasting_notes: 'Grapefruit, lime leaf, passionfruit, lemongrass, flinty mineral finish.',
      food_pairing: 'Fresh Oysters, Goat Cheese Crostini, Grilled Asparagus'
    },
    {
      sku: 'WINE-FRA-004', barcode: '318537100404', name: 'Dom Pérignon Vintage Brut Champagne',
      category_id: 4, wine_type: 'Sparkling', varietal: 'Chardonnay / Pinot Noir', vintage_year: 2013,
      region: 'Épernay, Champagne', country: 'France', bottle_size: '750ml', abv: 12.5,
      cost_price: 165.00, selling_price: 265.00, wholesale_price: 220.00, tax_rate: 18.0, min_stock_level: 8,
      description: 'Prestigious Champagne icon offering brioche complexity, delicate white floral notes, and explosive effervescence.',
      tasting_notes: 'Toasted brioche, roasted almond, mirabelle plum, smoky chalk minerality.',
      food_pairing: 'Caviar, Lobster Thermidor, Truffled Risotto'
    },
    {
      sku: 'WINE-ITA-005', barcode: '800100100505', name: 'Barolo DOCG Pio Cesare',
      category_id: 1, wine_type: 'Red', varietal: 'Nebbiolo', vintage_year: 2019,
      region: 'Piedmont', country: 'Italy', bottle_size: '750ml', abv: 14.5,
      cost_price: 52.00, selling_price: 88.00, wholesale_price: 74.00, tax_rate: 18.0, min_stock_level: 12,
      description: 'Classic Piedmontese masterwork with tar and roses bouquet, muscular structure and aristocratic elegance.',
      tasting_notes: 'Dried red cherries, dried rose petals, licorice, leather, firm muscular tannins.',
      food_pairing: 'Osso Buco, White Truffle Tagliolini, Braised Veal'
    },
    {
      sku: 'WINE-FRA-006', barcode: '350100100606', name: 'Château d’Esclans Whispering Angel Rosé',
      category_id: 3, wine_type: 'Rosé', varietal: 'Grenache / Cinsault / Rolle', vintage_year: 2023,
      region: 'Côtes de Provence', country: 'France', bottle_size: '750ml', abv: 13.0,
      cost_price: 14.00, selling_price: 25.00, wholesale_price: 19.50, tax_rate: 18.0, min_stock_level: 30,
      description: 'The epitome of Provence dry Rosé. Pale coral pink, bone dry, fresh summer red berries and herbal breeze.',
      tasting_notes: 'Wild strawberry, white peach, honeydew melon, crisp salinity.',
      food_pairing: 'Salade Niçoise, Grilled Sea Bass, Charcuterie'
    },
    {
      sku: 'WINE-FRA-007', barcode: '353100100707', name: 'Louis Jadot Meursault White Burgundy',
      category_id: 2, wine_type: 'White', varietal: 'Chardonnay', vintage_year: 2021,
      region: 'Côte de Beaune, Burgundy', country: 'France', bottle_size: '750ml', abv: 13.5,
      cost_price: 46.00, selling_price: 78.00, wholesale_price: 64.00, tax_rate: 18.0, min_stock_level: 10,
      description: 'Rich, hazelnut-scented Burgundy Chardonnay aged in French oak with sublime balance and racy acidity.',
      tasting_notes: 'Roasted hazelnuts, yellow apple, clarified butter, crushed limestone.',
      food_pairing: 'Pan-seared Scallops, Dover Sole Meunière, Roast Chicken'
    },
    {
      sku: 'WINE-ITA-008', barcode: '802100100808', name: 'Antinori Tignanello Toscana IGT',
      category_id: 1, wine_type: 'Red', varietal: 'Sangiovese / Cabernet', vintage_year: 2020,
      region: 'Tuscany', country: 'Italy', bottle_size: '750ml', abv: 14.5,
      cost_price: 95.00, selling_price: 160.00, wholesale_price: 135.00, tax_rate: 18.0, min_stock_level: 10,
      description: 'The legendary trailblazing Super Tuscan. Deep ruby, intensely aromatic with sour cherry, tobacco, and balsamic lift.',
      tasting_notes: 'Ripe plum, sweet spice, dark chocolate, tobacco leaf, silky persistent finish.',
      food_pairing: 'Bistecca alla Fiorentina, Wild Boar Ragu'
    },
    {
      sku: 'WINE-PRT-009', barcode: '560100100909', name: 'Taylor Fladgate 20 Year Old Tawny Port',
      category_id: 5, wine_type: 'Fortified', varietal: 'Touriga Nacional Blend', vintage_year: null,
      region: 'Douro Valley', country: 'Portugal', bottle_size: '750ml', abv: 20.0,
      cost_price: 36.00, selling_price: 62.00, wholesale_price: 49.00, tax_rate: 18.0, min_stock_level: 8,
      description: 'Matured for two decades in seasoned oak casks, showing opulent nutty fig nuances and silky butterscotch.',
      tasting_notes: 'Dried fig, prune, toasted walnuts, butterscotch, orange peel zest.',
      food_pairing: 'Stilton Blue Cheese, Crème Brûlée, Dark Chocolate Truffles'
    },
    {
      sku: 'WINE-USA-010', barcode: '098100101010', name: 'Opus One Proprietary Red Blend',
      category_id: 1, wine_type: 'Red', varietal: 'Cabernet Sauvignon / Petit Verdot', vintage_year: 2019,
      region: 'Oakville, Napa Valley', country: 'USA', bottle_size: '750ml', abv: 14.5,
      cost_price: 275.00, selling_price: 440.00, wholesale_price: 360.00, tax_rate: 18.0, min_stock_level: 4,
      description: 'The iconic joint venture between Baron Philippe de Rothschild and Robert Mondavi. Absolute harmonic perfection.',
      tasting_notes: 'Blackberry coulis, mocha, forest floor, cassis, fine velvety tannins.',
      food_pairing: 'Wagyu Tenderloin, Roasted Duck Breast'
    },
    {
      sku: 'ACC-011', barcode: '778100101111', name: 'Riedel Performance Crystal Decanter & Aerator',
      category_id: 6, wine_type: 'Accessories', varietal: 'Handmade Crystal Glass', vintage_year: null,
      region: 'Kufstein', country: 'Austria', bottle_size: '1.4L', abv: 0.0,
      cost_price: 48.00, selling_price: 89.00, wholesale_price: 68.00, tax_rate: 10.0, min_stock_level: 6,
      description: 'Mouth-blown lead-free Austrian crystal decanter designed to maximize wine oxygenation.',
      tasting_notes: 'N/A',
      food_pairing: 'N/A'
    },
    {
      sku: 'WINE-FRA-012', barcode: '304961101212', name: 'Veuve Clicquot Ponsardin Yellow Label Brut',
      category_id: 4, wine_type: 'Sparkling', varietal: 'Pinot Noir / Chardonnay', vintage_year: null,
      region: 'Reims, Champagne', country: 'France', bottle_size: '750ml', abv: 12.0,
      cost_price: 42.00, selling_price: 69.00, wholesale_price: 55.00, tax_rate: 18.0, min_stock_level: 36,
      description: 'World-renowned iconic Champagne with yellow fruit freshness, vanilla hints and signature crisp acidity.',
      tasting_notes: 'Ripe pear, apple compote, warm brioche, persistent fine mousse.',
      food_pairing: 'Smoked Salmon Canapés, Parmesan Crisps, Fish and Chips'
    }
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (sku, barcode, name, category_id, wine_type, varietal, vintage_year, region, country, bottle_size, abv, cost_price, selling_price, wholesale_price, tax_rate, min_stock_level, description, tasting_notes, food_pairing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prodIds = [];
  for (const w of wines) {
    const res = insertProd.run(w.sku, w.barcode, w.name, w.category_id, w.wine_type, w.varietal, w.vintage_year, w.region, w.country, w.bottle_size, w.abv, w.cost_price, w.selling_price, w.wholesale_price, w.tax_rate, w.min_stock_level, w.description, w.tasting_notes, w.food_pairing);
    prodIds.push(res.lastInsertRowid);
  }

  // 6. Branch Inventory distribution
  const insertInv = db.prepare(`
    INSERT INTO branch_inventory (branch_id, product_id, quantity, rack_location, batch_lot)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Distribute stock across branches:
  // Branch 1 (Downtown Flagship): Active store (quantities 15-45)
  // Branch 2 (Uptown Galleria): Boutique store (quantities 8-30)
  // Branch 3 (Central Warehouse): High volume stock (quantities 60-150)
  // Branch 4 (Marina): Waterfront store (quantities 10-25)
  const stockPatterns = [
    { branchId: 1, base: 24, rack: 'Rack A-Cellar 1' },
    { branchId: 2, base: 14, rack: 'Boutique Display 2' },
    { branchId: 3, base: 95, rack: 'Warehouse Pallet Bay 4' },
    { branchId: 4, base: 16, rack: 'Marina Rack C' }
  ];

  for (let pIndex = 0; pIndex < prodIds.length; pIndex++) {
    const pId = prodIds[pIndex];
    for (const sp of stockPatterns) {
      // High value wines (like Margaux or Opus One) have lower quantities
      let qty = sp.base;
      if (pIndex === 0) qty = Math.max(3, Math.round(sp.base * 0.25)); // Margaux
      if (pIndex === 9) qty = Math.max(2, Math.round(sp.base * 0.3));  // Opus One
      if (pIndex === 2) qty = sp.base * 2; // Cloudy Bay
      if (pIndex === 5) qty = Math.round(sp.base * 1.8); // Whispering Angel
      insertInv.run(sp.branchId, pId, qty, `${sp.rack}-Bin-${pIndex + 1}`, `LOT-2026-${100 + pIndex}`);
    }
  }

  // 7. Vendors / Importers
  const vendors = [
    { code: 'VND-001', name: 'Bordeaux Grands Crus & Domaines SAS', contact: 'Philippe Laurent', phone: '+33 5 56 00 22 11', email: 'orders@bordeauxgrandscrus.fr', address: '14 Quai des Chartrons', city: 'Bordeaux', country: 'France', days: 45, balance: 14500.0 },
    { code: 'VND-002', name: 'Napa Valley Direct Wine Distributors', contact: 'Sarah Jenkins', phone: '+1 707-555-4819', email: 'distribution@napadirect.com', address: '840 Gateway Road', city: 'Napa', country: 'USA', days: 30, balance: 8200.0 },
    { code: 'VND-003', name: 'Consorzio Vini Pregiati Italiani SRL', contact: 'Matteo Rossi', phone: '+39 055 239 8812', email: 'export@vinipregiati.it', address: 'Via della Vigna Nuova 18', city: 'Florence', country: 'Italy', days: 30, balance: 6400.0 },
    { code: 'VND-004', name: 'Moët Hennessy Diageo Alliance', contact: 'Claire Fontaine', phone: '+1 212-555-7730', email: 'commercial@mhdalliance.com', address: '85 10th Ave', city: 'New York', country: 'USA', days: 30, balance: 12800.0 }
  ];

  const insertVendor = db.prepare(`
    INSERT INTO vendors (code, name, contact_person, phone, email, address, city, country, payment_terms_days, opening_balance, current_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const v of vendors) {
    insertVendor.run(v.code, v.name, v.contact, v.phone, v.email, v.address, v.city, v.country, v.days, v.balance, v.balance);
  }

  // 8. Customers
  const customers = [
    { code: 'CUST-001', name: 'Arthur Sterling', phone: '+1 212-555-0192', email: 'arthur.sterling@manhattanadvisors.com', city: 'New York', tier: 'Platinum Sommelier', points: 1450, balance: 0.0, limit: 10000.0 },
    { code: 'CUST-002', name: 'The Grand View Bistro & Lounge', phone: '+1 212-555-8841', email: 'sommelier@grandviewbistro.com', city: 'New York', tier: 'Corporate Wholesale', points: 3800, balance: 4250.0, limit: 25000.0 },
    { code: 'CUST-003', name: 'Eleanor Vance', phone: '+1 310-555-4422', email: 'eleanor.vance@beverlyhills.net', city: 'Beverly Hills', tier: 'Gold Reserve', points: 820, balance: 0.0, limit: 5000.0 },
    { code: 'CUST-004', name: 'Dr. Julian Thorne', phone: '+1 305-555-7719', email: 'jthorne@miamihealth.org', city: 'Miami', tier: 'Silver Cellar', points: 340, balance: 0.0, limit: 3000.0 }
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (code, name, phone, email, city, loyalty_tier, loyalty_points, current_balance, credit_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of customers) {
    insertCustomer.run(c.code, c.name, c.phone, c.email, c.city, c.tier, c.points, c.balance, c.limit);
  }

  // 9. Sample Sales Invoices & Automated Accounting Postings
  const sampleSales = [
    {
      invoice_no: 'INV-2026-1001', branch_id: 1, customer_id: 1, customer_name: 'Arthur Sterling',
      customer_phone: '+1 212-555-0192', invoice_date: '2026-10-22', invoice_type: 'POS Counter',
      payment_method: 'Credit Card', status: 'Paid', subtotal: 948.00, discount_amount: 50.00,
      tax_amount: 161.64, total_amount: 1059.64, paid_amount: 1059.64, balance_amount: 0.00,
      bank_id: 6, // Stripe / Card Gateway
      items: [
        { product_id: 1, product_name: 'Château Margaux Premier Grand Cru Classé', quantity: 1, unit_price: 850.00, cost_price: 520.00, tax_rate: 18.0, tax_amount: 153.00, line_total: 850.00 },
        { product_id: 2, product_name: 'Caymus Vineyards Cabernet Sauvignon', quantity: 1, unit_price: 98.00, cost_price: 58.00, tax_rate: 18.0, tax_amount: 17.64, line_total: 98.00 }
      ]
    },
    {
      invoice_no: 'INV-2026-1002', branch_id: 1, customer_id: 2, customer_name: 'The Grand View Bistro & Lounge',
      customer_phone: '+1 212-555-8841', invoice_date: '2026-10-23', invoice_type: 'Wholesale/Corporate',
      payment_method: 'Account Credit', status: 'Partially Paid', subtotal: 3600.00, discount_amount: 200.00,
      tax_amount: 612.00, total_amount: 4012.00, paid_amount: 1500.00, balance_amount: 2512.00,
      bank_id: 1, // Chase Checking
      items: [
        { product_id: 3, product_name: 'Cloudy Bay Sauvignon Blanc', quantity: 60, unit_price: 27.00, cost_price: 19.50, tax_rate: 18.0, tax_amount: 291.60, line_total: 1620.00 },
        { product_id: 6, product_name: 'Château d’Esclans Whispering Angel Rosé', quantity: 60, unit_price: 19.50, cost_price: 14.00, tax_rate: 18.0, tax_amount: 210.60, line_total: 1170.00 },
        { product_id: 12, product_name: 'Veuve Clicquot Ponsardin Yellow Label Brut', quantity: 12, unit_price: 55.00, cost_price: 42.00, tax_rate: 18.0, tax_amount: 118.80, line_total: 660.00 }
      ]
    },
    {
      invoice_no: 'INV-2026-1003', branch_id: 2, customer_id: 3, customer_name: 'Eleanor Vance',
      customer_phone: '+1 310-555-4422', invoice_date: '2026-10-24', invoice_type: 'POS Counter',
      payment_method: 'Cash', status: 'Paid', subtotal: 353.00, discount_amount: 0.00,
      tax_amount: 63.54, total_amount: 416.54, paid_amount: 416.54, balance_amount: 0.00,
      bank_id: 4, // Uptown Cash Drawer
      items: [
        { product_id: 4, product_name: 'Dom Pérignon Vintage Brut Champagne', quantity: 1, unit_price: 265.00, cost_price: 165.00, tax_rate: 18.0, tax_amount: 47.70, line_total: 265.00 },
        { product_id: 5, product_name: 'Barolo DOCG Pio Cesare', quantity: 1, unit_price: 88.00, cost_price: 52.00, tax_rate: 18.0, tax_amount: 15.84, line_total: 88.00 }
      ]
    }
  ];

  const insertInvSQL = db.prepare(`
    INSERT INTO sales_invoices (invoice_no, branch_id, customer_id, customer_name, customer_phone, invoice_date, invoice_type, payment_method, status, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertInvItemSQL = db.prepare(`
    INSERT INTO sales_invoice_items (invoice_id, product_id, product_name, quantity, unit_price, cost_price, tax_rate, tax_amount, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of sampleSales) {
    const res = insertInvSQL.run(s.invoice_no, s.branch_id, s.customer_id, s.customer_name, s.customer_phone, s.invoice_date, s.invoice_type, s.payment_method, s.status, s.subtotal, s.discount_amount, s.tax_amount, s.total_amount, s.paid_amount, s.balance_amount);
    const invoiceId = res.lastInsertRowid;
    for (const it of s.items) {
      insertInvItemSQL.run(invoiceId, it.product_id, it.product_name, it.quantity, it.unit_price, it.cost_price, it.tax_rate, it.tax_amount, it.line_total);
    }
    // Post double entry journal
    AccountingEngine.postSalesInvoice({ id: invoiceId, ...s }, s.items, s.bank_id);
  }

  // 10. Sample Purchase Bill
  const samplePurchase = {
    purchase_no: 'PO-2026-0045', branch_id: 3, vendor_id: 1, supplier_invoice_no: 'FAC-BGC-8831',
    purchase_date: '2026-10-15', due_date: '2026-11-30', status: 'Received',
    subtotal: 10400.00, tax_amount: 1872.00, total_amount: 12272.00, paid_amount: 6000.00, balance_amount: 6272.00
  };
  const purRes = db.prepare(`
    INSERT INTO purchases (purchase_no, branch_id, vendor_id, supplier_invoice_no, purchase_date, due_date, status, subtotal, tax_amount, total_amount, paid_amount, balance_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    samplePurchase.purchase_no, samplePurchase.branch_id, samplePurchase.vendor_id, samplePurchase.supplier_invoice_no,
    samplePurchase.purchase_date, samplePurchase.due_date, samplePurchase.status, samplePurchase.subtotal,
    samplePurchase.tax_amount, samplePurchase.total_amount, samplePurchase.paid_amount, samplePurchase.balance_amount
  );
  const purchaseId = purRes.lastInsertRowid;
  db.prepare(`
    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, tax_amount, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(purchaseId, 1, 20, 520.00, 18.0, 1872.00, 10400.00);

  AccountingEngine.postPurchaseBill({ id: purchaseId, ...samplePurchase });

  // 11. Sample Customer Receipts
  const sampleReceipt = {
    receipt_no: 'REC-2026-0031', branch_id: 1, customer_id: 2, sales_invoice_id: 2,
    bank_account_id: 1, receipt_date: '2026-10-24', amount: 1500.00, payment_mode: 'Bank Transfer',
    reference_no: 'WIRE-BISTRO-9912', notes: 'Advance partial clearance of INV-2026-1002'
  };
  const recRes = db.prepare(`
    INSERT INTO receipts (receipt_no, branch_id, customer_id, sales_invoice_id, bank_account_id, receipt_date, amount, payment_mode, reference_no, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sampleReceipt.receipt_no, sampleReceipt.branch_id, sampleReceipt.customer_id, sampleReceipt.sales_invoice_id,
    sampleReceipt.bank_account_id, sampleReceipt.receipt_date, sampleReceipt.amount, sampleReceipt.payment_mode,
    sampleReceipt.reference_no, sampleReceipt.notes
  );
  AccountingEngine.postCustomerReceipt({ id: recRes.lastInsertRowid, ...sampleReceipt }, sampleReceipt.bank_account_id);

  // 12. Sample Vendor Payment & Operating Expense
  const sampleVendorPay = {
    payment_no: 'PAY-2026-0019', branch_id: 3, vendor_id: 1, purchase_id: purchaseId,
    bank_account_id: 1, payment_date: '2026-10-20', amount: 6000.00, payment_mode: 'Wire Transfer',
    payment_type: 'Vendor Bill Payment', payee_name: 'Bordeaux Grands Crus', reference_no: 'SWIFT-FR7748102',
    notes: 'Partial wire payment for container wine shipment PO-2026-0045'
  };
  const payRes1 = db.prepare(`
    INSERT INTO payments (payment_no, branch_id, vendor_id, purchase_id, bank_account_id, payment_date, amount, payment_mode, payment_type, payee_name, reference_no, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sampleVendorPay.payment_no, sampleVendorPay.branch_id, sampleVendorPay.vendor_id, sampleVendorPay.purchase_id,
    sampleVendorPay.bank_account_id, sampleVendorPay.payment_date, sampleVendorPay.amount, sampleVendorPay.payment_mode,
    sampleVendorPay.payment_type, sampleVendorPay.payee_name, sampleVendorPay.reference_no, sampleVendorPay.notes
  );
  AccountingEngine.postVendorPayment({ id: payRes1.lastInsertRowid, ...sampleVendorPay }, sampleVendorPay.bank_account_id);

  // Operating Expense (Cellar climate control & electricity)
  const expAccount = db.prepare("SELECT id FROM chart_of_accounts WHERE code = '6010'").get();
  const sampleExpense = {
    payment_no: 'EXP-2026-0008', branch_id: 1, bank_account_id: 1, expense_account_id: expAccount.id,
    payment_date: '2026-10-21', amount: 1850.00, payment_mode: 'Direct Debit', payment_type: 'Operating Expense',
    payee_name: 'Con Edison Climate Power', reference_no: 'DD-CONED-1026', notes: 'Cellar temperature and precision humidity maintenance bill'
  };
  const payRes2 = db.prepare(`
    INSERT INTO payments (payment_no, branch_id, bank_account_id, expense_account_id, payment_date, amount, payment_mode, payment_type, payee_name, reference_no, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sampleExpense.payment_no, sampleExpense.branch_id, sampleExpense.bank_account_id, sampleExpense.expense_account_id,
    sampleExpense.payment_date, sampleExpense.amount, sampleExpense.payment_mode, sampleExpense.payment_type,
    sampleExpense.payee_name, sampleExpense.reference_no, sampleExpense.notes
  );
  AccountingEngine.postExpense({ id: payRes2.lastInsertRowid, ...sampleExpense }, sampleExpense.bank_account_id, sampleExpense.expense_account_id);

  // 13. Inter-branch Stock Transfer
  const transferRes = db.prepare(`
    INSERT INTO stock_transfers (transfer_no, from_branch_id, to_branch_id, status, transfer_date, received_date, notes)
    VALUES ('TRF-2026-0001', 3, 1, 'In Transit', '2026-10-24', NULL, 'Weekly inventory replenishment from Central Napa Warehouse to Downtown Cellar')
  `).run();
  db.prepare(`
    INSERT INTO stock_transfer_items (transfer_id, product_id, quantity, unit_cost)
    VALUES (?, ?, ?, ?)
  `).run(transferRes.lastInsertRowid, 1, 6, 520.00);

  // 14. Stock Adjustment (Tasting room sample)
  const adjRes = db.prepare(`
    INSERT INTO stock_adjustments (adjustment_no, branch_id, product_id, adjustment_type, quantity, reason, unit_cost, total_cost, notes)
    VALUES ('ADJ-2026-001', 1, 7, 'OUT', 1, 'Sommelier Tasting Flight', 46.00, 46.00, 'Opened for VIP Sommelier masterclass')
  `).run();
  AccountingEngine.postStockAdjustment({ id: adjRes.lastInsertRowid, adjustment_no: 'ADJ-2026-001', branch_id: 1, adjustment_type: 'OUT', total_cost: 46.00, reason: 'Sommelier Tasting Flight' });

  // 15. Bank Transactions
  db.prepare(`
    INSERT INTO bank_transactions (transaction_no, bank_account_id, transaction_date, type, amount, balance_after, reference_no, description, reconciliation_status)
    VALUES 
    ('TXN-CHASE-001', 1, '2026-10-20', 'Withdrawal', 6000.00, 145000.00, 'SWIFT-FR7748102', 'Wire to Bordeaux Grands Crus for wine purchase PO-2026-0045', 'Reconciled'),
    ('TXN-CHASE-002', 1, '2026-10-21', 'Withdrawal', 1850.00, 143150.00, 'DD-CONED-1026', 'Cellar cooling utilities ConEd', 'Reconciled'),
    ('TXN-CHASE-003', 1, '2026-10-24', 'Deposit', 1500.00, 144650.00, 'WIRE-BISTRO-9912', 'B2B payment received from Grand View Bistro', 'Cleared')
  `).run();

  console.log('Seeding completed successfully!');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}

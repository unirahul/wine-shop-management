const { db, initDatabase } = require('./database');
const AccountingEngine = require('./services/accountingEngine');

function cleanDatabase() {
  console.log('🧹 Cleaning existing Wine Shop database tables...');

  // Disable foreign keys during cleanup
  db.pragma('foreign_keys = OFF');

  const tables = [
    'journal_entry_lines',
    'journal_entries',
    'sales_invoice_items',
    'sales_invoices',
    'purchase_items',
    'purchases',
    'stock_transfer_items',
    'stock_transfers',
    'stock_adjustments',
    'receipts',
    'payments',
    'bank_transactions',
    'branch_inventory',
    'products',
    'categories',
    'vendors',
    'customers',
    'bank_accounts',
    'users',
    'branches',
    'chart_of_accounts'
  ];

  const cleanTransaction = db.transaction(() => {
    for (const table of tables) {
      try {
        db.exec(`DELETE FROM ${table};`);
      } catch (e) {
        // Table might not exist yet
      }
    }
    try {
      db.exec('DELETE FROM sqlite_sequence;');
    } catch (e) {}
  });

  cleanTransaction();
  db.pragma('foreign_keys = ON');
  console.log('✅ Database cleaned. All tables wiped and autoincrement IDs reset.');
}

function seedIndianData() {
  console.log('🇮🇳 Seeding Indian Style Wine & Liquor Shop ERP Database...');

  // 1. Chart of Accounts (Indian State Liquor Excise & Business Accounting)
  const coa = [
    { code: '1010', name: 'POS Cash Counter / Gullak (काउंटर रोकड़)', type: 'Asset', sub_type: 'Current Asset', description: 'Counter cash across all wine shop branches' },
    { code: '1020', name: 'Operating Bank Accounts (SBI / HDFC / ICICI)', type: 'Asset', sub_type: 'Current Asset', description: 'Commercial current and business bank accounts' },
    { code: '1030', name: 'UPI & Merchant Settlement (PhonePe / GPay QR)', type: 'Asset', sub_type: 'Current Asset', description: 'QR soundbox and card gateway settlements' },
    { code: '1100', name: 'Accounts Receivable / Khata (उधारी लेनदार)', type: 'Asset', sub_type: 'Current Asset', description: 'B2B banquet, hotel & credit customer khata' },
    { code: '1200', name: 'IMFL, Beer & Wine Inventory (शराब स्टॉक)', type: 'Asset', sub_type: 'Current Asset', description: 'Stock on hand in shop display and godown' },
    { code: '1250', name: 'Goods in Transit (Inter-Branch Transfers)', type: 'Asset', sub_type: 'Current Asset', description: 'Liquor moving between godown and retail vends' },
    { code: '1500', name: 'Deep Chillers, Display Racks & POS Hardware', type: 'Asset', sub_type: 'Fixed Asset', description: 'Beer chillers, steel racks and barcode scanners' },

    { code: '2010', name: 'Accounts Payable / Distilleries (आपूर्तिकर्ता लेनदार)', type: 'Liability', sub_type: 'Current Liability', description: 'Amounts owed to United Spirits, Pernod Ricard, etc.' },
    { code: '2020', name: 'State Liquor Excise Duty Payable (आबकारी शुल्क देय)', type: 'Liability', sub_type: 'Current Liability', description: 'State excise duty collected on retail sales' },
    { code: '2030', name: 'State VAT Payable on Liquor (राज्य वैट देय)', type: 'Liability', sub_type: 'Current Liability', description: 'State VAT on alcoholic beverages' },
    { code: '2050', name: 'Customer Advances & Bottle Deposits', type: 'Liability', sub_type: 'Current Liability', description: 'Deposits for crates, bulk events and banquets' },

    { code: '3010', name: "Owner's Capital (प्रोपराइटर पूंजी)", type: 'Equity', sub_type: 'Equity', description: 'Initial invested capital in wine shop business' },
    { code: '3020', name: 'Retained Earnings (संचित लाभ)', type: 'Equity', sub_type: 'Equity', description: 'Accumulated profits retained in the business' },

    { code: '4010', name: 'Retail Counter Liquor & Wine Sales (काउंटर बिक्री)', type: 'Revenue', sub_type: 'Operating Revenue', description: 'Daily walk-in counter retail sales' },
    { code: '4020', name: 'Wholesale & Hotel/Banquet Sales (थोक बिक्री)', type: 'Revenue', sub_type: 'Operating Revenue', description: 'Bulk orders to hotels, clubs, and parties' },
    { code: '4030', name: 'Tasting & Promotional Revenue', type: 'Revenue', sub_type: 'Other Revenue', description: 'Brand sampling and tasting flights' },
    { code: '4040', name: 'Scrap & Empty Bottle Return Sales (कबाड़ी/बोतल बिक्री)', type: 'Revenue', sub_type: 'Other Revenue', description: 'Sale of empty wooden crates and beer bottles' },

    { code: '5010', name: 'Cost of Liquor & Goods Sold (COGS)', type: 'Expense', sub_type: 'Cost of Goods Sold', description: 'Direct purchase cost of sold liquor bottles' },
    { code: '5020', name: 'Inbound Freight & Godown Transport Charges', type: 'Expense', sub_type: 'Cost of Goods Sold', description: 'Tempo and truck transport from distilleries' },
    { code: '5030', name: 'Bottle Breakage & Spoilage Write-Off (टूटी बोतल क्षति)', type: 'Expense', sub_type: 'Cost of Goods Sold', description: 'Transit leakage, broken bottles and damaged seals' },

    { code: '6010', name: 'Shop Electricity & Chiller Power Bills (बिजली बिल)', type: 'Expense', sub_type: 'Operating Expense', description: 'High commercial electricity for chilling beer' },
    { code: '6020', name: 'Shop & Godown Rent (दुकान व गोदाम किराया)', type: 'Expense', sub_type: 'Operating Expense', description: 'Commercial rental for prime retail vends' },
    { code: '6030', name: 'Staff & Helper Salaries (स्टाफ वेतन)', type: 'Expense', sub_type: 'Operating Expense', description: 'Salaries for managers, counter salesmen and helpers' },
    { code: '6040', name: 'State Excise License & Renewal Fees (लाइसेंस फीस)', type: 'Expense', sub_type: 'Operating Expense', description: 'Annual state excise FL-II / L-2 license fees' },
    { code: '6050', name: 'UPI Soundbox & PoS Machine Charges', type: 'Expense', sub_type: 'Operating Expense', description: 'Monthly rentals for Paytm/PhonePe soundbox and EDC' },
    { code: '6060', name: 'Carry Bags, Cartons & Packaging Material', type: 'Expense', sub_type: 'Operating Expense', description: 'Cloth/paper liquor carry bags and tape' }
  ];

  const insertCoa = db.prepare('INSERT INTO chart_of_accounts (code, name, type, sub_type, description, balance) VALUES (?, ?, ?, ?, ?, ?)');
  for (const c of coa) {
    insertCoa.run(c.code, c.name, c.type, c.sub_type, c.description, 0);
  }

  // 2. Indian Branches (Major Indian Metros & Beach Tourism Hub)
  const branches = [
    {
      code: 'BR-01',
      name: 'Royal Heritage Wines & Spirits - Bandra West Flagship',
      type: 'Retail Wine & Beer Shop (FL-II)',
      address: 'Shop No. 4 & 5, Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip_code: '400050',
      phone: '+91 98201 12345',
      email: 'bandra@royalheritagewines.in',
      license_number: 'MH-FL-II-2026-8819',
      manager_name: 'Rajesh Malhotra',
      is_warehouse: 0
    },
    {
      code: 'BR-02',
      name: 'Rajdhani Premium Liquor Vend - Connaught Place',
      type: 'Premium Model Liquor Vend (L-2)',
      address: 'Block C, Outer Circle, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      zip_code: '110001',
      phone: '+91 98110 54321',
      email: 'delhi@royalheritagewines.in',
      license_number: 'DL-L-2-2026-4412',
      manager_name: 'Vikram Singh Chauhan',
      is_warehouse: 0
    },
    {
      code: 'BR-03',
      name: 'Deccan Spirits & Craft Cellar - Indiranagar',
      type: 'Retail Liquor Outlet (CL-2)',
      address: '772, 100 Feet Road, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip_code: '560038',
      phone: '+91 98450 78901',
      email: 'bengaluru@royalheritagewines.in',
      license_number: 'KA-CL-2-2026-6631',
      manager_name: 'Suresh Kumar Gowda',
      is_warehouse: 0
    },
    {
      code: 'BR-04',
      name: 'Coastal Wine Depot & Beer Shack - Calangute Beach',
      type: 'Beachside Wine & Beer Retail (GA-RETL)',
      address: 'Calangute - Baga Road, Near Tito’s Lane Cross',
      city: 'Calangute',
      state: 'Goa',
      zip_code: '403516',
      phone: '+91 98221 44556',
      email: 'goa@royalheritagewines.in',
      license_number: 'GA-RETL-2026-1190',
      manager_name: 'Anthony D’Souza',
      is_warehouse: 0
    },
    {
      code: 'BR-05',
      name: 'Central Logistics & Bonded Godown - Bhiwandi Hub',
      type: 'Central Bonded Warehouse & Distribution Hub',
      address: 'Warehouse Complex, Godown No. 12, Mankoli Naka, Bhiwandi',
      city: 'Thane',
      state: 'Maharashtra',
      zip_code: '421302',
      phone: '+91 98200 99881',
      email: 'logistics@royalheritagewines.in',
      license_number: 'MH-BW-WHS-2026-004',
      manager_name: 'Manoj Patil',
      is_warehouse: 1
    }
  ];

  const insertBranch = db.prepare(`
    INSERT INTO branches (code, name, type, address, city, state, zip_code, phone, email, license_number, manager_name, is_warehouse)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of branches) {
    insertBranch.run(b.code, b.name, b.type, b.address, b.city, b.state, b.zip_code, b.phone, b.email, b.license_number, b.manager_name, b.is_warehouse);
  }

  // 3. Indian Bank Accounts, UPI QR Soundbox & POS Gullaks
  const bankAccs = [
    { code: 'BNK-SBI-01', name: 'State Bank of India (Current A/c)', bank_name: 'State Bank of India (SBI)', number: '3094-8812-9041', type: 'Checking / Current', branch_id: null, gl: '1020', balance: 1850000.0 },
    { code: 'BNK-HDFC-02', name: 'HDFC Bank SmartHub Business A/c', bank_name: 'HDFC Bank', number: '5020-0088-9123-45', type: 'Checking / Current', branch_id: null, gl: '1020', balance: 1280000.0 },
    { code: 'BNK-ICICI-03', name: 'ICICI Bank Liquidity Reserve', bank_name: 'ICICI Bank', number: '0011-0501-8892', type: 'Savings', branch_id: null, gl: '1020', balance: 840000.0 },
    { code: 'UPI-QR-SOUNDBOX', name: 'PhonePe / GPay UPI QR Soundbox', bank_name: 'NPCI UPI Merchant Gateway', number: 'VPA: royalheritagewine@upi', type: 'Merchant Settlement', branch_id: null, gl: '1030', balance: 165400.0 },
    { code: 'CASH-MUM-01', name: 'Mumbai Bandra POS Cash Gullak', bank_name: 'In-Store Safe (दुकान गल्ला)', number: 'GULLAK-MUM-01', type: 'Cash Drawer POS', branch_id: 1, gl: '1010', balance: 45000.0 },
    { code: 'CASH-DEL-02', name: 'Delhi CP POS Cash Gullak', bank_name: 'In-Store Safe (दुकान गल्ला)', number: 'GULLAK-DEL-02', type: 'Cash Drawer POS', branch_id: 2, gl: '1010', balance: 38000.0 },
    { code: 'CASH-BLR-03', name: 'Bengaluru POS Cash Gullak', bank_name: 'In-Store Safe (दुकान गल्ला)', number: 'GULLAK-BLR-03', type: 'Cash Drawer POS', branch_id: 3, gl: '1010', balance: 32000.0 },
    { code: 'CASH-GOA-04', name: 'Goa Calangute POS Cash Gullak', bank_name: 'In-Store Safe (दुकान गल्ला)', number: 'GULLAK-GOA-04', type: 'Cash Drawer POS', branch_id: 4, gl: '1010', balance: 25000.0 }
  ];

  const insertBank = db.prepare(`
    INSERT INTO bank_accounts (account_code, account_name, bank_name, account_number, account_type, branch_id, gl_account_id, current_balance, opening_balance, currency)
    VALUES (?, ?, ?, ?, ?, ?, (SELECT id FROM chart_of_accounts WHERE code = ?), ?, ?, 'INR')
  `);
  for (const b of bankAccs) {
    insertBank.run(b.code, b.name, b.bank_name, b.number, b.type, b.branch_id, b.gl, b.balance, b.balance);
  }

  // 4. Indian Liquor Categories
  const categories = [
    { name: 'Whisky & IMFL', slug: 'whisky-imfl', description: 'Indian Made Foreign Liquor Whiskies & Single Malts' },
    { name: 'Beers & Draught', slug: 'beers-draught', description: 'Chilled lagers, strong beers, and craft wheat beers' },
    { name: 'Rum', slug: 'rum', description: 'Dark rums, white rums, and spiced molasses spirits' },
    { name: 'Indian & Imported Wines', slug: 'wines', description: 'Nashik Valley, Nandi Hills and international fine wines' },
    { name: 'Vodka & Gin', slug: 'vodka-gin', description: 'Indian craft gins, flavored vodkas and premium spirits' },
    { name: 'Brandy', slug: 'brandy', description: 'Popular grape and honey brandies' },
    { name: 'Bar Mixers & Snacks', slug: 'mixers-snacks', description: 'Club soda, tonic water, mineral water and glassware' }
  ];

  const insertCat = db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)');
  for (const c of categories) {
    insertCat.run(c.name, c.slug, c.description);
  }

  // 5. Products (Top Indian Liquor Brands with Khamba, Adha, Pauva, Cans & Bottles)
  const products = [
    // WHISKY
    {
      sku: 'WHS-IND-001', barcode: '890100100101', name: 'Royal Stag Deluxe Whisky 750ml (Khamba)',
      category_id: 1, wine_type: 'Whisky', varietal: 'Grain Spirit & Scotch Malt', vintage_year: null,
      region: 'Pernod Ricard India', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 540.00, selling_price: 680.00, wholesale_price: 610.00, tax_rate: 20.0, min_stock_level: 24,
      description: 'Seagram’s iconic blend of imported Scotch malts and select Indian grain spirits. Smooth, rich, and India’s favorite.',
      tasting_notes: 'Pleasant malt aroma, hints of wood smoke, smooth grain warmth on finish.',
      food_pairing: 'Tandoori Chicken, Mutton Seekh Kebab, Spicy Cashews'
    },
    {
      sku: 'WHS-IND-002', barcode: '890100100102', name: 'Royal Stag Deluxe Whisky 375ml (Adha / Half)',
      category_id: 1, wine_type: 'Whisky', varietal: 'Grain Spirit & Scotch Malt', vintage_year: null,
      region: 'Pernod Ricard India', country: 'India', bottle_size: '375ml Adha / Half', abv: 42.8,
      cost_price: 280.00, selling_price: 350.00, wholesale_price: 315.00, tax_rate: 20.0, min_stock_level: 36,
      description: '375ml half bottle (adha) of Royal Stag Deluxe Whisky.',
      tasting_notes: 'Smooth, balanced malt character.',
      food_pairing: 'Chicken Tikka, Masala Peanuts'
    },
    {
      sku: 'WHS-IND-003', barcode: '890100100103', name: 'Royal Stag Deluxe Whisky 180ml (Pauva / Nip)',
      category_id: 1, wine_type: 'Whisky', varietal: 'Grain Spirit & Scotch Malt', vintage_year: null,
      region: 'Pernod Ricard India', country: 'India', bottle_size: '180ml Pauva / Quarter', abv: 42.8,
      cost_price: 140.00, selling_price: 180.00, wholesale_price: 160.00, tax_rate: 20.0, min_stock_level: 60,
      description: '180ml quarter bottle (pauva/nip) of Royal Stag Deluxe Whisky.',
      tasting_notes: 'Compact pocket bottle with trademark smooth flavor.',
      food_pairing: 'Bar snacks, Chakna, Fried Papad'
    },
    {
      sku: 'WHS-IND-004', barcode: '890100100201', name: 'Blenders Pride Rare Premium Whisky 750ml',
      category_id: 1, wine_type: 'Whisky', varietal: 'Indian Grain & Scotch Malt', vintage_year: null,
      region: 'Pernod Ricard India', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 740.00, selling_price: 920.00, wholesale_price: 830.00, tax_rate: 20.0, min_stock_level: 24,
      description: 'Premium whisky crafted with fine Indian grain spirits and imported scotch malts from Chivas Brothers.',
      tasting_notes: 'Rich fruity malt aroma, buttery oak notes, mellow lingering finish.',
      food_pairing: 'Butter Chicken, Paneer Tikka, Crispy Corn'
    },
    {
      sku: 'WHS-IND-005', barcode: '890100100202', name: 'Blenders Pride Rare Premium Whisky 375ml',
      category_id: 1, wine_type: 'Whisky', varietal: 'Indian Grain & Scotch Malt', vintage_year: null,
      region: 'Pernod Ricard India', country: 'India', bottle_size: '375ml Adha / Half', abv: 42.8,
      cost_price: 380.00, selling_price: 470.00, wholesale_price: 425.00, tax_rate: 20.0, min_stock_level: 30,
      description: '375ml half bottle of Blenders Pride Rare Premium Whisky.',
      tasting_notes: 'Fruity oak, round and smooth.',
      food_pairing: 'Mutton Galouti Kebab'
    },
    {
      sku: 'WHS-IND-006', barcode: '890100100301', name: 'McDowell’s No.1 Reserve Whisky 750ml (Khamba)',
      category_id: 1, wine_type: 'Whisky', varietal: 'Indian Malt Blend', vintage_year: null,
      region: 'United Spirits (Diageo)', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 480.00, selling_price: 620.00, wholesale_price: 550.00, tax_rate: 20.0, min_stock_level: 30,
      description: 'India’s largest selling flagship whisky. Celebrated for friendship and camaraderie across generations.',
      tasting_notes: 'Warm honey notes, vanilla sweetness, medium-bodied malt finish.',
      food_pairing: 'Spicy Fish Fry, Egg Bhurji, Masala Chana'
    },
    {
      sku: 'WHS-IND-007', barcode: '890100100302', name: 'McDowell’s No.1 Reserve Whisky 180ml (Pauva)',
      category_id: 1, wine_type: 'Whisky', varietal: 'Indian Malt Blend', vintage_year: null,
      region: 'United Spirits (Diageo)', country: 'India', bottle_size: '180ml Pauva / Quarter', abv: 42.8,
      cost_price: 130.00, selling_price: 160.00, wholesale_price: 145.00, tax_rate: 20.0, min_stock_level: 60,
      description: '180ml quarter bottle (pauva) of McDowell’s No. 1 Reserve.',
      tasting_notes: 'Honeyed warmth and toasted grain.',
      food_pairing: 'Moong Dal Namkeen, Aloo Bhujia'
    },
    {
      sku: 'WHS-IND-008', barcode: '890100100401', name: 'Imperial Blue Superior Grain Whisky 750ml',
      category_id: 1, wine_type: 'Whisky', varietal: 'Grain Spirit & Scotch Malt', vintage_year: null,
      region: 'Pernod Ricard India', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 450.00, selling_price: 580.00, wholesale_price: 515.00, tax_rate: 20.0, min_stock_level: 24,
      description: 'Men will be men! India’s ultra-popular smooth grain whisky by Seagram’s Pernod Ricard.',
      tasting_notes: 'Subtle peat smoke, light caramel, easy-drinking palate.',
      food_pairing: 'Chicken Pakora, Chilli Paneer'
    },
    {
      sku: 'WHS-IND-009', barcode: '890100100501', name: 'Amrut Indian Single Malt Whisky 750ml',
      category_id: 1, wine_type: 'Whisky', varietal: 'Indian Single Malt', vintage_year: null,
      region: 'Bengaluru, Karnataka', country: 'India', bottle_size: '750ml Khamba / Full', abv: 46.0,
      cost_price: 3100.00, selling_price: 3950.00, wholesale_price: 3500.00, tax_rate: 20.0, min_stock_level: 6,
      description: 'Pioneering international award-winning Indian Single Malt. Crafted from 100% Himalayan barley and aged at 3000ft.',
      tasting_notes: 'Bittersweet honeycomb, bourbon oak spice, orange blossom, rich barley finish.',
      food_pairing: 'Smoked Lamb Chops, Dark Chocolate Truffles, Aged Gouda'
    },
    {
      sku: 'WHS-IND-010', barcode: '890100100601', name: 'Indri Trini - Three Wood Single Malt 750ml',
      category_id: 1, wine_type: 'Whisky', varietal: 'Triple Cask Indian Single Malt', vintage_year: null,
      region: 'Indri, Haryana', country: 'India', bottle_size: '750ml Khamba / Full', abv: 46.0,
      cost_price: 3400.00, selling_price: 4300.00, wholesale_price: 3850.00, tax_rate: 20.0, min_stock_level: 6,
      description: 'Globally celebrated Indian single malt matured in Ex-Bourbon, French Wine, and PX Sherry casks.',
      tasting_notes: 'Black tea, tropical caramelized pineapple, spiced oak, rich nutty complexity.',
      food_pairing: 'Grilled Duck, Roast Tenderloin, Aged Cheddar'
    },
    {
      sku: 'WHS-IMP-011', barcode: '500026701101', name: 'Johnnie Walker Black Label 12YO Scotch 750ml',
      category_id: 1, wine_type: 'Whisky', varietal: '12 Year Blended Scotch Whisky', vintage_year: null,
      region: 'Kilmarnock, Scotland', country: 'United Kingdom', bottle_size: '750ml Khamba / Full', abv: 40.0,
      cost_price: 2500.00, selling_price: 3200.00, wholesale_price: 2850.00, tax_rate: 20.0, min_stock_level: 12,
      description: 'The world’s benchmark luxury 12-year-old blended Scotch. Complex, smoky, and deep.',
      tasting_notes: 'Sweet vanilla, dark dried fruits, toffee, signature peat smoke.',
      food_pairing: 'Charcoal Grilled Kebabs, Blue Cheese, Roasted Nuts'
    },

    // RUM
    {
      sku: 'RUM-IND-012', barcode: '890100200101', name: 'Old Monk Very Old Vatted XXX Rum 750ml (Khamba)',
      category_id: 3, wine_type: 'Rum', varietal: 'Dark Vatted Molasses Rum', vintage_year: null,
      region: 'Ghaziabad, Uttar Pradesh', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 360.00, selling_price: 460.00, wholesale_price: 410.00, tax_rate: 20.0, min_stock_level: 48,
      description: 'The undisputed national legend of Indian rums since 1954. Aged in oak vats with nostalgic vanilla aroma.',
      tasting_notes: 'Madagascar vanilla, molasses caramel, dark roast coffee, warm spices.',
      food_pairing: 'Coca-Cola mixer, Tandoori Chicken, Spicy Mutton Curry'
    },
    {
      sku: 'RUM-IND-013', barcode: '890100200102', name: 'Old Monk XXX Rum 375ml (Adha / Half)',
      category_id: 3, wine_type: 'Rum', varietal: 'Dark Vatted Molasses Rum', vintage_year: null,
      region: 'Ghaziabad, Uttar Pradesh', country: 'India', bottle_size: '375ml Adha / Half', abv: 42.8,
      cost_price: 190.00, selling_price: 240.00, wholesale_price: 215.00, tax_rate: 20.0, min_stock_level: 48,
      description: '375ml half bottle of Old Monk XXX Dark Rum.',
      tasting_notes: 'Vanilla and dark treacle warmth.',
      food_pairing: 'Chicken Wings, Hot Water & Lemon'
    },
    {
      sku: 'RUM-IND-014', barcode: '890100200103', name: 'Old Monk XXX Rum 180ml (Pauva / Nip)',
      category_id: 3, wine_type: 'Rum', varietal: 'Dark Vatted Molasses Rum', vintage_year: null,
      region: 'Ghaziabad, Uttar Pradesh', country: 'India', bottle_size: '180ml Pauva / Quarter', abv: 42.8,
      cost_price: 95.00, selling_price: 125.00, wholesale_price: 110.00, tax_rate: 20.0, min_stock_level: 60,
      description: '180ml quarter bottle (pauva) of Old Monk XXX Rum.',
      tasting_notes: 'Rich vanilla punch in a convenient glass nip.',
      food_pairing: 'Spicy Chakna, Rosted Peanuts'
    },
    {
      sku: 'RUM-IND-015', barcode: '890100200201', name: 'McDowell’s No.1 Celebration Dark Rum 750ml',
      category_id: 3, wine_type: 'Rum', varietal: 'Dark Molasses Rum', vintage_year: null,
      region: 'United Spirits (Diageo)', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 340.00, selling_price: 440.00, wholesale_price: 390.00, tax_rate: 20.0, min_stock_level: 24,
      description: 'Smooth dark rum with hints of dark cocoa and molasses.',
      tasting_notes: 'Warm brown sugar, woody aroma, smooth throat feel.',
      food_pairing: 'Barbecue Chicken, Samosas'
    },
    {
      sku: 'RUM-IND-016', barcode: '080480200301', name: 'Bacardi Carta Blanca Superior White Rum 750ml',
      category_id: 3, wine_type: 'Rum', varietal: 'White Rum', vintage_year: null,
      region: 'Bacardi India', country: 'India', bottle_size: '750ml Khamba / Full', abv: 40.0,
      cost_price: 850.00, selling_price: 1050.00, wholesale_price: 950.00, tax_rate: 20.0, min_stock_level: 15,
      description: 'Light, crisp white rum aged in white oak barrels and filtered through charcoal for iconic cocktails.',
      tasting_notes: 'Almond, vanilla, fresh lime floral notes.',
      food_pairing: 'Mojito, Pina Colada, Grilled Prawns'
    },

    // BEER
    {
      sku: 'BER-IND-017', barcode: '890100300101', name: 'Kingfisher Premium Lager Beer 650ml Bottle',
      category_id: 2, wine_type: 'Beer', varietal: 'Mild Lager Beer', vintage_year: null,
      region: 'United Breweries (Heineken)', country: 'India', bottle_size: '650ml Bottle', abv: 4.8,
      cost_price: 125.00, selling_price: 160.00, wholesale_price: 142.00, tax_rate: 20.0, min_stock_level: 60,
      description: 'The King of Good Times! India’s most iconic and refreshing malt lager beer.',
      tasting_notes: 'Crisp golden malt, clean hop aroma, ultra-refreshing finish.',
      food_pairing: 'Fish Koliwada, Chicken Tikka, Masala French Fries'
    },
    {
      sku: 'BER-IND-018', barcode: '890100300102', name: 'Kingfisher Strong Premium Beer 650ml Bottle',
      category_id: 2, wine_type: 'Beer', varietal: 'Super Strong Beer', vintage_year: null,
      region: 'United Breweries (Heineken)', country: 'India', bottle_size: '650ml Bottle', abv: 7.2,
      cost_price: 135.00, selling_price: 175.00, wholesale_price: 155.00, tax_rate: 20.0, min_stock_level: 90,
      description: 'India’s #1 largest selling strong beer. Packed with full-bodied punch and rich roasted malt.',
      tasting_notes: 'Heavy malt body, hearty hop bitterness, strong warming kick.',
      food_pairing: 'Tandoori Murgh, Mutton Rogan Josh, Spicy Chakna'
    },
    {
      sku: 'BER-IND-019', barcode: '890100300103', name: 'Kingfisher Premium Lager 500ml Can',
      category_id: 2, wine_type: 'Beer', varietal: 'Mild Lager Beer', vintage_year: null,
      region: 'United Breweries (Heineken)', country: 'India', bottle_size: '500ml Can', abv: 4.8,
      cost_price: 110.00, selling_price: 145.00, wholesale_price: 128.00, tax_rate: 20.0, min_stock_level: 48,
      description: 'Chilled 500ml aluminum can of Kingfisher Premium Lager.',
      tasting_notes: 'Chilled malt freshness.',
      food_pairing: 'Nachos, Chana Chaat'
    },
    {
      sku: 'BER-IND-020', barcode: '890100300201', name: 'Bira 91 White Craft Beer 330ml Pint',
      category_id: 2, wine_type: 'Beer', varietal: 'Belgian Wheat Ale', vintage_year: null,
      region: 'B9 Beverages', country: 'India', bottle_size: '330ml Pint', abv: 4.7,
      cost_price: 115.00, selling_price: 155.00, wholesale_price: 135.00, tax_rate: 20.0, min_stock_level: 36,
      description: 'Delicious handcrafted Belgian-style wheat beer brewed with coriander and fresh orange peel.',
      tasting_notes: 'Hazy citrus, orange peel, light coriander spice, creamy refreshing head.',
      food_pairing: 'Sushi, Dimsums, Wood-fired Pizza, Peri Peri Fries'
    },
    {
      sku: 'BER-IND-021', barcode: '890100300301', name: 'Budweiser Magnum Double Barrel Strong Beer 650ml',
      category_id: 2, wine_type: 'Beer', varietal: 'Super Premium Strong Beer', vintage_year: null,
      region: 'AB InBev India', country: 'India', bottle_size: '650ml Bottle', abv: 6.5,
      cost_price: 175.00, selling_price: 220.00, wholesale_price: 198.00, tax_rate: 20.0, min_stock_level: 40,
      description: 'Aged on beechwood with rich, velvety bold finish. The king of strong beers.',
      tasting_notes: 'Roasted barley, caramelized grain, velvety smooth punch.',
      food_pairing: 'BBQ Burgers, Lamb Seekh, Spicy Pizza'
    },
    {
      sku: 'BER-IND-022', barcode: '890100300401', name: 'Tuborg Strong Premium Beer 650ml Bottle',
      category_id: 2, wine_type: 'Beer', varietal: 'Danish Recipe Strong Beer', vintage_year: null,
      region: 'Carlsberg India', country: 'India', bottle_size: '650ml Bottle', abv: 7.0,
      cost_price: 130.00, selling_price: 170.00, wholesale_price: 150.00, tax_rate: 20.0, min_stock_level: 48,
      description: 'Smooth Danish strong beer with the famous pull-off ring cap.',
      tasting_notes: 'Grain sweetness, pleasant hop aroma, clean finish.',
      food_pairing: 'Paneer 65, Chicken 65, Salted Cashews'
    },

    // INDIAN & IMPORTED WINES
    {
      sku: 'WIN-IND-023', barcode: '890100400101', name: 'Sula Dindori Reserve Shiraz 750ml',
      category_id: 4, wine_type: 'Red Wine', varietal: 'Shiraz (Syrah)', vintage_year: 2022,
      region: 'Dindori, Nashik Valley', country: 'India', bottle_size: '750ml Khamba / Full', abv: 13.5,
      cost_price: 680.00, selling_price: 895.00, wholesale_price: 790.00, tax_rate: 20.0, min_stock_level: 24,
      description: 'India’s most decorated estate-bottled red wine from Sula Vineyards, aged in American oak barrels.',
      tasting_notes: 'Ripe blackcurrant, dark berries, vanilla oak, smoky spice with plush tannins.',
      food_pairing: 'Rogan Josh, Grilled Lamb Chops, Lasagna, Aged Cheddar'
    },
    {
      sku: 'WIN-IND-024', barcode: '890100400102', name: 'Sula Sauvignon Blanc 750ml',
      category_id: 4, wine_type: 'White Wine', varietal: 'Sauvignon Blanc', vintage_year: 2023,
      region: 'Nashik Valley, Maharashtra', country: 'India', bottle_size: '750ml Khamba / Full', abv: 12.5,
      cost_price: 550.00, selling_price: 725.00, wholesale_price: 640.00, tax_rate: 20.0, min_stock_level: 20,
      description: 'Crisp, aromatic white wine showcasing bell peppers, cut green grass, and gooseberries.',
      tasting_notes: 'Grapefruit, lemongrass, flinty mineral acidity, bone dry finish.',
      food_pairing: 'Goat Cheese Salad, Tawa Fish Fry, Steamed Prawns'
    },
    {
      sku: 'WIN-IND-025', barcode: '890100400103', name: 'Sula Brut Tropicale Sparkling Rosé 750ml',
      category_id: 4, wine_type: 'Sparkling Wine', varietal: 'Pinot Noir / Shiraz Blend', vintage_year: 2022,
      region: 'Nashik Valley, Maharashtra', country: 'India', bottle_size: '750ml Khamba / Full', abv: 12.0,
      cost_price: 950.00, selling_price: 1250.00, wholesale_price: 1100.00, tax_rate: 20.0, min_stock_level: 12,
      description: 'Elegant Méthode Traditionnelle sparkling rosé. Vibrant aromas of passion fruit and peach.',
      tasting_notes: 'Fresh red berries, passionfruit zest, brioche, creamy effervescent bubbles.',
      food_pairing: 'Celebration Canapés, Paneer Tikka, Tarts'
    },
    {
      sku: 'WIN-IND-026', barcode: '890100400201', name: 'Grover Zampa La Réserve Red 750ml',
      category_id: 4, wine_type: 'Red Wine', varietal: 'Cabernet Sauvignon / Shiraz', vintage_year: 2021,
      region: 'Nandi Hills, Bengaluru', country: 'India', bottle_size: '750ml Khamba / Full', abv: 14.0,
      cost_price: 720.00, selling_price: 950.00, wholesale_price: 840.00, tax_rate: 20.0, min_stock_level: 18,
      description: 'Created with legendary consultant Michel Rolland. Matured in French oak barrels at Nandi Hills.',
      tasting_notes: 'Ripe black cherry, cocoa, warm black pepper spice, velvety structured tannins.',
      food_pairing: 'Mutton Biryani, Roasted Tenderloin, Dal Makhani'
    },
    {
      sku: 'WIN-IND-027', barcode: '890100400301', name: 'Fratelli Sette Signature Reserve Red 750ml',
      category_id: 4, wine_type: 'Red Wine', varietal: 'Sangiovese / Cabernet Sauvignon', vintage_year: 2020,
      region: 'Akluj, Solapur, Maharashtra', country: 'India', bottle_size: '750ml Khamba / Full', abv: 14.2,
      cost_price: 1550.00, selling_price: 1950.00, wholesale_price: 1750.00, tax_rate: 20.0, min_stock_level: 10,
      description: 'The pinnacle of fine Indian winemaking. Crafted by Piero Masi and aged for 14 months in French oak.',
      tasting_notes: 'Dark plum, chocolate ganache, violet perfume, refined tobacco leaf finish.',
      food_pairing: 'Prime Rib, Truffled Risotto, Bistecca Fiorentina'
    },

    // VODKA & GIN
    {
      sku: 'VOD-IND-028', barcode: '890100500101', name: 'Magic Moments Remix Grain Vodka 750ml',
      category_id: 5, wine_type: 'Vodka', varietal: 'Triple Distilled Grain Vodka', vintage_year: null,
      region: 'Rampur, Uttar Pradesh', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 420.00, selling_price: 550.00, wholesale_price: 490.00, tax_rate: 20.0, min_stock_level: 30,
      description: 'India’s chart-topping party vodka by Radico Khaitan. Exceptionally clean, crisp and silky smooth.',
      tasting_notes: 'Pure grain neutrality, faint citrus sweetness, smooth finish.',
      food_pairing: 'Cranberry juice mixer, Orange juice, Chilli Paneer'
    },
    {
      sku: 'GIN-IND-029', barcode: '890100500201', name: 'Greater Than London Dry Gin 750ml',
      category_id: 5, wine_type: 'Gin', varietal: 'Craft London Dry Gin', vintage_year: null,
      region: 'Goa', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 850.00, selling_price: 1100.00, wholesale_price: 980.00, tax_rate: 20.0, min_stock_level: 18,
      description: 'India’s first craft gin distilled in copper pots in Goa using Himalayan juniper, coriander, fennel and ginger.',
      tasting_notes: 'Piney juniper, fresh coriander zing, zesty orange peel, crisp dry finish.',
      food_pairing: 'Tonic Water & Cucumber, Grilled Calamari, Bruschetta'
    },
    {
      sku: 'GIN-IND-030', barcode: '890100500301', name: 'Hapusa Himalayan Craft Gin 750ml',
      category_id: 5, wine_type: 'Gin', varietal: 'Wild Himalayan Juniper Gin', vintage_year: null,
      region: 'Goa / Himalayas', country: 'India', bottle_size: '750ml Khamba / Full', abv: 43.0,
      cost_price: 2300.00, selling_price: 2950.00, wholesale_price: 2650.00, tax_rate: 20.0, min_stock_level: 8,
      description: 'Ultra-premium gin distilled with untamed wild Himalayan juniper, turmeric, mango, and Gondhoraj limes.',
      tasting_notes: 'Resinous pine, floral citrus, warm earthy ginger and wild botanicals.',
      food_pairing: 'Martini with twist, Smoked Salmon, Goan Prawn Balchao'
    },

    // BRANDY
    {
      sku: 'BRN-IND-031', barcode: '890100600101', name: 'Mansion House French Grape Brandy 750ml',
      category_id: 6, wine_type: 'Brandy', varietal: 'French Grape Brandy', vintage_year: null,
      region: 'Tilaknagar Industries, Maharashtra', country: 'India', bottle_size: '750ml Khamba / Full', abv: 42.8,
      cost_price: 520.00, selling_price: 670.00, wholesale_price: 600.00, tax_rate: 20.0, min_stock_level: 24,
      description: 'India’s most celebrated brandy by Tilaknagar Industries. Smooth, rich, with warm oak and grape nuances.',
      tasting_notes: 'Toasted oak, dried raisins, honey sweetness, warm smooth finish.',
      food_pairing: 'Warm water / soda, Mutton Pepper Fry, Chettinad Chicken'
    },

    // MIXERS & SODA
    {
      sku: 'MIX-IND-032', barcode: '890100700101', name: 'Bisleri Club Soda 750ml Glass Bottle',
      category_id: 7, wine_type: 'Mixer', varietal: 'Extra Carbonated Sparkling Soda', vintage_year: null,
      region: 'Bisleri International', country: 'India', bottle_size: '750ml Bottle', abv: 0.0,
      cost_price: 15.00, selling_price: 20.00, wholesale_price: 17.00, tax_rate: 12.0, min_stock_level: 120,
      description: 'Extra fizzy sparkling club soda for whisky, rum and spirits.',
      tasting_notes: 'High effervescence, neutral palate.',
      food_pairing: 'Mix with Royal Stag, Old Monk, or Lime & Salt'
    }
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (sku, barcode, name, category_id, wine_type, varietal, vintage_year, region, country, bottle_size, abv, cost_price, selling_price, wholesale_price, tax_rate, min_stock_level, description, tasting_notes, food_pairing)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prodIds = [];
  for (const w of products) {
    const res = insertProd.run(w.sku, w.barcode, w.name, w.category_id, w.wine_type, w.varietal, w.vintage_year, w.region, w.country, w.bottle_size, w.abv, w.cost_price, w.selling_price, w.wholesale_price, w.tax_rate, w.min_stock_level, w.description, w.tasting_notes, w.food_pairing);
    prodIds.push(res.lastInsertRowid);
  }

  // 6. Branch Inventory distribution across Indian branches
  const insertInv = db.prepare(`
    INSERT INTO branch_inventory (branch_id, product_id, quantity, rack_location, batch_lot)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Stock quantities per branch type:
  // Branch 1 (Mumbai Bandra): Premium flagship retail vend (stock 30-120)
  // Branch 2 (Delhi CP): High-speed urban retail outlet (stock 35-140)
  // Branch 3 (Bengaluru Indiranagar): Craft beer & single malt hub (stock 25-100)
  // Branch 4 (Goa Calangute): Tourism, heavy beer and rum turnover (stock 40-160)
  // Branch 5 (Bhiwandi Central Godown): Bulk warehouse pallet inventory (stock 150-600)
  const stockPatterns = [
    { branchId: 1, base: 36, rack: 'Counter Rack A (Front Display)' },
    { branchId: 2, base: 42, rack: 'Shelf B-Main Floor' },
    { branchId: 3, base: 32, rack: 'Craft Cellar Rack 1' },
    { branchId: 4, base: 55, rack: 'Beachside Chiller Bay' },
    { branchId: 5, base: 280, rack: 'Bhiwandi Central Pallet Bay 04' }
  ];

  for (let pIndex = 0; pIndex < prodIds.length; pIndex++) {
    const pId = prodIds[pIndex];
    for (const sp of stockPatterns) {
      let qty = sp.base;
      // Single malts (Amrut / Indri / Johnnie Walker) have lower volume
      if ([8, 9, 10, 26, 29].includes(pIndex)) {
        qty = Math.max(4, Math.round(sp.base * 0.25));
      }
      // Mass volume items (Old Monk, Royal Stag, Kingfisher Strong, Soda) have high volume
      if ([0, 1, 2, 11, 12, 13, 16, 17, 31].includes(pIndex)) {
        qty = Math.round(sp.base * 1.8);
      }
      // Beers in Goa have extra high stock
      if (sp.branchId === 4 && [16, 17, 18, 19, 20, 21].includes(pIndex)) {
        qty = Math.round(sp.base * 2.5);
      }
      insertInv.run(sp.branchId, pId, qty, `${sp.rack}-Slot-${pIndex + 1}`, `LOT-IND-2026-${100 + pIndex}`);
    }
  }

  // 7. Indian Distilleries & Liquor Distributors (Vendors)
  const vendors = [
    {
      code: 'VND-001',
      name: 'United Spirits Limited (Diageo India)',
      contact: 'Siddharth Mallya',
      phone: '+91 80 3985 6500',
      email: 'orders@unitedspirits.in',
      address: 'UB Tower, 24 Vittal Mallya Road',
      city: 'Bengaluru',
      country: 'India',
      days: 30,
      balance: 185000.0
    },
    {
      code: 'VND-002',
      name: 'Pernod Ricard India Pvt Ltd (Seagram’s)',
      contact: 'Anil Sharma',
      phone: '+91 124 406 9241',
      email: 'supply@pernod-ricard-india.com',
      address: 'DLF Cyber City, Building 8C, Tower B',
      city: 'Gurugram',
      country: 'India',
      days: 30,
      balance: 142000.0
    },
    {
      code: 'VND-003',
      name: 'Mohan Meakin Limited (Old Monk Distilleries)',
      contact: 'Rameshwar Dayal',
      phone: '+91 120 285 2201',
      email: 'distillery@mohanmeakin.com',
      address: 'Mohan Nagar Industrial Estate',
      city: 'Ghaziabad',
      country: 'India',
      days: 21,
      balance: 95000.0
    },
    {
      code: 'VND-004',
      name: 'United Breweries Limited (Kingfisher & Heineken)',
      contact: 'Harish Venkatesh',
      phone: '+91 80 2227 2222',
      email: 'breweryorders@ubmail.com',
      address: 'UB City, Vasanth Nagar',
      city: 'Bengaluru',
      country: 'India',
      days: 15,
      balance: 210000.0
    },
    {
      code: 'VND-005',
      name: 'Radico Khaitan Limited (Magic Moments & Morpheus)',
      contact: 'Sanjay Rastogi',
      phone: '+91 595 235 0101',
      email: 'sales@radicokhaitan.com',
      address: 'Bareilly Road',
      city: 'Rampur',
      country: 'India',
      days: 30,
      balance: 78000.0
    },
    {
      code: 'VND-006',
      name: 'Sula Vineyards Limited',
      contact: 'Karan Vasani',
      phone: '+91 253 302 7777',
      email: 'cellars@sulawines.com',
      address: 'Gat 36/2, Govardhan Village, Gangapur-Savargaon Road',
      city: 'Nashik',
      country: 'India',
      days: 30,
      balance: 85000.0
    },
    {
      code: 'VND-007',
      name: 'Grover Zampa Vineyards Ltd',
      contact: 'Sumedh Singh Mandla',
      phone: '+91 80 2762 2841',
      email: 'trade@groverzampa.com',
      address: 'Raghunathapur, Doddaballapur Road',
      city: 'Bengaluru',
      country: 'India',
      days: 30,
      balance: 62000.0
    }
  ];

  const insertVendor = db.prepare(`
    INSERT INTO vendors (code, name, contact_person, phone, email, address, city, country, payment_terms_days, opening_balance, current_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const v of vendors) {
    insertVendor.run(v.code, v.name, v.contact, v.phone, v.email, v.address, v.city, v.country, v.days, v.balance, v.balance);
  }

  // 8. Indian Customers (Retail Walk-in, Wine Club Members & B2B Banquet Wholesale Khata)
  const customers = [
    { code: 'CUST-001', name: 'Rajesh Sharma', phone: '+91 98201 98765', email: 'rajesh.sharma@gmail.com', city: 'Mumbai', tier: 'Gold Reserve', points: 420, balance: 0.0, limit: 15000.0 },
    { code: 'CUST-002', name: 'The Grand Palace Hotel & Banquets', phone: '+91 98200 11223', email: 'fnb@grandpalacehotels.com', city: 'Mumbai', tier: 'Corporate Wholesale (B2B)', points: 4800, balance: 45000.0, limit: 250000.0 },
    { code: 'CUST-003', name: 'Vikram Malhotra', phone: '+91 98110 33445', email: 'vikram.malhotra@delhicapital.in', city: 'New Delhi', tier: 'Platinum Sommelier', points: 1250, balance: 0.0, limit: 25000.0 },
    { code: 'CUST-004', name: 'Priya Patel', phone: '+91 98450 66778', email: 'priya.patel@techcorp.com', city: 'Bengaluru', tier: 'Gold Reserve', points: 680, balance: 0.0, limit: 10000.0 },
    { code: 'CUST-005', name: 'Goa Beach Shack & Restobar', phone: '+91 98221 77889', email: 'manager@beachshackgoa.com', city: 'Calangute', tier: 'Corporate Wholesale (B2B)', points: 3100, balance: 18500.0, limit: 100000.0 }
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (code, name, phone, email, city, loyalty_tier, loyalty_points, current_balance, credit_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of customers) {
    insertCustomer.run(c.code, c.name, c.phone, c.email, c.city, c.tier, c.points, c.balance, c.limit);
  }

  // 9. Indian Staff / Branch Users
  const users = [
    { username: 'admin', password: 'admin123', name: 'Rajesh Sharma (Super Admin)', role: 'admin', branch_id: null, phone: '+91 98200 11001', email: 'admin@royalheritagewines.in' },
    { username: 'mumbai', password: 'mumbai123', name: 'Amit Kumar (Mumbai Bandra)', role: 'cashier', branch_id: 1, phone: '+91 98201 22002', email: 'bandra@royalheritagewines.in' },
    { username: 'delhi', password: 'delhi123', name: 'Vikram Singh (Delhi CP)', role: 'cashier', branch_id: 2, phone: '+91 98110 33003', email: 'delhi@royalheritagewines.in' },
    { username: 'bengaluru', password: 'bengaluru123', name: 'Suresh Gowda (Bengaluru)', role: 'cashier', branch_id: 3, phone: '+91 98450 44004', email: 'bengaluru@royalheritagewines.in' },
    { username: 'goa', password: 'goa123', name: 'Anthony D’Souza (Goa)', role: 'cashier', branch_id: 4, phone: '+91 98221 55005', email: 'goa@royalheritagewines.in' },
    { username: 'warehouse', password: 'warehouse123', name: 'Manoj Patil (Bhiwandi Hub)', role: 'manager', branch_id: 5, phone: '+91 98200 66006', email: 'logistics@royalheritagewines.in' },
    // Also include old aliases to prevent login failures if typed
    { username: 'downtown', password: 'downtown123', name: 'Amit Kumar (Mumbai Bandra)', role: 'cashier', branch_id: 1, phone: '+91 98201 22002', email: 'bandra@royalheritagewines.in' },
    { username: 'uptown', password: 'uptown123', name: 'Vikram Singh (Delhi CP)', role: 'cashier', branch_id: 2, phone: '+91 98110 33003', email: 'delhi@royalheritagewines.in' },
    { username: 'miami', password: 'miami123', name: 'Anthony D’Souza (Goa)', role: 'cashier', branch_id: 4, phone: '+91 98221 55005', email: 'goa@royalheritagewines.in' }
  ];

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (username, password, name, role, branch_id, phone, email, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  for (const u of users) {
    insertUser.run(u.username, u.password, u.name, u.role, u.branch_id, u.phone, u.email);
  }

  // 10. Sample Indian POS & B2B Sales Invoices
  const sampleSales = [
    {
      invoice_no: 'INV-2026-00001', branch_id: 1, customer_id: 1, customer_name: 'Rajesh Sharma',
      customer_phone: '+91 98201 98765', invoice_date: '2026-10-25', invoice_type: 'POS Counter',
      payment_method: 'Cash', status: 'Paid', subtotal: 1055.00, discount_amount: 50.00,
      tax_amount: 211.00, total_amount: 1216.00, paid_amount: 1216.00, balance_amount: 0.00,
      bank_id: 5, // Mumbai Cash Gullak
      items: [
        { product_id: 1, product_name: 'Royal Stag Deluxe Whisky 750ml (Khamba)', quantity: 1, unit_price: 680.00, cost_price: 540.00, tax_rate: 20.0, tax_amount: 136.00, line_total: 816.00 },
        { product_id: 18, product_name: 'Kingfisher Strong Premium Beer 650ml Bottle', quantity: 2, unit_price: 175.00, cost_price: 135.00, tax_rate: 20.0, tax_amount: 70.00, line_total: 420.00 },
        { product_id: 32, product_name: 'Bisleri Club Soda 750ml Glass Bottle', quantity: 1, unit_price: 20.00, cost_price: 15.00, tax_rate: 12.0, tax_amount: 2.40, line_total: 22.40 }
      ]
    },
    {
      invoice_no: 'INV-2026-00002', branch_id: 2, customer_id: 3, customer_name: 'Vikram Malhotra',
      customer_phone: '+91 98110 33445', invoice_date: '2026-10-25', invoice_type: 'POS Counter',
      payment_method: 'UPI / QR', status: 'Paid', subtotal: 1380.00, discount_amount: 0.00,
      tax_amount: 276.00, total_amount: 1656.00, paid_amount: 1656.00, balance_amount: 0.00,
      bank_id: 4, // UPI QR Soundbox
      items: [
        { product_id: 4, product_name: 'Blenders Pride Rare Premium Whisky 750ml', quantity: 1, unit_price: 920.00, cost_price: 740.00, tax_rate: 20.0, tax_amount: 184.00, line_total: 1104.00 },
        { product_id: 12, product_name: 'Old Monk Very Old Vatted XXX Rum 750ml (Khamba)', quantity: 1, unit_price: 460.00, cost_price: 360.00, tax_rate: 20.0, tax_amount: 92.00, line_total: 552.00 }
      ]
    },
    {
      invoice_no: 'INV-2026-00003', branch_id: 1, customer_id: 2, customer_name: 'The Grand Palace Hotel & Banquets',
      customer_phone: '+91 98200 11223', invoice_date: '2026-10-26', invoice_type: 'Wholesale/Corporate',
      payment_method: 'Account Credit', status: 'Partially Paid', subtotal: 37500.00, discount_amount: 1500.00,
      tax_amount: 7200.00, total_amount: 43200.00, paid_amount: 20000.00, balance_amount: 23200.00,
      bank_id: 1, // SBI Current A/c
      items: [
        { product_id: 1, product_name: 'Royal Stag Deluxe Whisky 750ml (Khamba)', quantity: 30, unit_price: 610.00, cost_price: 540.00, tax_rate: 20.0, tax_amount: 3660.00, line_total: 21960.00 },
        { product_id: 18, product_name: 'Kingfisher Strong Premium Beer 650ml Bottle', quantity: 60, unit_price: 155.00, cost_price: 135.00, tax_rate: 20.0, tax_amount: 1860.00, line_total: 11160.00 },
        { product_id: 23, product_name: 'Sula Dindori Reserve Shiraz 750ml', quantity: 12, unit_price: 790.00, cost_price: 680.00, tax_rate: 20.0, tax_amount: 1896.00, line_total: 11376.00 }
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
    // Post double entry journal voucher
    AccountingEngine.postSalesInvoice({ id: invoiceId, ...s }, s.items, s.bank_id);
  }

  // 11. Sample Inward Purchase Bill (Order from United Spirits to Bhiwandi Central Godown)
  const samplePurchase = {
    purchase_no: 'PO-IND-2026-0001', branch_id: 5, vendor_id: 1, supplier_invoice_no: 'TAX-USL-2026-901',
    purchase_date: '2026-10-20', due_date: '2026-11-20', status: 'Received',
    subtotal: 125000.00, tax_amount: 25000.00, total_amount: 150000.00, paid_amount: 50000.00, balance_amount: 100000.00,
    items: [
      { product_id: 6, quantity: 150, unit_cost: 480.00, tax_rate: 20.0, tax_amount: 14400.00, total_cost: 86400.00 },
      { product_id: 7, quantity: 200, unit_cost: 130.00, tax_rate: 20.0, tax_amount: 5200.00, total_cost: 31200.00 },
      { product_id: 15, quantity: 70, unit_cost: 340.00, tax_rate: 20.0, tax_amount: 4760.00, total_cost: 28560.00 }
    ]
  };

  const insertPoSQL = db.prepare(`
    INSERT INTO purchases (purchase_no, branch_id, vendor_id, supplier_invoice_no, purchase_date, due_date, status, subtotal, tax_amount, total_amount, paid_amount, balance_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPoItemSQL = db.prepare(`
    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, tax_rate, tax_amount, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const resPo = insertPoSQL.run(
    samplePurchase.purchase_no, samplePurchase.branch_id, samplePurchase.vendor_id, samplePurchase.supplier_invoice_no,
    samplePurchase.purchase_date, samplePurchase.due_date, samplePurchase.status,
    samplePurchase.subtotal, samplePurchase.tax_amount, samplePurchase.total_amount,
    samplePurchase.paid_amount, samplePurchase.balance_amount
  );
  const purchaseId = resPo.lastInsertRowid;
  for (const it of samplePurchase.items) {
    insertPoItemSQL.run(purchaseId, it.product_id, it.quantity, it.unit_cost, it.tax_rate, it.tax_amount, it.total_cost);
  }

  // Post purchase bill to accounting ledger
  AccountingEngine.postPurchaseBill({ id: purchaseId, ...samplePurchase }, samplePurchase.items, 1); // Paid from SBI

  console.log('🎉 Indian Wine & Liquor ERP Database successfully seeded!');
  return {
    branches: branches.length,
    products: products.length,
    categories: categories.length,
    vendors: vendors.length,
    customers: customers.length,
    users: users.length
  };
}

function cleanAndSeedDatabase() {
  cleanDatabase();
  initDatabase();
  return seedIndianData();
}

function seedDatabase() {
  initDatabase();
  const branchCount = db.prepare('SELECT COUNT(*) as c FROM branches').get().c;
  if (branchCount > 0) {
    console.log('Database already initialized. To reset cleanly to Indian catalog, use cleanAndSeedDatabase().');
    return;
  }
  seedIndianData();
}

if (require.main === module) {
  cleanAndSeedDatabase();
}

module.exports = {
  cleanDatabase,
  seedIndianData,
  cleanAndSeedDatabase,
  seedDatabase
};

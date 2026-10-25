const express = require('express');
const router = express.Router();
const { db } = require('../database');

// GET categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET products (with branch-specific stock or overall stock)
router.get('/', (req, res) => {
  try {
    const { branch_id, category_id, wine_type, search } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name,
        COALESCE((SELECT SUM(quantity) FROM branch_inventory WHERE product_id = p.id), 0) as total_stock,
        COALESCE((SELECT quantity FROM branch_inventory WHERE product_id = p.id AND branch_id = ?), 0) as branch_stock,
        COALESCE((SELECT rack_location FROM branch_inventory WHERE product_id = p.id AND branch_id = ?), 'Unassigned') as rack_location
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
    `;

    const branchParam = branch_id ? Number(branch_id) : 1;
    const params = [branchParam, branchParam];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(Number(category_id));
    }
    if (wine_type) {
      sql += ' AND p.wine_type = ?';
      params.push(wine_type);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.varietal LIKE ? OR p.region LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    sql += ' ORDER BY p.name ASC';

    const products = db.prepare(sql).all(...params);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single product with stock across all branches
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const branchStocks = db.prepare(`
      SELECT b.id as branch_id, b.name as branch_name, b.code as branch_code,
             COALESCE(bi.quantity, 0) as quantity, COALESCE(bi.rack_location, 'Unassigned') as rack_location
      FROM branches b
      LEFT JOIN branch_inventory bi ON bi.branch_id = b.id AND bi.product_id = ?
      ORDER BY b.id ASC
    `).all(id);

    res.json({ success: true, product, branchStocks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new product
router.post('/', (req, res) => {
  try {
    const {
      sku, barcode, name, category_id, wine_type, varietal,
      vintage_year, region, country, bottle_size, abv,
      cost_price, selling_price, wholesale_price, tax_rate,
      min_stock_level, description, tasting_notes, food_pairing
    } = req.body;

    if (!sku || !name || selling_price === undefined) {
      return res.status(400).json({ success: false, error: 'SKU, Name, and Selling Price are required' });
    }

    const checkSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (checkSku) {
      return res.status(400).json({ success: false, error: `SKU '${sku}' is already in use` });
    }

    const result = db.prepare(`
      INSERT INTO products (
        sku, barcode, name, category_id, wine_type, varietal,
        vintage_year, region, country, bottle_size, abv,
        cost_price, selling_price, wholesale_price, tax_rate,
        min_stock_level, description, tasting_notes, food_pairing, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      sku, barcode || sku, name, category_id || 1, wine_type || 'Red', varietal || '',
      vintage_year || null, region || '', country || '', bottle_size || '750ml',
      Number(abv) || 13.5, Number(cost_price) || 0, Number(selling_price),
      Number(wholesale_price) || Number(selling_price) * 0.85,
      Number(tax_rate) || 18.0, Number(min_stock_level) || 10,
      description || '', tasting_notes || '', food_pairing || ''
    );

    const newProductId = result.lastInsertRowid;

    // Initialize inventory for all branches
    const branches = db.prepare('SELECT id FROM branches').all();
    const insertInv = db.prepare(`
      INSERT OR IGNORE INTO branch_inventory (branch_id, product_id, quantity, rack_location)
      VALUES (?, ?, 0, 'Cellar A')
    `);
    const initInv = db.transaction(() => {
      for (const b of branches) {
        insertInv.run(b.id, newProductId);
      }
    });
    initInv();

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(newProductId);
    res.status(201).json({ success: true, product: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update product
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, barcode, category_id, wine_type, varietal,
      vintage_year, region, country, bottle_size, abv,
      cost_price, selling_price, wholesale_price, tax_rate,
      min_stock_level, description, tasting_notes, food_pairing
    } = req.body;

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    db.prepare(`
      UPDATE products
      SET name = COALESCE(?, name),
          barcode = COALESCE(?, barcode),
          category_id = COALESCE(?, category_id),
          wine_type = COALESCE(?, wine_type),
          varietal = COALESCE(?, varietal),
          vintage_year = ?,
          region = COALESCE(?, region),
          country = COALESCE(?, country),
          bottle_size = COALESCE(?, bottle_size),
          abv = COALESCE(?, abv),
          cost_price = COALESCE(?, cost_price),
          selling_price = COALESCE(?, selling_price),
          wholesale_price = COALESCE(?, wholesale_price),
          tax_rate = COALESCE(?, tax_rate),
          min_stock_level = COALESCE(?, min_stock_level),
          description = COALESCE(?, description),
          tasting_notes = COALESCE(?, tasting_notes),
          food_pairing = COALESCE(?, food_pairing)
      WHERE id = ?
    `).run(
      name, barcode, category_id, wine_type, varietal,
      vintage_year !== undefined ? vintage_year : null,
      region, country, bottle_size, abv,
      cost_price, selling_price, wholesale_price, tax_rate,
      min_stock_level, description, tasting_notes, food_pairing, id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  try {
    const { branch_id } = req.query;

    let branchFilter = '';
    const params = [];
    if (branch_id && branch_id !== 'all') {
      branchFilter = ' WHERE branch_id = ?';
      params.push(Number(branch_id));
    }

    // 1. Sales metrics
    const salesTotal = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(paid_amount), 0) as total_collected,
        COALESCE(SUM(balance_amount), 0) as total_receivable,
        COALESCE(COUNT(*), 0) as total_invoices
      FROM sales_invoices
      ${branchFilter}
    `).get(...params);

    const todayStr = new Date().toISOString().split('T')[0];
    let todayFilter = " WHERE invoice_date = ?";
    const todayParams = [todayStr];
    if (branch_id && branch_id !== 'all') {
      todayFilter += " AND branch_id = ?";
      todayParams.push(Number(branch_id));
    }

    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as today_revenue, COUNT(*) as today_count
      FROM sales_invoices
      ${todayFilter}
    `).get(...todayParams);

    // 2. Purchases & Payables
    const purchaseTotal = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_purchases,
        COALESCE(SUM(balance_amount), 0) as total_payable,
        COALESCE(COUNT(*), 0) as total_orders
      FROM purchases
      ${branchFilter}
    `).get(...params);

    // 3. Inventory valuation & bottle count
    let invFilter = '';
    const invParams = [];
    if (branch_id && branch_id !== 'all') {
      invFilter = ' WHERE bi.branch_id = ?';
      invParams.push(Number(branch_id));
    }

    const inventoryStats = db.prepare(`
      SELECT 
        COALESCE(SUM(bi.quantity), 0) as total_bottles,
        COALESCE(SUM(bi.quantity * p.cost_price), 0) as total_cost_value,
        COALESCE(SUM(bi.quantity * p.selling_price), 0) as total_retail_value,
        COALESCE(COUNT(CASE WHEN bi.quantity <= p.min_stock_level THEN 1 END), 0) as low_stock_count
      FROM branch_inventory bi
      JOIN products p ON bi.product_id = p.id
      ${invFilter}
    `).get(...invParams);

    // 4. Low stock wine list
    const lowStockWines = db.prepare(`
      SELECT bi.product_id, bi.branch_id, bi.quantity, p.min_stock_level, p.name as product_name, p.sku,
             b.name as branch_name, p.vintage_year, p.bottle_size, p.varietal
      FROM branch_inventory bi
      JOIN products p ON bi.product_id = p.id
      JOIN branches b ON bi.branch_id = b.id
      WHERE bi.quantity <= p.min_stock_level
      ${branch_id && branch_id !== 'all' ? 'AND bi.branch_id = ?' : ''}
      ORDER BY bi.quantity ASC
      LIMIT 6
    `).all(...(branch_id && branch_id !== 'all' ? [Number(branch_id)] : []));

    // 5. Liquid bank & cash balance
    let bankFilter = '';
    const bankParams = [];
    if (branch_id && branch_id !== 'all') {
      bankFilter = ' WHERE branch_id = ? OR branch_id IS NULL';
      bankParams.push(Number(branch_id));
    }
    const bankLiquid = db.prepare(`
      SELECT COALESCE(SUM(current_balance), 0) as total_liquid
      FROM bank_accounts
      ${bankFilter}
    `).get(...bankParams);

    // 6. Top Selling Wines
    let topFilter = '';
    const topParams = [];
    if (branch_id && branch_id !== 'all') {
      topFilter = ' WHERE si.branch_id = ?';
      topParams.push(Number(branch_id));
    }
    const topSellingWines = db.prepare(`
      SELECT sii.product_id, sii.product_name, p.sku, p.varietal, p.region,
             SUM(sii.quantity) as bottles_sold,
             SUM(sii.line_total) as revenue_generated
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.invoice_id = si.id
      JOIN products p ON sii.product_id = p.id
      ${topFilter}
      GROUP BY sii.product_id
      ORDER BY bottles_sold DESC
      LIMIT 5
    `).all(...topParams);

    // 7. Recent Invoices
    const recentInvoices = db.prepare(`
      SELECT si.id, si.invoice_no, si.customer_name, si.invoice_date, si.total_amount, si.status, si.payment_method,
             b.name as branch_name
      FROM sales_invoices si
      JOIN branches b ON si.branch_id = b.id
      ${branchFilter}
      ORDER BY si.id DESC
      LIMIT 5
    `).all(...params);

    // 8. Recent Purchases
    const recentPurchases = db.prepare(`
      SELECT p.id, p.purchase_no, p.supplier_invoice_no, p.purchase_date, p.total_amount, p.status,
             v.name as vendor_name, b.name as branch_name
      FROM purchases p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN branches b ON p.branch_id = b.id
      ${branchFilter}
      ORDER BY p.id DESC
      LIMIT 5
    `).all(...params);

    // Calculate gross profit
    const cogsQuery = db.prepare(`
      SELECT COALESCE(SUM(sii.quantity * sii.cost_price), 0) as total_cogs
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.invoice_id = si.id
      ${topFilter}
    `).get(...topParams);

    const grossProfit = salesTotal.total_revenue - cogsQuery.total_cogs;
    const grossMarginPct = salesTotal.total_revenue > 0 ? (grossProfit / salesTotal.total_revenue) * 100 : 0;

    res.json({
      success: true,
      kpis: {
        totalRevenue: Math.round(salesTotal.total_revenue * 100) / 100,
        todayRevenue: Math.round(todaySales.today_revenue * 100) / 100,
        todayCount: todaySales.today_count,
        totalInvoices: salesTotal.total_invoices,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossMarginPct: Math.round(grossMarginPct * 10) / 10,
        totalBottles: inventoryStats.total_bottles,
        inventoryCostValuation: Math.round(inventoryStats.total_cost_value * 100) / 100,
        inventoryRetailValuation: Math.round(inventoryStats.total_retail_value * 100) / 100,
        lowStockCount: inventoryStats.low_stock_count,
        totalReceivable: Math.round(salesTotal.total_receivable * 100) / 100,
        totalPayable: Math.round(purchaseTotal.total_payable * 100) / 100,
        liquidBankCash: Math.round(bankLiquid.total_liquid * 100) / 100
      },
      lowStockWines,
      topSellingWines,
      recentInvoices,
      recentPurchases
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

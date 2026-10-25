# 🍷 Grand Cru Wine Shop ERP - Multi-Branch Management System

A comprehensive, enterprise-grade Wine Store ERP, Point of Sale (POS), Inventory, Purchasing, Banking, Accounting, and Receipts/Payments Management System built for single or multi-outlet wine businesses and central cellars.

---

## 🌟 Core Modules & Features

### 1. 🏢 Multi-Branch & Outlet Management
- **Multiple Outlets & Hubs:** Seamlessly manage retail wine boutiques, tasting lounges, waterfront cellars, and central distribution warehouses.
- **Top Bar Branch Switcher:** Filter KPIs, inventory, sales, purchases, and accounting by an individual branch or view **All Branches (Consolidated)** in real-time.
- **Branch Configuration:** Store name, address, phone, email, State Liquor License number, and assigned Lead Sommelier / Manager.

### 2. 🍇 Wine Catalog & Master SKU Management
- **Sommelier Attributes:** Grape Varietal, Vintage Year (or Non-Vintage), Appellation / Region (Bordeaux, Napa Valley, Marlborough, Piedmont, etc.), Country of Origin, Bottle Volume (750ml, 375ml, 1.5L Magnum, 3.0L), Alcohol By Volume (ABV %), and Category (Red, White, Rosé, Champagne & Sparkling, Fortified/Port, Accessories).
- **Tasting Notes & Pairings:** Sommelier tasting profiles, aroma notes, and culinary food pairings.
- **Multi-Tier Pricing:** Cost Price, Retail Selling Price, Wholesale Price, and Liquor Excise / VAT Tax rates.
- **Branch Stock Breakdown:** Click any wine to see real-time bottle counts and cellar bin locations across every outlet.

### 3. 📦 Cellar Inventory & Inter-Branch Stock Transfers
- **Stock on Hand:** Live tracking of bottle quantities, batch/lot tracking, minimum reorder thresholds, and inventory cost & retail valuations.
- **Cellar Rack & Bin Location:** Tag wines to physical cellar locations (e.g., *Aisle 3, Rack B, Bin 14*).
- **Inter-Branch Stock Movement:**
  - Create stock transfer requests between branches (e.g., Central Distribution Hub → Downtown Flagship Store).
  - Source branch stock is immediately decremented upon dispatch.
  - Destination branch verifies and confirms receipt with one click to increment destination stock.
- **Breakage, Spoilage & Tasting Flight Write-Offs:**
  - Record bottle breakage, corked/oxidized wine taint, sommelier tasting samples, and physical inventory audit adjustments.
  - Automatically writes off inventory value and posts loss to the General Ledger.

### 4. 🛒 Purchasing & Winery / Vendor Management
- **Wineries & Distributors Directory:** Supplier contact details, country, tax ID, and agreed credit payment terms (e.g., 30 or 45 days).
- **Inward Purchase Bills:** Record container wine shipments or local distributor drops.
- **Stock Auto-Intake:** Receiving a purchase bill automatically increments cellar inventory at the specified branch and updates cost prices.
- **Accounts Payable (AP):** Automatically tracks unpaid balances and generates double-entry entries to Accounts Payable.
- **Vendor Wire Disbursements:** Disburse payments against outstanding bills via Wire Transfer, Commercial Check, or Corporate Card.

### 5. 🛒 Point of Sale (POS) Counter & Sales Invoicing
- **Fast POS Interface:** Optimized for fast counter checkouts with instant search by wine name, varietal, SKU, or barcode scanning.
- **Category & Varietal Quick Filters:** One-click filtering by Red, White, Sparkling, Rosé, Fortified, and Accessories.
- **Real-Time Stock Safeguards:** Prevents overselling by checking branch stock limits before adding to cart.
- **Multiple Payment Methods:** Cash (with automated cash tendered and change returned calculator), Credit Card, UPI / QR, and Account Credit.
- **Thermal Receipt & Tax Invoice Printing:**
  - Instant POS thermal receipt print layout with outlet licensing details and age compliance notice.
  - Standard A4 Tax Invoice with tax registration, itemized liquor excise, discount vouchers, and sommelier signature line.
- **Customer Loyalty Points:** Automatically awards loyalty reward points on completed sales.

### 6. 🏦 Banking & Liquidity Management
- **Multiple Accounts:** Commercial checking accounts (Chase, Wells Fargo), Merchant Card Settlement gateways (Stripe), and Counter Cash Drawers per branch.
- **Inter-Account Transfers / Safe Drops:** Safely move daily cash drawer takings to commercial bank accounts.
- **Bank Statement Reconciliation:** Detailed transaction history (Deposits, Withdrawals, Transfers) with Cleared / Reconciled status tracking.

### 7. 💳 Receipts & Payment Vouchers
- **Customer Receipts (Inflows):** Collect receivables against outstanding sales invoices or advance customer deposits.
- **Payment Vouchers (Outflows):** Disburse vendor bill payments or log operating expense vouchers (Cellar Climate Control, Store Lease, Sommelier Wages, State Liquor Board Regulatory Compliance Fees, Merchant Card Processing, Packaging).

### 8. ⚖️ General Ledger & Financial Accounting (Double-Entry Engine)
- **Standard Wine Industry Chart of Accounts (COA):**
  - Assets (`1000s`), Liabilities (`2000s`), Equity (`3000s`), Revenue (`4000s`), COGS (`5000s`), and Operating Expenses (`6000s`).
- **Automated Bookkeeping Engine:**
  - Every sale, purchase bill, stock adjustment, receipt, and payment automatically generates balanced debit and credit journal lines.
- **Financial Reports:**
  - **Profit & Loss Statement (Income Statement):** Net Sales, COGS, Gross Margin %, Operating Expenses, and Net Operating Profit.
  - **Balance Sheet:** Assets = Liabilities + Equity (with real-time mathematical balance verification).
  - **Trial Balance:** Live ledger audit ensuring Debits equal Credits.
  - **General Journal & Audit Log:** Line-by-line audit trail of every financial transaction with manual journal voucher support.

### 9. 👥 Customers & Sommelier Wine Club
- **Club Membership Tiers:** Silver Cellar, Gold Reserve, Platinum Sommelier, and Corporate Wholesale.
- **Legal Compliance:** Mandatory 21+ legal drinking age verification certification flag.
- **Receivables & Credit Limits:** Track customer balances, lifetime spend, and available credit lines.

---

## 🛠️ Architecture & Tech Stack

- **Backend:** Node.js, Express 5, SQLite database with `better-sqlite3` in WAL mode for high concurrency.
- **Accounting Engine:** Double-entry bookkeeping engine with debit/credit balance verification.
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React icons.
- **Storage:** Embedded SQLite database located at `data/wineshop.db`.

---

## 🚀 Getting Started

### 1. Start the Unified Server (Runs Backend & Built Frontend)
```bash
npm start
```
The application will be accessible at:
- **Web Application:** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 2. Development Mode (with Hot Reload)
To run frontend and backend in development mode:
- Terminal 1 (Backend API):
  ```bash
  npm run server
  ```
- Terminal 2 (Vite React Client):
  ```bash
  npm run client
  ```
  Vite client runs on [http://localhost:3000](http://localhost:3000) with automatic proxying to backend on port 5000.

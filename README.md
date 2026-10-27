# 🍷 Royal Heritage - Indian Wine & Liquor Shop ERP (शाही वाइन & लिकर शॉप)

A comprehensive, enterprise-grade Multi-Branch Indian Wine, IMFL & Beer Shop ERP, Point of Sale (POS), Godown Inventory, Purchasing, Banking (UPI & Cash), Accounting, and State Excise Compliance Management System.

---

## 🌟 Core Modules & Indian Features

### 1. 🏢 Multi-Branch & Outlet Management (दुकानें व गोदाम)
- **Indian Retail Outlets & Godowns:** Manage retail shops (FL-II / L-2 / CL-2 vends) in Mumbai, Delhi, Bengaluru, Goa, and central bonded godowns (Bhiwandi).
- **State Excise License Tracking:** Track State Excise license numbers (e.g. `MH-FL-II-2026-8819`, `DL-L-2-2026-4412`).
- **Role-Based Branch Locking:** Cashiers only see and bill for their assigned outlet counter; Super Admin manages all India operations.

### 2. 🍾 Indian Liquor Catalog & Vernacular Packaging (IMFL, Beer & Wine)
- **Categories:** IMFL Whisky, Indian Beer, Indian Wine (Sula, Grover, Fratelli), IMFL Rum (Old Monk), Vodka & Gin, Imported Premium Scotch, Ready-to-Drink (RTD Breezer).
- **Indian Bottle Sizes:** Khamba / Full (750ml), Adha / Half (375ml), Pauva / Nip (180ml), Beer Bottles (650ml), Cans (500ml), Pints (330ml).
- **State Liquor VAT & Excise Cess:** Indian tax structure per bottle and state.

### 3. 📦 Godown Inventory & Inter-Branch Stock Transfers (गोदाम स्टॉक)
- **Live Bottle Stock:** Real-time bottle stock tracking, batch/lot tracking, minimum reorder thresholds.
- **Inter-Branch Stock Movement:** Move stock between central godown and retail vends with verification.
- **Breakage & Spoilage Write-Offs:** Track bottle breakage, seal leaks, and excise lab samples with automatic ledger write-offs.

### 4. 🛒 Purchasing & Indian Distilleries (आवक खरीद)
- **Indian Distilleries & Breweries:** United Spirits / Diageo India, Pernod Ricard, United Breweries (Kingfisher), Sula Vineyards, Mohan Meakin (Old Monk), Radico Khaitan.
- **Inward Purchase Invoices (TP / Challan):** Auto-restock godown inventory and update Accounts Payable.

### 5. 🛒 POS Billing Counter & Thermal Invoices (गल्ला व बिलिंग)
- **Barcode & Fast Name Search:** Instant checkout with barcode scanner or name search.
- **Indian Payment Methods:** Cash (नकद - quick note buttons ₹50, ₹100, ₹200, ₹500), UPI QR Soundbox (PhonePe, GPay, Paytm), Cards, and Udhar Khata (ग्राहक खाता).
- **Thermal Receipt & Tax Invoice:** State Excise license display, age 21+/25+ compliance certified, itemized VAT.

### 6. 🏦 Indian Banking & Cash Drawer (बैंक व गल्ला)
- **Indian Bank Accounts:** SBI, HDFC Bank, ICICI Bank, Axis Bank, UPI QR Settlement Account, Counter Cash Drawers (गल्ला).
- **Cash Deposit (गल्ला बैंक में जमा):** Move daily cash drawer takings safely to commercial bank accounts.

### 7. ⚖️ Double-Entry Accounting & Ledger (बहीखाता)
- **Indian Chart of Accounts (COA):** Assets, Liabilities, Equity, Sales Revenue, Excise Tax Ledgers, COGS, Operating Expenses.
- **Reports:** Profit & Loss Statement, Balance Sheet, Trial Balance, General Journal.

### 8. 👥 Customers & Udhar Khata (ग्राहक व उधार खाता)
- **Customer Profiles:** Phone numbers (+91), loyalty tier, credit limits in INR (₹).
- **Age 21+/25+ Excise Compliance.**

### 9. 🧹 Clean & Reset Indian Database on Demand
- Reset database anytime using the UI button on Dashboard or running:
  ```bash
  npm run clean-db
  ```
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

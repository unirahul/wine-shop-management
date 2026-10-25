import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Wine,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  CheckCircle,
  Printer,
  X,
  User,
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';

export default function PointOfSale() {
  const { branches, selectedBranchId, formatCurrency, addToast, triggerRefresh } = useApp();

  // Selected branch for POS billing
  const [posBranchId, setPosBranchId] = useState(
    selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id || 1)
  );

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWineType, setSelectedWineType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Customer & Payment
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [cashTendered, setCashTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    if (selectedBranchId !== 'all') {
      setPosBranchId(selectedBranchId);
    }
  }, [selectedBranchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, custsRes, banksRes] = await Promise.all([
        api.getProducts({ branch_id: posBranchId }),
        api.getCategories(),
        api.getCustomers(),
        api.getBankAccounts(posBranchId)
      ]);

      if (prodsRes.success) setProducts(prodsRes.products || []);
      if (catsRes.success) setCategories(catsRes.categories || []);
      if (custsRes.success) setCustomers(custsRes.customers || []);
      if (banksRes.success) {
        setBankAccounts(banksRes.accounts || []);
        if (banksRes.accounts?.length > 0) {
          // Pre-select cash drawer for this branch
          const drawer = banksRes.accounts.find(a => a.account_type?.includes('Cash Drawer'));
          setSelectedBankId(drawer ? drawer.id : banksRes.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('POS load error:', err);
      addToast('Error loading POS catalog: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [posBranchId]);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
    const matchType = selectedWineType === 'all' || p.wine_type === selectedWineType;
    const matchSearch = !searchQuery || (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery)) ||
      (p.varietal && p.varietal.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchCat && matchType && matchSearch;
  });

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (product.branch_stock <= currentQtyInCart) {
      addToast(`Cannot add more "${product.name}". Available stock in this branch: ${product.branch_stock}`, 'error');
      return;
    }

    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        bottle_size: product.bottle_size,
        vintage_year: product.vintage_year,
        unit_price: product.selling_price,
        cost_price: product.cost_price,
        tax_rate: product.tax_rate,
        quantity: 1,
        branch_stock: product.branch_stock
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.branch_stock) {
          addToast(`Maximum available stock is ${item.branch_stock} bottles`, 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const taxAmount = cart.reduce((sum, item) => {
    const lineTotal = item.unit_price * item.quantity;
    return sum + (lineTotal * ((item.tax_rate || 0) / 100));
  }, 0);
  const discount = Number(discountAmount) || 0;
  const grandTotal = Math.max(0, Math.round((subtotal + taxAmount - discount) * 100) / 100);

  const tenderedNum = Number(cashTendered) || 0;
  const changeDue = paymentMethod === 'Cash' && tenderedNum > grandTotal ? (tenderedNum - grandTotal) : 0;

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (custId) {
      const c = customers.find(x => String(x.id) === String(custId));
      if (c) {
        setCustomerName(c.name);
        setCustomerPhone(c.phone || '');
      }
    } else {
      setCustomerName('Walk-in Guest');
      setCustomerPhone('');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Please add wines to the bill.', 'error');
      return;
    }
    if (paymentMethod === 'Cash' && tenderedNum > 0 && tenderedNum < grandTotal) {
      addToast(`Cash tendered ($${tenderedNum.toFixed(2)}) is less than total bill ($${grandTotal.toFixed(2)})`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        branch_id: posBranchId,
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        customer_name: customerName,
        customer_phone: customerPhone,
        invoice_type: 'POS Counter',
        payment_method: paymentMethod,
        bank_account_id: selectedBankId ? Number(selectedBankId) : null,
        items: cart.map(it => ({
          product_id: it.product_id,
          unit_price: it.unit_price,
          quantity: it.quantity,
          tax_rate: it.tax_rate
        })),
        discount_amount: discount,
        paid_amount: grandTotal,
        change_returned: changeDue,
        notes: `POS transaction at ${new Date().toLocaleTimeString()}`
      };

      const res = await api.createSale(payload);
      if (res.success) {
        addToast(`Sale finalized! Invoice #${res.invoiceNo} generated`, 'success');
        setCompletedSale({
          invoiceNo: res.invoiceNo,
          invoiceId: res.invoiceId,
          date: new Date().toLocaleString(),
          branch: branches.find(b => String(b.id) === String(posBranchId)),
          customerName,
          items: [...cart],
          subtotal,
          discount,
          taxAmount,
          grandTotal,
          paymentMethod,
          cashTendered: tenderedNum,
          changeDue
        });

        // Reset cart
        setCart([]);
        setDiscountAmount(0);
        setCashTendered('');
        triggerRefresh();
        loadData(); // reload updated stock
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-5 max-w-[1700px] mx-auto">
      {/* LEFT: Product Catalog & Search (60%) */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/90">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Branch Selector for POS */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                POS Branch:
              </span>
              <select
                value={posBranchId}
                onChange={(e) => setPosBranchId(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Search bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode or search wine name / SKU..."
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wine-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Wine Type Quick Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['all', 'Red', 'White', 'Sparkling', 'Rosé', 'Fortified', 'Accessories'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedWineType(type)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedWineType === type
                    ? 'bg-wine-700 text-white shadow-sm ring-1 ring-wine-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All Wine Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Loading cellar inventory...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <Wine className="w-12 h-12 text-slate-700" />
              <p className="text-sm">No wines match the selected search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => {
                const inCart = cart.find(c => c.product_id === p.id);
                const outOfStock = p.branch_stock <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !outOfStock && addToCart(p)}
                    className={`relative rounded-xl p-3.5 border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      outOfStock
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'bg-wine-950/40 border-wine-600 shadow-md ring-1 ring-wine-500/40'
                        : 'bg-slate-800/40 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      {/* Wine Type Badge */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.wine_type === 'Red' ? 'bg-red-950 text-red-300 border border-red-800/50' :
                          p.wine_type === 'White' ? 'bg-amber-950 text-amber-200 border border-amber-800/50' :
                          p.wine_type === 'Sparkling' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800/50' :
                          p.wine_type === 'Rosé' ? 'bg-pink-950 text-pink-300 border border-pink-800/50' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {p.wine_type}
                        </span>

                        <span className={`text-[10px] font-mono font-semibold ${
                          outOfStock ? 'text-rose-400' : p.branch_stock <= p.min_stock_level ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {outOfStock ? 'Sold Out' : `${p.branch_stock} in stock`}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-xs text-white leading-tight line-clamp-2">
                        {p.name}
                      </h3>

                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {p.varietal} {p.vintage_year ? `• ${p.vintage_year}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{p.region}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-sm">
                        {formatCurrency(p.selling_price)}
                      </span>

                      {inCart ? (
                        <span className="w-6 h-6 rounded-full bg-wine-600 text-white font-bold text-xs flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-700 text-slate-200 flex items-center justify-center hover:bg-amber-600 hover:text-slate-950 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Bill & Checkout Panel (40%) */}
      <div className="w-full lg:w-[460px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Customer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Customer / Member
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
              Age 21+ Verified ✓
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Walk-in Guest</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.loyalty_tier})
                </option>
              ))}
            </select>

            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Guest Phone #"
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
            />
          </div>
        </div>

        {/* Cart Item Lines */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <ShoppingCart className="w-10 h-10 text-slate-700" />
              <p className="text-xs font-medium">No wine bottles in current bill.</p>
              <p className="text-[11px] text-slate-600">Select items from the catalog on the left.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product_id}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-100 truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    {formatCurrency(item.unit_price)} × {item.quantity} • Tax: {item.tax_rate}%
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-amber-300">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 mt-0.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Payment Panel */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
          {/* Subtotals, Tax & Discount */}
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Liquor Excise & Sales Tax</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" />
                Discount Voucher ($)
              </span>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-20 bg-slate-800 border border-slate-700 text-right px-2 py-0.5 rounded text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-between items-center text-base font-bold text-white pt-2 border-t border-slate-800">
              <span className="font-serif">Grand Total</span>
              <span className="text-amber-300 font-sans">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'Cash', icon: Banknote },
                { id: 'Credit Card', icon: CreditCard },
                { id: 'UPI / QR', icon: QrCode },
                { id: 'Account Credit', icon: Building }
              ].map(pm => {
                const Icon = pm.icon;
                const isSel = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{pm.id}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tendered Calculator if Cash */}
            {paymentMethod === 'Cash' && (
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Cash Received ($):</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={grandTotal.toString()}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-xs text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {changeDue > 0 && (
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 pt-1 border-t border-slate-700/50">
                    <span>Change to Return:</span>
                    <span className="text-sm font-bold">{formatCurrency(changeDue)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Deposit Bank / Cash Drawer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Settlement Account:</span>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] rounded px-2 py-1 focus:outline-none"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.account_name} ({formatCurrency(b.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Finalize Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-amber-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Finalizing Transaction...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Complete Sale ({formatCurrency(grandTotal)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RECEIPT PRINT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setCompletedSale(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Receipt Area */}
            <div id="printable-area" className="space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h2 className="font-serif font-black text-lg text-slate-950 tracking-wider uppercase">
                  Grand Cru Wines
                </h2>
                <p className="text-[11px] text-slate-600 font-sans">{completedSale.branch?.name}</p>
                <p className="text-[10px] text-slate-500 font-sans">{completedSale.branch?.address}, {completedSale.branch?.city}</p>
                <p className="text-[10px] text-slate-500 font-sans">Liquor Lic: {completedSale.branch?.license_number}</p>
                <p className="text-[10px] text-slate-500 font-sans">Tel: {completedSale.branch?.phone}</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Invoice #:</span>
                  <span className="font-bold">{completedSale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date/Time:</span>
                  <span>{completedSale.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedSale.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-slate-300 pb-2 space-y-1.5">
                <div className="flex justify-between font-bold text-[11px]">
                  <span>Item</span>
                  <span>Qty × Price</span>
                </div>
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="truncate max-w-[170px]">
                      <p className="font-medium text-slate-900 truncate">{it.name}</p>
                      <p className="text-[9px] text-slate-500">{it.bottle_size} {it.vintage_year || ''}</p>
                    </div>
                    <div className="text-right">
                      <span>{it.quantity} × {it.unit_price.toFixed(2)}</span>
                      <p className="font-bold">${(it.quantity * it.unit_price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${completedSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${completedSale.taxAmount.toFixed(2)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-${completedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-400 text-slate-950">
                  <span>TOTAL PAID:</span>
                  <span>${completedSale.grandTotal.toFixed(2)}</span>
                </div>

                {completedSale.paymentMethod === 'Cash' && completedSale.cashTendered > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>Cash Tendered:</span>
                      <span>${completedSale.cashTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Change Given:</span>
                      <span>${completedSale.changeDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-sans space-y-0.5">
                <p className="font-bold text-slate-800">Santé! Thank you for your patronage.</p>
                <p>Please drink responsibly. Must be 21+.</p>
                <p className="text-[9px]">Wine returns accepted within 7 days with cork intact.</p>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="mt-5 flex gap-2 no-print font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

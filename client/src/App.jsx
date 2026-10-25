import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PointOfSale from './pages/PointOfSale';
import SalesInvoices from './pages/SalesInvoices';
import ProductsCatalog from './pages/ProductsCatalog';
import Inventory from './pages/Inventory';
import Purchasing from './pages/Purchasing';
import Banking from './pages/Banking';
import ReceiptsPayments from './pages/ReceiptsPayments';
import Accounting from './pages/Accounting';
import Branches from './pages/Branches';
import Customers from './pages/Customers';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'pos':
        return <PointOfSale />;
      case 'sales':
        return <SalesInvoices />;
      case 'catalog':
        return <ProductsCatalog />;
      case 'inventory':
        return <Inventory />;
      case 'purchasing':
        return <Purchasing />;
      case 'banking':
        return <Banking />;
      case 'receipts_payments':
        return <ReceiptsPayments />;
      case 'accounting':
        return <Accounting />;
      case 'branches':
        return <Branches />;
      case 'customers':
        return <Customers />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

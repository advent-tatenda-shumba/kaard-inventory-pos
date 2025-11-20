import React, { useState, useEffect } from 'react';
import './App.css';
import { getItem, setItem } from './utils/storage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POS from './components/POS';
import Sales from './components/Sales';
import StockTransfer from './components/StockTransfer';
import Reports from './components/Reports';
import ReceiptViewer from './components/ReceiptViewer';
import StockRequests from './components/StockRequests';
import DailySalesReport from './components/DailySalesReport';

const LOCATIONS = {
  warehouse: 'Warehouse (Admin Only)',
  shop1: 'Shop 1 - Main Grocery',
  shop2: 'Kaard Shop - GTS',
  shop3: 'Kaard Supermarket - Quickstop',
  shop4: 'Kaard Liquor - GTS',
  shop5: 'Kaard Liquor - Masasa',
  shop6: 'Fancy Liquor - Kadoma'
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState('shop1');
  const [viewingReceiptId, setViewingReceiptId] = useState(null);

  useEffect(() => {
    const user = getItem('pos_user', null);
    if (user) {
      setCurrentUser(user);
    }

    // Check if URL has receipt ID (for QR code scanning)
    const path = window.location.pathname;
    const match = path.match(/\/receipt\/(\d+)/);
    if (match) {
      setViewingReceiptId(match[1]);
    }
  }, []);

  // --- THIS IS THE FIXED USEEFFECT ---
  useEffect(() => {
    // We MUST check if currentUser exists before checking their shop
    if (currentUser) {
      if (currentUser.shop !== 'all') {
        setSelectedLocation(currentUser.shop);
      } else if (currentUser.role === 'admin') {
        setSelectedLocation('warehouse'); // Admin starts at warehouse
      }
    }
  }, [currentUser]);
  // ----------------------------------

  const handleLogin = (user) => {
    setCurrentUser(user);
    setItem('pos_user', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setItem('pos_user', null);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // If viewing a receipt from QR code
  if (viewingReceiptId) {
    return <ReceiptViewer receiptId={viewingReceiptId} />;
  }

  const renderPage = () => {
    const props = { 
      selectedLocation, 
      userRole: currentUser?.role,
      currentUser,
      onNavigate: handleNavigate 
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...props} />;
      case 'inventory':
        return <Inventory {...props} />;
      case 'pos':
        return <POS {...props} />;
      case 'sales':
        return <Sales {...props} />;
      case 'dailyreport':
        return <DailySalesReport {...props} />;
      case 'transfer':
        return <StockTransfer {...props} currentLocation={selectedLocation} />;
      case 'requests':
        return <StockRequests {...props} />;
      case 'reports':
        return <Reports {...props} />;
      default:
        return <Dashboard {...props} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="nav-left">
          <h2 className="logo-text">Kaard Inventory & POS</h2>
          <select 
              value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="location-select"
                disabled={currentUser?.shop !== 'all'}
              >
                {Object.entries(LOCATIONS)
                  .filter(([key]) => currentUser?.role === 'admin' || key !== 'warehouse')
                  .map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))
                }
          </select>
        </div>

        <nav className="nav-links">
          <button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
          <button className={currentPage === 'inventory' ? 'active' : ''} onClick={() => setCurrentPage('inventory')}>Inventory</button>
          <button className={currentPage === 'pos' ? 'active' : ''} onClick={() => setCurrentPage('pos')}>POS</button>
          <button className={currentPage === 'sales' ? 'active' : ''} onClick={() => setCurrentPage('sales')}>Sales</button>
            {/* Daily Report for Cashiers */}
            {currentUser?.role === 'cashier' && (
              <button 
                className={currentPage === 'dailyreport' ? 'active' : ''} 
                onClick={() => setCurrentPage('dailyreport')}
              >
                Daily Report
              </button>
            )}

            {currentUser?.role !== 'cashier' && (
              <>
                <button 
                  className={currentPage === 'transfer' ? 'active' : ''} 
                  onClick={() => setCurrentPage('transfer')}
                >
                  Transfer
                </button>

                <button 
                  className={currentPage === 'requests' ? 'active' : ''} 
                  onClick={() => setCurrentPage('requests')}
                >
                  Stock Requests
                </button>

                <button 
                  className={currentPage === 'reports' ? 'active' : ''} 
                  onClick={() => setCurrentPage('reports')}
                >
                  Reports
                </button>
              </>
            )}
        </nav>

        <div className="nav-user">
          <span>{currentUser?.username} ({currentUser?.role})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
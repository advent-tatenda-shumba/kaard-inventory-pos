import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
// NOTE: Removed 'uploadLocalDataToFirebase' import since the button is gone

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
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // 1. Wait for Auth Object
  useEffect(() => {
    if (auth) {
      setAuthReady(true);
    } else {
      console.error("Waiting for Firebase Auth...");
    }
  }, []);

  // 2. Listen for User
  useEffect(() => {
    if (!authReady) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          username: user.email.split('@')[0],
          role: user.email.includes('admin') ? 'admin' : 'cashier',
          shop: 'all'
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authReady]);

  // Check URL for receipt
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/receipt\/(\w+)/);
    if (match) {
      setViewingReceiptId(match[1]);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.shop !== 'all') {
        setSelectedLocation(currentUser.shop);
      } else if (currentUser.role === 'admin') {
        setSelectedLocation('warehouse');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    if (auth) signOut(auth);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (!authReady || loading) return <div className="loading">Loading System...</div>;

  if (viewingReceiptId) {
    return <ReceiptViewer receiptId={viewingReceiptId} />;
  }

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  const renderPage = () => {
    const props = { 
      selectedLocation, 
      userRole: currentUser?.role,
      currentUser,
      onNavigate: handleNavigate 
    };

    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'inventory': return <Inventory {...props} />;
      case 'pos': return <POS {...props} />;
      case 'sales': return <Sales {...props} />;
      case 'dailyreport': return <DailySalesReport {...props} />;
      case 'transfer': return <StockTransfer {...props} currentLocation={selectedLocation} />;
      case 'requests': return <StockRequests {...props} />;
      case 'reports': return <Reports {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="nav-left">
          <h2 className="logo-text">Kaard POS</h2>
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
          
          {/* RESTORED BUTTONS FOR CASHIERS */}
          {currentUser?.role === 'cashier' && (
            <button 
              className={currentPage === 'dailyreport' ? 'active' : ''} 
              onClick={() => setCurrentPage('dailyreport')}
            >
              Daily Report
            </button>
          )}

          {/* RESTORED BUTTONS FOR ADMIN/MANAGERS */}
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
          <span>{currentUser?.username}</span>
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
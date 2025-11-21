import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Removed setDoc
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
import Welcome from './components/Welcome';

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
  const [showWelcome, setShowWelcome] = useState(true);

  // 1. Wait for Auth Object
  useEffect(() => {
    if (auth) {
      setAuthReady(true);
    } else {
      console.error("Firebase Auth not ready");
    }
  }, []);

  // 2. Listen for User & Fetch Profile
  useEffect(() => {
    if (!authReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              username: userData.username,
              role: userData.role,
              shop: userData.shop
            });
          } else {
            console.log('User profile not found in Firestore');
            // Set basic user but restrict access
            setCurrentUser({
               uid: user.uid,
               email: user.email,
               role: 'setup', // This triggers the "Contact Admin" screen
               shop: 'all'
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
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
      setShowWelcome(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.shop && currentUser.shop !== 'all') {
        setSelectedLocation(currentUser.shop);
      } else if (currentUser.role === 'admin') {
        setSelectedLocation('warehouse');
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    if (auth) signOut(auth);
    setCurrentPage('dashboard');
    setShowWelcome(true);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // --- RENDER LOGIC ---

  if (showWelcome && !viewingReceiptId) {
    return <Welcome onEnter={() => setShowWelcome(false)} />;
  }

  if (!authReady || loading) {
    return <div className="loading">Loading System...</div>;
  }

  if (viewingReceiptId) {
    return <ReceiptViewer receiptId={viewingReceiptId} />;
  }

  // If not logged in, show Login
  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  // If logged in but role is 'setup' (Profile missing in DB), block access
  // This is the safe fallback if a user profile is accidentally deleted
  if (currentUser.role === 'setup') {
      return (
        <div className="app-container" style={{justifyContent:'center', alignItems:'center'}}>
          <div className="card" style={{textAlign:'center', padding:'3rem'}}>
            <h2>⚠️ Setup Required</h2>
            <p>You are logged in, but your user profile is missing.</p>
            <p style={{color: '#666', marginTop: '1rem'}}>
               Please contact the Administrator to configure your account.
            </p>
            <br />
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      );
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
          
          {currentUser?.role === 'cashier' && (
            <button className={currentPage === 'dailyreport' ? 'active' : ''} onClick={() => setCurrentPage('dailyreport')}>Daily Report</button>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            <>
              <button className={currentPage === 'transfer' ? 'active' : ''} onClick={() => setCurrentPage('transfer')}>Transfer</button>
              <button className={currentPage === 'requests' ? 'active' : ''} onClick={() => setCurrentPage('requests')}>Stock Requests</button>
              <button className={currentPage === 'reports' ? 'active' : ''} onClick={() => setCurrentPage('reports')}>Reports</button>
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
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

const LOCATIONS = {
  shop1: 'Shop 1 - Grocery & Warehouse',
  shop2: 'Shop 2 - Grocery',
  shop3: 'Shop 3 - Liquor Store'
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLocation, setSelectedLocation] = useState('shop1');

  useEffect(() => {
    const user = getItem('pos_user', null);
    if (user) {
      setCurrentUser(user);
    }
  }, []);

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
      case 'transfer':
        return <StockTransfer currentLocation={selectedLocation} />;
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
            aria-label="Select Location"
          >
            {Object.entries(LOCATIONS).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>

        <nav className="nav-links">
          <button className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>Dashboard</button>
          <button className={currentPage === 'inventory' ? 'active' : ''} onClick={() => setCurrentPage('inventory')}>Inventory</button>
          <button className={currentPage === 'pos' ? 'active' : ''} onClick={() => setCurrentPage('pos')}>POS</button>
          <button className={currentPage === 'sales' ? 'active' : ''} onClick={() => setCurrentPage('sales')}>Sales</button>
          {currentUser?.role !== 'cashier' && (
            <>
              <button className={currentPage === 'transfer' ? 'active' : ''} onClick={() => setCurrentPage('transfer')}>Transfer</button>
              <button className={currentPage === 'reports' ? 'active' : ''} onClick={() => setCurrentPage('reports')}>Reports</button>
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

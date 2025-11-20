import React, { useState, useEffect } from 'react';
import ReceiptModal from './ReceiptModal';
import { getCollection, updateItem } from '../utils/storage'; // UPDATED IMPORT

function Sales({ selectedLocation, currentUser }) {
  const [sales, setSales] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [viewingSale, setViewingSale] = useState(null);
  const [loading, setLoading] = useState(false);

  const showFinancials = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  useEffect(() => {
    loadSales();
  }, [selectedLocation, dateFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const allSales = await getCollection('sales');

      const locationSales = allSales.filter(sale => sale.location === selectedLocation);

      const filtered = locationSales.filter(sale => {
        const saleDate = new Date(sale.date);
        const now = new Date();

        if (dateFilter === 'today') {
          return saleDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
          return saleDate >= firstDay;
        } else if (dateFilter === 'month') {
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      });

      setSales(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoidSale = async (saleId) => {
    if (!currentUser) return;
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
      alert('Only managers can void sales!');
      return;
    }

    const reason = prompt('Enter reason for voiding this sale:');
    if (!reason) return;

    setLoading(true);
    try {
        const allSales = await getCollection('sales');
        const sale = allSales.find(s => s.id === saleId);

        if (!sale) {
            alert('Sale not found!');
            return;
        }

        // 1. Restore Inventory (using Cloud logic)
        const allInventory = await getCollection('inventory');
        
        // We need to update items one by one
        const updatePromises = allInventory.map(item => {
            const saleItem = sale.items.find(
                si => si.id === item.id && si.location === selectedLocation
            );
            if (saleItem) {
                return updateItem('inventory', item.id, { 
                    quantity: item.quantity + saleItem.cartQuantity 
                });
            }
            return null;
        }).filter(p => p !== null);

        await Promise.all(updatePromises);

        // 2. Mark Sale as Voided in Cloud
        await updateItem('sales', saleId, {
            voided: true,
            voidedBy: currentUser.username,
            voidReason: reason,
            voidDate: new Date().toISOString()
        });

        alert('Sale voided successfully. Inventory restored.');
        await loadSales();

    } catch (error) {
        console.error("Error voiding sale:", error);
        alert("Failed to void sale.");
    } finally {
        setLoading(false);
    }
  };

  const totalSales = sales
    .filter(s => !s.voided)
    .reduce((sum, sale) => sum + (sale.total || 0), 0);
  
  const totalProfit = sales
    .filter(s => !s.voided)
    .reduce((sum, sale) => sum + (sale.profit || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Sales History</h1>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="stats-cards">
        <div className="card">
          <h2>Total Sales</h2>
          <p>${totalSales.toFixed(2)}</p>
        </div>
        
        {showFinancials && (
          <div className="card">
            <h2>Total Profit</h2>
            <p>${totalProfit.toFixed(2)}</p>
          </div>
        )}

        <div className="card">
          <h2>Transactions</h2>
          <p>{sales.length}</p>
        </div>
      </div>

      {loading ? <p style={{textAlign:'center'}}>Loading Sales Data...</p> : (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Items</th>
              <th>Total</th>
              {showFinancials && <th>Profit</th>}
              <th>Cashier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => {
              const date = new Date(sale.date);
              const isVoided = sale.voided;
              
              return (
                <tr 
                  key={sale.id} 
                  style={isVoided ? {
                    backgroundColor: '#ffe6e6', 
                    textDecoration: 'line-through'
                  } : {}}
                >
                  <td>{date.toLocaleDateString()}</td>
                  <td>{date.toLocaleTimeString()}</td>
                  <td>{sale.items.reduce((sum, item) => sum + item.cartQuantity, 0)}</td>
                  <td>${(sale.total || 0).toFixed(2)}</td>
                  
                  {showFinancials && (
                    <td style={{ 
                      color: (sale.profit || 0) > 0 
                        ? 'var(--success-color)' 
                        : 'var(--danger-color)' 
                    }}>
                      ${(sale.profit || 0).toFixed(2)}
                    </td>
                  )}
                  
                  <td>{sale.cashier}</td>
                  <td>
                    {isVoided ? (
                      <span style={{color: '#dc3545', fontWeight: 'bold'}}>VOIDED</span>
                    ) : (
                      <span style={{color: '#28a745', fontWeight: 'bold'}}>ACTIVE</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-info" 
                      onClick={() => setViewingSale(sale)}
                    >
                      View Details
                    </button>
                    {!isVoided && currentUser && 
                     (currentUser.role === 'manager' || currentUser.role === 'admin') && (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleVoidSale(sale.id)}
                        style={{marginLeft: '0.5rem'}}
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {viewingSale && (
        <ReceiptModal sale={viewingSale} onClose={() => setViewingSale(null)} />
      )}
    </div>
  );
}

export default Sales;
import React, { useState, useEffect } from 'react';
import { getItem } from '../utils/storage';
import ReceiptModal from './ReceiptModal';

function Sales({ selectedLocation }) {
  const [sales, setSales] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [viewingSale, setViewingSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, [selectedLocation, dateFilter]);

  const loadSales = () => {
    const allSales = getItem('sales', []);
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
        return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    setSales(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

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
        <div className="card">
          <h2>Total Profit</h2>
          <p>${totalProfit.toFixed(2)}</p>
        </div>
        <div className="card">
          <h2>Transactions</h2>
          <p>{sales.length}</p>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Items</th>
              <th>Total</th>
              <th>Profit</th>
              <th>Cashier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => {
              const date = new Date(sale.date);
              return (
                <tr key={sale.id}>
                  <td>{date.toLocaleDateString()}</td>
                  <td>{date.toLocaleTimeString()}</td>
                  <td>{sale.items.reduce((sum, item) => sum + item.cartQuantity, 0)}</td>
                  <td>${(sale.total || 0).toFixed(2)}</td>
                  <td style={{ color: (sale.profit || 0) > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    ${(sale.profit || 0).toFixed(2)}
                  </td>
                  <td>{sale.cashier}</td>
                  <td>
                    <button className="btn btn-info" onClick={() => setViewingSale(sale)}>
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewingSale && (
        <ReceiptModal sale={viewingSale} onClose={() => setViewingSale(null)} />
      )}
    </div>
  );
}

export default Sales;

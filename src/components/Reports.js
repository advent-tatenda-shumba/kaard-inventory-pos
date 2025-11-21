import React, { useState, useEffect } from 'react';
import { getCollection } from '../utils/storage'; // Cloud Import
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Reports({ selectedLocation, currentUser }) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    topProducts: [],
    lowStockItems: [],
    salesOverTime: []
  });
  const [loading, setLoading] = useState(true);

  const showFinancials = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  useEffect(() => {
    generateReports();
  }, [selectedLocation]);

  const generateReports = async () => {
    setLoading(true);
    try {
      // 1. Fetch Data from Cloud
      const allInventory = await getCollection('inventory');
      const allSales = await getCollection('sales');
      
      // 2. Filter Data
      const activeSales = allSales.filter(sale => !sale.voided);
      const locationSales = activeSales.filter(sale => sale.location === selectedLocation);

      const totalRevenue = locationSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalProfit = locationSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      
      const locationInventory = allInventory.filter(item => item.location === selectedLocation);
      const lowStockItems = locationInventory.filter(item => item.quantity <= (item.minStock || 5));

      // 3. Calculate Top Products
      const productSales = {};
      locationSales.forEach(sale => {
        sale.items.forEach(item => {
          if (!productSales[item.name]) {
            productSales[item.name] = { count: 0, revenue: 0, profit: 0 };
          }
          const itemProfit = (item.sellPrice - item.costPrice) * item.cartQuantity;
          productSales[item.name].count += item.cartQuantity;
          productSales[item.name].revenue += item.sellPrice * item.cartQuantity;
          productSales[item.name].profit += isNaN(itemProfit) ? 0 : itemProfit;
        });
      });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, data]) => ({ name, ...data }));

      // 4. Calculate Sales Over Time
      const salesOverTime = locationSales.reduce((acc, sale) => {
        const date = new Date(sale.date).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, profit: 0 };
        }
        acc[date].revenue += sale.total || 0;
        acc[date].profit += sale.profit || 0;
        return acc;
      }, {});

      setStats({
        totalRevenue,
        totalProfit,
        totalSales: locationSales.length,
        topProducts,
        lowStockItems,
        salesOverTime: Object.values(salesOverTime).slice(-30)
      });
    } catch (error) {
      console.error("Error generating reports:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{padding:'2rem', textAlign:'center'}}>Loading Reports...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>${stats.totalRevenue.toFixed(2)}</h3>
          <p>Total Revenue</p>
        </div>
        
        {showFinancials && (
          <div className="stat-card">
            <h3>${stats.totalProfit.toFixed(2)}</h3>
            <p>Total Profit</p>
          </div>
        )}

        <div className="stat-card">
          <h3>{stats.totalSales}</h3>
          <p>Total Transactions</p>
        </div>
        <div className="stat-card warning">
          <h3>{stats.lowStockItems.length}</h3>
          <p>Low Stock Alerts</p>
        </div>
      </div>

      <div className="card">
        <h2>Sales & Profit Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.salesOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="revenue" fill="var(--primary-color)" />
            {showFinancials && <Bar dataKey="profit" fill="var(--success-color)" />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Top Selling Products</h2>
        {stats.topProducts.length === 0 ? (
          <p>No sales data available</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Total Revenue</th>
                  {showFinancials && <th>Total Profit</th>}
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.count}</td>
                    <td>${product.revenue.toFixed(2)}</td>
                    
                    {showFinancials && (
                      <td style={{ color: product.profit > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        ${product.profit.toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Low Stock Alerts</h2>
        {stats.lowStockItems.length === 0 ? (
          <p>All products are well stocked</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.minStock || 5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
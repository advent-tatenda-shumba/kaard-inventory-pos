import React, { useState, useEffect } from 'react';
import { getCollection } from '../utils/storage'; // NOW USING CLOUD
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Dashboard({ selectedLocation, onNavigate, currentUser }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    todaySales: 0,
    todayProfit: 0,
    inventoryValue: 0,
    topProducts: [],
    categoryDistribution: []
  });
  const [loading, setLoading] = useState(true);

  const showFinancials = selectedLocation && (currentUser?.role === 'admin' || currentUser?.role === 'manager');

  useEffect(() => {
    if (selectedLocation) {
        loadStats();
    }
  }, [selectedLocation]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // FETCH FROM CLOUD
      const inventory = await getCollection('inventory');
      const sales = await getCollection('sales');
      
      const locationInventory = inventory.filter(item => item.location === selectedLocation);
      
      const today = new Date().toDateString();
      const todaySales = sales.filter(sale => 
        sale.location === selectedLocation && 
        new Date(sale.date).toDateString() === today
      );

      const totalSalesValue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalProfitValue = todaySales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
      const lowStockItems = locationInventory.filter(item => item.quantity <= (item.minStock || 5));
      const totalValue = locationInventory.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);

      const productSales = {};
      sales
        .filter(sale => sale.location === selectedLocation)
        .forEach(sale => {
          sale.items.forEach(item => {
            if (!productSales[item.name]) productSales[item.name] = 0;
            productSales[item.name] += item.cartQuantity;
          });
        });

      const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      const categoryCounts = locationInventory.reduce((acc, item) => {
        const cat = item.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += 1;
        return acc;
      }, {});

      const categoryDistribution = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }));

      setStats({
        totalProducts: locationInventory.length,
        lowStockCount: lowStockItems.length,
        todaySales: totalSalesValue,
        todayProfit: totalProfitValue,
        inventoryValue: totalValue,
        topProducts,
        categoryDistribution
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayLocation = selectedLocation ? selectedLocation.toUpperCase() : 'LOADING...';

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Loading Dashboard Data...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard - {displayLocation}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>${stats.todaySales.toFixed(2)}</h3>
          <p>Today's Revenue</p>
        </div>
        
        {showFinancials && (
          <>
            <div className="stat-card">
              <h3>${stats.todayProfit.toFixed(2)}</h3>
              <p>Today's Profit</p>
            </div>
            <div className="stat-card">
              <h3>${stats.inventoryValue.toFixed(2)}</h3>
              <p>Inventory Value (Cost)</p>
            </div>
          </>
        )}

        <div className="stat-card warning" onClick={() => onNavigate('reports')}>
          <h3>{stats.lowStockCount}</h3>
          <p>Low Stock Items</p>
        </div>
        <div className="stat-card" onClick={() => onNavigate('inventory')}>
          <h3>{stats.totalProducts}</h3>
          <p>Total Products</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2>Top 5 Products (Units Sold)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#2a7a3e" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Product Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {stats.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
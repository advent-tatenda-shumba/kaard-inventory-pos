import React, { useState, useEffect, useCallback } from 'react';
import { getCollection } from '../utils/storage'; // Cloud Import

function DailySalesReport({ selectedLocation, currentUser }) {
  const [todaySales, setTodaySales] = useState([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const loadDailySales = useCallback(async () => {
    if (!selectedLocation) return;
    setLoading(true);
    
    try {
      const allSales = await getCollection('sales');
      const locationSales = allSales.filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split('T')[0];
        // Filter by location, date, AND exclude voided sales
        return sale.location === selectedLocation && 
               saleDate === reportDate && 
               !sale.voided;
      });
      setTodaySales(locationSales);
    } catch (error) {
      console.error("Error loading daily sales:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, reportDate]);

  useEffect(() => {
    loadDailySales();
  }, [loadDailySales]);

  if (!selectedLocation || !currentUser) {
    return (
      <div className="card" style={{padding: '2rem', textAlign: 'center'}}>
        <h2>Error Loading Report</h2>
        <p>Location or user information is missing. Please refresh the page.</p>
      </div>
    );
  }

  const totalSales = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalTransactions = todaySales.length;
  const totalItems = todaySales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.cartQuantity, 0), 0
  );

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{padding:'2rem', textAlign:'center'}}>Generating Report...</div>;

  return (
    <div>
      <div className="page-header no-print">
        <h1>Daily Sales Report</h1>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <input 
            type="date" 
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            style={{padding: '0.5rem', border: '1px solid #dee2e6', borderRadius: '4px'}}
          />
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div className="report-container" style={{padding: '2rem', backgroundColor: 'white'}}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h2 style={{margin: 0}}>KAARD STORES</h2>
          <p style={{margin: '0.5rem 0', color: '#666'}}>
            {selectedLocation.toUpperCase()}
          </p>
          <p style={{margin: '0.5rem 0', fontWeight: 'bold'}}>Daily Sales Report</p>
          <p style={{margin: 0, color: '#666'}}>{new Date(reportDate).toLocaleDateString()}</p>
        </div>

        <div className="stats-cards" style={{marginBottom: '2rem'}}>
          <div className="card">
            <h3>Total Sales</h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#28a745'}}>
              ${totalSales.toFixed(2)}
            </p>
          </div>
          <div className="card">
            <h3>Transactions</h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#007bff'}}>
              {totalTransactions}
            </p>
          </div>
          <div className="card">
            <h3>Items Sold</h3>
            <p style={{fontSize: '2rem', fontWeight: 'bold', color: '#ffc107'}}>
              {totalItems}
            </p>
          </div>
        </div>

        <h3 style={{marginTop: '2rem', marginBottom: '1rem'}}>Transaction Details</h3>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6'}}>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Time</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Receipt #</th>
              <th style={{padding: '0.75rem', textAlign: 'center'}}>Items</th>
              <th style={{padding: '0.75rem', textAlign: 'right'}}>Amount</th>
              <th style={{padding: '0.75rem', textAlign: 'left'}}>Cashier</th>
            </tr>
          </thead>
          <tbody>
            {todaySales.length === 0 ? (
              <tr>
                <td colSpan="5" style={{padding: '2rem', textAlign: 'center', color: '#6c757d'}}>
                  No sales recorded for this date
                </td>
              </tr>
            ) : (
              todaySales.map(sale => (
                <tr key={sale.id} style={{borderBottom: '1px solid #dee2e6'}}>
                  <td style={{padding: '0.75rem'}}>
                    {new Date(sale.date).toLocaleTimeString()}
                  </td>
                  <td style={{padding: '0.75rem'}}>{sale.id.toString().slice(-6)}</td> {/* Short ID for print */}
                  <td style={{padding: '0.75rem', textAlign: 'center'}}>
                    {sale.items.reduce((sum, item) => sum + item.cartQuantity, 0)}
                  </td>
                  <td style={{padding: '0.75rem', textAlign: 'right', fontWeight: 'bold'}}>
                    ${(sale.total || 0).toFixed(2)}
                  </td>
                  <td style={{padding: '0.75rem'}}>{sale.cashier}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '1.1rem'}}>
              <td colSpan="3" style={{padding: '1rem', textAlign: 'right'}}>TOTAL:</td>
              <td style={{padding: '1rem', textAlign: 'right'}}>${totalSales.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div style={{marginTop: '3rem', paddingTop: '2rem', borderTop: '2px dashed #dee2e6'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
            <div>
              <p style={{marginBottom: '2rem', color: '#666'}}>Cashier Signature:</p>
              <div style={{borderBottom: '1px solid #000', width: '80%'}}></div>
            </div>
            <div>
              <p style={{marginBottom: '2rem', color: '#666'}}>Manager Signature:</p>
              <div style={{borderBottom: '1px solid #000', width: '80%'}}></div>
            </div>
          </div>
          <p style={{marginTop: '2rem', fontSize: '0.85rem', color: '#666', textAlign: 'center'}}>
            Generated on {new Date().toLocaleString()} | Cashier: {currentUser.username}
          </p>
        </div>
      </div>
 
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .report-container, .report-container * { visibility: visible; }
          .report-container { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}

export default DailySalesReport;
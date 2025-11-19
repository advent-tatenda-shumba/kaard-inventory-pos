import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getItem } from '../utils/storage';

function ReceiptViewer() {
  const { receiptId } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allSales = getItem('sales', []);
    const foundSale = allSales.find(s => s.id === parseInt(receiptId));
    setSale(foundSale);
    setLoading(false);
  }, [receiptId]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!sale) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Receipt Not Found</h2>
        <p>Receipt #{receiptId} does not exist.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '2rem auto', 
      padding: '2rem', 
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>KAARD STORES</h1>
        <p style={{ margin: 0, color: '#666' }}>{sale.location.toUpperCase()}</p>
      </div>

      <hr style={{ border: 'none', borderTop: '2px dashed #ddd', margin: '1rem 0' }} />

      <div style={{ marginBottom: '1.5rem' }}>
        <p><strong>Date:</strong> {new Date(sale.date).toLocaleString()}</p>
        <p><strong>Cashier:</strong> {sale.cashier}</p>
        <p><strong>Receipt #:</strong> {sale.id}</p>
      </div>

      <hr style={{ border: 'none', borderTop: '2px dashed #ddd', margin: '1rem 0' }} />

      <table style={{ width: '100%', marginBottom: '1.5rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Item</th>
            <th style={{ textAlign: 'center', padding: '0.5rem' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Price</th>
            <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '0.5rem' }}>{item.name}</td>
              <td style={{ textAlign: 'center', padding: '0.5rem' }}>{item.cartQuantity}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>${item.sellPrice.toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                ${(item.sellPrice * item.cartQuantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr style={{ border: 'none', borderTop: '2px dashed #ddd', margin: '1rem 0' }} />

      <div style={{ textAlign: 'right', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        TOTAL: ${(sale.total || 0).toFixed(2)}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
        <p>Thank you for shopping with us!</p>
      </div>
    </div>
  );
}

export default ReceiptViewer;

import React, { useEffect, useState } from 'react';
import { getCollection } from '../utils/storage';
import './Receipt.css'; // Import the new styles

function ReceiptViewer({ receiptId }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReceipt = async () => {
      setLoading(true);
      try {
        const allSales = await getCollection('sales');
        const foundSale = allSales.find(s => s.id === receiptId);
        setSale(foundSale);
      } catch (error) {
        console.error('Error loading receipt:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReceipt();
  }, [receiptId]);

  if (loading) return <div style={{padding:'2rem', textAlign:'center'}}>Verifying Invoice...</div>;
  
  if (!sale) {
    return (
      <div className="digital-container" style={{textAlign: 'center'}}>
        <div className="check-circle" style={{backgroundColor: '#dc3545'}}>×</div>
        <h2>Invoice Not Found</h2>
        <p>This receipt ID does not exist in our records.</p>
      </div>
    );
  }

  return (
    <div className="digital-container">
      
      {/* LOGO HEADER */}
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <img 
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
          alt="Logo" 
          style={{width: '60px', height: '60px'}} 
        />
      </div>

      {/* STATUS BADGE */}
      <div className="status-badge">
        <h3>Invoice is valid</h3>
        <div className="check-circle">✓</div>
      </div>

      {/* DETAILS FORM */}
      <div>
        <div className="digital-label">TRADING NAME</div>
        <div className="digital-value-box">KAARD STORES {sale.location.toUpperCase()}</div>

        <div className="digital-label">ADDRESS</div>
        <div className="digital-value-box">25 Samora Machel Avenue, Harare</div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
          <div>
            <div className="digital-label">INVOICE DATE</div>
            <div className="digital-value-box">{new Date(sale.date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="digital-label">INVOICE TIME</div>
            <div className="digital-value-box">{new Date(sale.date).toLocaleTimeString()}</div>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
           <div>
             <div className="digital-label">INVOICE TOTAL</div>
             <div className="digital-total-box">
               <span>${(sale.total || 0).toFixed(2)}</span>
             </div>
           </div>
           <div>
             <div className="digital-label">CURRENCY</div>
             <div className="digital-total-box">
               <span>USD</span>
             </div>
           </div>
        </div>

        <div className="digital-label">ITEMS PURCHASED</div>
        <div className="digital-value-box" style={{fontSize: '0.85rem'}}>
          {sale.items.map((item, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', borderBottom:'1px solid #ccc', paddingBottom:'2px'}}>
               <span>{item.name} (x{item.cartQuantity})</span>
               <span>${((item.sellPrice || 0) * item.cartQuantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-success" style={{width: '100%', padding: '15px', marginTop: '20px'}}>
          REVIEW INVOICE
        </button>

        <div style={{textAlign: 'center', marginTop: '2rem', fontSize: '0.7rem', color: '#999'}}>
          KAARD SYSTEMS VERIFICATION PORTAL
        </div>
      </div>

    </div>
  );
}

export default ReceiptViewer;
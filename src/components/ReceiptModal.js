import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function ReceiptModal({ sale, onClose }) {
  // 1. SAFETY CHECK: If no sale data exists, don't render anything
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-content">
          {sale.voided && (
            <div style={{
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '1rem',
              textAlign: 'center',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              ⚠️ THIS SALE HAS BEEN VOIDED ⚠️
              <br/>
              <span style={{fontSize: '0.85rem'}}>Voided by: {sale.voidedBy} | Reason: {sale.voidReason}</span>
            </div>
          )}
  
          {/* 2. Hardcoded Name is safer for now */}
          <h2>KAARD STORES</h2>
          <p>{sale.location ? sale.location.toUpperCase() : 'STORE'}</p>
          <hr />
          <p><strong>Date:</strong> {new Date(sale.date).toLocaleString()}</p>
          <p><strong>Cashier:</strong> {sale.cashier}</p>
          <p><strong>Receipt #:</strong> {sale.id}</p>
          <hr />
  
          <table style={{width: '100%', marginBottom: '1rem'}}>
            <thead>
              <tr>
                <th style={{textAlign: 'left'}}>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* 3. Added safety checks (|| 0) for numbers */}
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.cartQuantity}</td>
                  <td>${(item.sellPrice || 0).toFixed(2)}</td>
                  <td>${((item.sellPrice || 0) * (item.cartQuantity || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <h3>TOTAL: ${(sale.total || 0).toFixed(2)}</h3>
  
          <div style={{textAlign: 'center', marginTop: '1rem'}}>
            {/* QR Code points to a receipt URL */}
            <QRCodeCanvas value={`${window.location.origin}/receipt/${sale.id}`} size={128} />
            <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Scan for digital receipt</p>
          </div>
        </div>

        {/* 4. ADDED THE MISSING BUTTONS HERE */}
        <div className="modal-actions no-print" style={{marginTop: '1.5rem', display: 'flex', gap: '1rem'}}>
            <button onClick={handlePrint} className="btn btn-primary" style={{flex: 1}}>Print Receipt</button>
            <button onClick={onClose} className="btn btn-secondary" style={{flex: 1}}>Close</button>
        </div>

      </div>
    </div>
  );
}

export default ReceiptModal;
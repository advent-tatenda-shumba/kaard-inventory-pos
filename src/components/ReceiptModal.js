import React from 'react';
// import QRCode from 'qrcode.react';
import { QRCodeCanvas } from 'qrcode.react';


function ReceiptModal({ sale, onClose }) {
  const receiptUrl = `${window.location.origin}/receipt/${sale.id}`;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-content">
          <h2>KAARD STORES</h2>
          <p>{sale.location.toUpperCase()}</p>
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
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.cartQuantity}</td>
                  <td>${item.sellPrice.toFixed(2)}</td>
                  <td>${(item.sellPrice * item.cartQuantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <h3>TOTAL: ${sale.total.toFixed(2)}</h3>
          <div style={{textAlign: 'center', marginTop: '1rem'}}>
            <QRCodeCanvas value={receiptUrl} size={128} /> 
            <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Scan for digital receipt</p>
          </div>
        </div>
        <div className="modal-actions" style={{marginTop: '1rem'}}>
          <button className="btn btn-primary" onClick={handlePrint}>Print</button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
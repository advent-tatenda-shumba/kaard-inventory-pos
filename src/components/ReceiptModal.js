import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './Receipt.css';

function ReceiptModal({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // This URL is what the phone will open when scanned
  const receiptUrl = `${window.location.origin}/receipt/${sale.id}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '350px', padding: '0'}}>
        
        <div className="thermal-receipt">
          
          <div className="thermal-header">
            {/* ACTUAL LOGO IMAGE */}
            <img 
              src="/kaard_logo.png" 
              alt="Kaard Investments" 
              style={{
                maxWidth: '150px',
                height: 'auto',
                marginBottom: '10px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            />
            
            <h3 style={{margin: '5px 0'}}>KAARD INVESTMENTS</h3>
            <p style={{fontWeight:'bold', fontSize: '14px'}}>
              {sale.location ? sale.location.toUpperCase() : 'HEAD OFFICE'}
            </p>
            
            {/* PLACEHOLDERS */}
            <p style={{marginTop: '10px'}}>FISCAL TAX INVOICE</p>
            <p>TIN: ________________</p>
            <p>VAT No: ________________</p>
          </div>

          <div className="dashed-line"></div>

          {/* RECEIPT DETAILS */}
          <div className="thermal-row">
            <span>Receipt No:</span>
            <span>{sale.id.slice(-6)}</span>
          </div>
          <div className="thermal-row">
            <span>Date:</span>
            <span>{new Date(sale.date).toLocaleDateString()}</span>
          </div>
          <div className="thermal-row">
            <span>Time:</span>
            <span>{new Date(sale.date).toLocaleTimeString()}</span>
          </div>
          
          {/* CASHIER & SHOP DETAILS */}
          <div className="thermal-row">
            <span>Cashier:</span>
            <span style={{fontWeight: 'bold'}}>{sale.cashier}</span>
          </div>

          <div className="dashed-line"></div>

          <div className="thermal-row" style={{fontWeight: 'bold'}}>
            <span style={{flex: 2}}>Description</span>
            <span style={{flex: 1, textAlign:'center'}}>Qty</span>
            <span style={{flex: 1, textAlign:'right'}}>Amt</span>
          </div>

          <div className="dashed-line"></div>

          {sale.items.map((item, idx) => (
            <div key={idx} className="thermal-item-row">
              <span style={{flex: 2}}>{item.name}</span>
              <span style={{flex: 1, textAlign:'center'}}>{item.cartQuantity}</span>
              <span style={{flex: 1, textAlign:'right'}}>
                ${((item.sellPrice || 0) * (item.cartQuantity || 0)).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="dashed-line"></div>

          <div className="thermal-row thermal-total">
            <span>TOTAL PAID (USD):</span>
            <span>${(sale.total || 0).toFixed(2)}</span>
          </div>
          
          <div className="thermal-row">
            <span>VAT (15%):</span>
            <span>${((sale.total || 0) * 0.15).toFixed(2)}</span>
          </div>

          <div className="dashed-line"></div>

          <div className="qr-container">
            <QRCodeCanvas value={receiptUrl} size={100} />
            <p className="verification-text">
              Scan to verify receipt<br/>
              ID: {sale.id}
            </p>
            <p className="verification-text" style={{marginTop: '10px'}}>
              ** END OF FISCAL INVOICE **
            </p>
          </div>

        </div>

        <div className="modal-actions no-print" style={{padding: '1rem', borderTop: '1px solid #eee'}}>
            <button onClick={handlePrint} className="btn btn-primary" style={{width:'100%'}}>🖨️ Print Receipt</button>
            <button onClick={onClose} className="btn btn-secondary" style={{width:'100%', marginTop:'10px'}}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;
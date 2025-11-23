import React, { useState, useEffect } from 'react';
import { getCollection, addItem, updateItem } from '../utils/storage';
import ReceiptModal from './ReceiptModal';

function POS({ selectedLocation, currentUser }) {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Load Inventory from Cloud
  useEffect(() => {
    if (selectedLocation) {
      loadInventory();
    }
  }, [selectedLocation]);

// --- BARCODE SCANNER LISTENER ---
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      
      // If checks specific to scanner "typing" speed (scanners are faster than humans)
      if (currentTime - lastKeyTime > 100) {
        barcodeBuffer = ''; // Reset if typing is too slow (human typing)
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 3) { // Minimum barcode length check
          handleBarcodeScan(barcodeBuffer);
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        // Append printable characters
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventory, cart]); // Re-bind when inventory changes

  const handleBarcodeScan = (code) => {
    const product = inventory.find(p => p.barcode === code);
    if (product) {
      if (product.quantity > 0) {
        addToCart(product);
        // Optional: Play a 'beep' sound here
      } else {
        alert(`Item ${product.name} is out of stock!`);
      }
    } else {
      console.log("Barcode not found in inventory:", code);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const allInventory = await getCollection('inventory');
      const locationInventory = allInventory.filter(
        item => item.location === selectedLocation && item.quantity > 0
      );
      setInventory(locationInventory);
    } catch (error) {
      console.error("Error loading POS inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.cartQuantity < product.quantity) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { ...product, cartQuantity: 1 }]);
    }
  };

  const updateCartQuantity = (id, newQuantity) => {
    const product = inventory.find(p => p.id === id);

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else if (product && newQuantity <= product.quantity) {
      setCart(cart.map(item =>
        item.id === id ? { ...item, cartQuantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.sellPrice * item.cartQuantity), 0);
  };

  const calculateProfit = () => {
    return cart.reduce((profit, item) => {
      const cost = item.costPrice || 0;
      const revenue = item.sellPrice * item.cartQuantity;
      return profit + (revenue - (cost * item.cartQuantity));
    }, 0);
  };

  // 2. Checkout Logic (Cloud Version)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    setLoading(true);
    try {
      // A. Validate Stock one last time (Race Condition Check)
      const currentInventory = await getCollection('inventory');

      for (const cartItem of cart) {
        const dbItem = currentInventory.find(i => i.id === cartItem.id);
        if (!dbItem || dbItem.quantity < cartItem.cartQuantity) {
          alert(`Error: Stock changed for ${cartItem.name}. Please re-add item.`);
          await loadInventory();
          setLoading(false);
          return;
        }
      }

      const total = calculateTotal();
      const profit = calculateProfit();

      // B. Deduct Stock in Firebase (Item by Item)
      // We use Promise.all to do them in parallel for speed
      const updatePromises = cart.map(cartItem => {
        const dbItem = currentInventory.find(i => i.id === cartItem.id);
        const newQuantity = dbItem.quantity - cartItem.cartQuantity;
        return updateItem('inventory', cartItem.id, { quantity: newQuantity });
      });

      await Promise.all(updatePromises);

      // C. Save Sale Record to Firebase
      const sale = {
        location: selectedLocation,
        items: cart,
        total: total || 0,
        profit: profit || 0,
        date: new Date().toISOString(),
        cashier: currentUser.username || 'Unknown', // Safe fallback
        paymentMethod: 'cash' // Future proofing
      };

      const savedSale = await addItem('sales', sale);

      // D. Finish Up
      setLastSale({ ...sale, id: savedSale.id }); // Use the real Firebase ID
      setShowReceipt(true);
      setCart([]);
      await loadInventory(); // Refresh grid to show new stock levels

    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.barcode && item.barcode.includes(searchTerm))
  );

  return (
    <div className="pos-layout">
      <div className="products-section">
        <h2>Products</h2>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1rem',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
          }}
        />

        {loading && <p style={{ textAlign: 'center' }}>Syncing with cloud...</p>}

        <div className="products-grid">
          {filteredInventory.map(product => (
            <div
              key={product.id}
              className={`product-card ${product.quantity === 0 ? 'out-of-stock' : ''}`}
              onClick={() => product.quantity > 0 && addToCart(product)}
            >
              <h4>{product.name}</h4>
              <div className="price">${(product.sellPrice || 0).toFixed(2)}</div>
              <div className="stock">Stock: {product.quantity}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-section">
        <h2>Cart</h2>

        <div className="cart-items">
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d' }}>Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>${(item.sellPrice || 0).toFixed(2)} each</p>
                </div>
                <div className="cart-item-controls">
                  <button onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}>
                    -
                  </button>
                  <input
                    type="number"
                    value={item.cartQuantity}
                    onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 0)}
                  />
                  <button onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}>
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    style={{ backgroundColor: '#dc3545' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-total">
          <h3>
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </h3>
        </div>

        <div className="cart-actions">
          <button className="btn btn-danger" onClick={() => setCart([])} disabled={loading}>
            Clear
          </button>
          <button className="btn btn-success" onClick={handleCheckout} disabled={loading}>
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>

      {showReceipt && lastSale && (
        <ReceiptModal sale={lastSale} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
}

export default POS;
import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';
import ReceiptModal from './ReceiptModal';

function POS({ selectedLocation, currentUser }) {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    loadInventory();
  }, [selectedLocation]);

  const loadInventory = () => {
    const allInventory = getItem('inventory', []);
    const locationInventory = allInventory.filter(item => item.location === selectedLocation && item.quantity > 0);
    setInventory(locationInventory);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.cartQuantity < product.quantity) {
        setCart(cart.map(item =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
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

  const handleCheckout = () => {
  if (cart.length === 0) {
    alert('Cart is empty!');
    return;
  }

  // Calculate totals BEFORE creating sale object
  const total = calculateTotal();
  const profit = calculateProfit();

  // Update inventory
  const allInventory = getItem('inventory', []);
  const updatedInventory = allInventory.map(item => {
    const cartItem = cart.find(c => c.id === item.id && c.location === selectedLocation);
    if (cartItem) {
      return { ...item, quantity: item.quantity - cartItem.cartQuantity };
    }
    return item;
  });

  setItem('inventory', updatedInventory);

  // Create sale object with guaranteed numbers
  const sale = {
    id: Date.now(),
    location: selectedLocation,
    items: cart,
    total: total || 0,  // Ensure it's never null/undefined
    profit: profit || 0, // Ensure it's never null/undefined
    date: new Date().toISOString(),
    cashier: currentUser.username
  };

  // Save sale
  const sales = getItem('sales', []);
  setItem('sales', [...sales, sale]);

  // Show receipt and clear cart
  setLastSale(sale);
  setShowReceipt(true);
  setCart([]);
  loadInventory();
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
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #dee2e6', borderRadius: '4px' }}
        />

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
            <p style={{textAlign: 'center', color: '#6c757d'}}>Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>${(item.sellPrice || 0).toFixed(2)} each</p>
                </div>
                <div className="cart-item-controls">
                  <button onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}>-</button>
                  <input
                    type="number"
                    value={item.cartQuantity}
                    onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 0)}
                  />
                  <button onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}>+</button>
                  <button onClick={() => removeFromCart(item.id)} style={{backgroundColor: '#dc3545'}}>×</button>
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
          <button className="btn btn-danger" onClick={() => setCart([])}>Clear</button>
          <button className="btn btn-success" onClick={handleCheckout}>Checkout</button>
        </div>
      </div>
      {showReceipt && lastSale && (
  <ReceiptModal sale={lastSale} onClose={() => setShowReceipt(false)} />
)}
    </div>
  );
}

export default POS;
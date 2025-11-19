import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';

function StockTransfer({ currentLocation }) {
  const [inventory, setInventory] = useState([]);
  const [allInventory, setAllInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [destination, setDestination] = useState('');

  useEffect(() => {
    loadInventory();
  }, [currentLocation]);

  const loadInventory = () => {
    const storedInventory = getItem('inventory', []);
    setAllInventory(storedInventory);
    const locationInventory = storedInventory.filter(item => item.location === currentLocation);
    setInventory(locationInventory);
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    
    const transferQuantity = parseInt(quantity);
    if (!selectedProduct || !transferQuantity || !destination) {
      alert('Please fill all fields and ensure quantity is a valid number.');
      return;
    }

    const sourceProduct = allInventory.find(item => 
      item.id === parseInt(selectedProduct) && item.location === currentLocation
    );
    
    if (!sourceProduct) {
      alert('Product not found at the source location.');
      return;
    }

    if (sourceProduct.quantity < transferQuantity) {
      alert(`Insufficient stock. Only ${sourceProduct.quantity} units available.`);
      return;
    }

    let destinationProductExists = false;
    const updatedInventory = allInventory.map(item => {
      // Decrease stock from source
      if (item.id === sourceProduct.id && item.location === currentLocation) {
        return { ...item, quantity: item.quantity - transferQuantity };
      }
      // Increase stock at destination
      if (item.id === sourceProduct.id && item.location === destination) {
        destinationProductExists = true;
        return { ...item, quantity: item.quantity + transferQuantity };
      }
      return item;
    });

    // If product doesn't exist at destination, create it
    if (!destinationProductExists) {
      const { id, name, barcode, category, costPrice, sellPrice, minStock, unit } = sourceProduct;
      updatedInventory.push({
        id, name, barcode, category, costPrice, sellPrice, minStock, unit,
        location: destination,
        quantity: transferQuantity
      });
    }

    setItem('inventory', updatedInventory);
    
    alert(`Transferred ${quantity} units of ${sourceProduct.name} to ${destination}`);
    setSelectedProduct('');
    setQuantity('');
    setDestination('');
    loadInventory();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Stock Transfer</h1>
      </div>

      <div className="card">
        <h2>Transfer from {currentLocation.toUpperCase()}</h2>
        <div>
          <div className="form-group">
            <label>Select Product</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required>
              <option value="">Choose product...</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Destination</label>
            <select value={destination} onChange={(e) => setDestination(e.target.value)} required>
              <option value="">Choose destination...</option>
              {currentLocation !== 'shop1' && <option value="shop1">Shop 1 - Grocery & Warehouse</option>}
              {currentLocation !== 'shop2' && <option value="shop2">Shop 2 - Grocery</option>}
              {currentLocation !== 'shop3' && <option value="shop3">Shop 3 - Liquor Store</option>}
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleTransfer}>
            Transfer Stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockTransfer;
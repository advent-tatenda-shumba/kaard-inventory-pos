import React, { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

function StockTransfer({ currentLocation, currentUser }) {
  const [inventory, setInventory] = useState([]);
  const [fromLocation, setFromLocation] = useState('warehouse');
  const [toLocation, setToLocation] = useState('shop1');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [transfers, setTransfers] = useState([]);

  const locations = {
    warehouse: 'Warehouse',
    shop1: 'Shop 1 - Main Grocery',
    shop2: 'Kaard Shop - GTS',
    shop3: 'Kaard Supermarket - Quickstop',
    shop4: 'Kaard Liquor - GTS',
    shop5: 'Kaard Liquor - Masasa',
    shop6: 'Fancy Liquor - Kadoma'
  };

  // Always run hooks first
  const loadInventory = useCallback(() => {
    const allInventory = getItem('inventory', []);
    const locationInventory = allInventory.filter(
      item => item.location === fromLocation
    );
    setInventory(locationInventory);
  }, [fromLocation]);

  const loadTransfers = useCallback(() => {
    const allTransfers = getItem('transfers', []);
    setTransfers(allTransfers.slice(-10));
  }, [fromLocation]);

  useEffect(() => {
    loadInventory();
    loadTransfers();
  }, [loadInventory, loadTransfers]);

  // Now safe to do conditional return
  if (currentUser?.role !== 'admin') {
    return (
      <div className="card">
        <h2>Access Denied</h2>
        <p>Only administrators can transfer stock between locations.</p>
      </div>
    );
  }

  const handleTransfer = (e) => {
    e.preventDefault();

    if (fromLocation === toLocation) {
      alert('Cannot transfer to the same location!');
      return;
    }

    const allInventory = getItem('inventory', []);
    const itemToTransfer = allInventory.find(item =>
      item.id === parseInt(selectedItem) &&
      item.location === fromLocation
    );

    if (!itemToTransfer) {
      alert('Item not found!');
      return;
    }

    const transferQty = parseInt(quantity);
    if (transferQty > itemToTransfer.quantity) {
      alert(`Not enough stock! Available: ${itemToTransfer.quantity}`);
      return;
    }

    // Reduce source quantity
    const updatedInventory = allInventory.map(item => {
      if (item.id === itemToTransfer.id && item.location === fromLocation) {
        return { ...item, quantity: item.quantity - transferQty };
      }
      return item;
    });

    // Add quantity to destination
    const existingAtDestination = updatedInventory.find(
      item =>
        item.name === itemToTransfer.name &&
        item.location === toLocation
    );

    if (existingAtDestination) {
      const finalInventory = updatedInventory.map(item => {
        if (item.id === existingAtDestination.id) {
          return { ...item, quantity: item.quantity + transferQty };
        }
        return item;
      });
      setItem('inventory', finalInventory);
    } else {
      const newItem = {
        ...itemToTransfer,
        id: Date.now(),
        location: toLocation,
        quantity: transferQty
      };
      setItem('inventory', [...updatedInventory, newItem]);
    }

    // Record transfer
    const transfer = {
      id: Date.now(),
      date: new Date().toISOString(),
      from: fromLocation,
      to: toLocation,
      itemName: itemToTransfer.name,
      quantity: transferQty,
      transferredBy: currentUser.username
    };

    const allTransfers = getItem('transfers', []);
    setItem('transfers', [...allTransfers, transfer]);

    alert(
      `Successfully transferred ${transferQty} units of ${itemToTransfer.name} 
       from ${locations[fromLocation]} to ${locations[toLocation]}`
    );

    setSelectedItem('');
    setQuantity('');
    loadInventory();
    loadTransfers();
  };

  return (
    <div>
      <h1>Stock Transfer (Admin Only)</h1>

      <div className="card">
        <h2>Transfer Stock</h2>
        <form onSubmit={handleTransfer}>

          <div className="form-group">
            <label>From Location:</label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              required
            >
              {Object.entries(locations).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>To Location:</label>
            <select
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              required
            >
              {Object.entries(locations)
                .filter(([key]) => key !== fromLocation)
                .map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Item:</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              required
            >
              <option value="">Choose an item...</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (Available: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity to Transfer:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Transfer Stock
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Recent Transfers</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>By</th>
            </tr>
          </thead>

          <tbody>
            {transfers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No transfers recorded yet
                </td>
              </tr>
            ) : (
              transfers.map(transfer => (
                <tr key={transfer.id}>
                  <td>{new Date(transfer.date).toLocaleString()}</td>
                  <td>{locations[transfer.from]}</td>
                  <td>{locations[transfer.to]}</td>
                  <td>{transfer.itemName}</td>
                  <td>{transfer.quantity}</td>
                  <td>{transfer.transferredBy}</td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default StockTransfer;

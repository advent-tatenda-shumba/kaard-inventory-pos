import React, { useState, useEffect, useCallback } from 'react';
import { getCollection, updateItem, addItem } from '../utils/storage';

function StockTransfer({ currentLocation, currentUser }) {
  const [inventory, setInventory] = useState([]);
  const [fromLocation, setFromLocation] = useState('shop1'); // Default source
  const [toLocation, setToLocation] = useState('warehouse'); // Default destination
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  const locations = {
    warehouse: 'Warehouse',
    shop1: 'Shop 1 - Main Grocery',
    shop2: 'Kaard Shop - GTS',
    shop3: 'Kaard Supermarket - Quickstop',
    shop4: 'Kaard Liquor - GTS',
    shop5: 'Kaard Liquor - Masasa',
    shop6: 'Fancy Liquor - Kadoma'
  };

  // 1. Load Inventory for the "From" Location
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const allInventory = await getCollection('inventory');
      // Filter items that belong to the source location
      const locationInventory = allInventory.filter(
        item => item.location === fromLocation
      );
      setInventory(locationInventory);
    } catch (error) {
      console.error("Error loading transfer inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [fromLocation]);

  // 2. Load Transfer History
  const loadTransfers = useCallback(async () => {
    try {
      const allTransfers = await getCollection('transfers');
      // Sort by date (newest first) and take top 10
      const sorted = allTransfers.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransfers(sorted.slice(0, 10));
    } catch (error) {
      console.error("Error loading transfers:", error);
    }
  }, []);

  useEffect(() => {
    loadInventory();
    loadTransfers();
  }, [loadInventory, loadTransfers]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="card">
        <h2>Access Denied</h2>
        <p>Only administrators can transfer stock between locations.</p>
      </div>
    );
  }

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (fromLocation === toLocation) {
      alert('Cannot transfer to the same location!');
      return;
    }

    const transferQty = parseInt(quantity);
    if (isNaN(transferQty) || transferQty <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    setLoading(true);
    try {
      // Refresh inventory to ensure stock levels are accurate
      const allInventory = await getCollection('inventory');
      
      // A. Find Source Item
      const sourceItem = allInventory.find(item => 
        item.id === selectedItem && item.location === fromLocation
      );

      if (!sourceItem) {
        alert('Item not found in source location.');
        setLoading(false);
        return;
      }

      if (transferQty > sourceItem.quantity) {
        alert(`Not enough stock! Available: ${sourceItem.quantity}`);
        setLoading(false);
        return;
      }

      // B. Find (or Create) Destination Item
      const destItem = allInventory.find(item => 
        item.name === sourceItem.name && item.location === toLocation
      );

      // C. Perform the Transfer
      
      // 1. Deduct from Source
      await updateItem('inventory', sourceItem.id, { 
        quantity: sourceItem.quantity - transferQty 
      });

      // 2. Add to Destination
      if (destItem) {
        // Update existing item
        await updateItem('inventory', destItem.id, { 
          quantity: destItem.quantity + transferQty 
        });
      } else {
        // Create new item at destination
        // We remove the old ID so Firebase generates a new unique one
        const { id, ...itemData } = sourceItem;
        await addItem('inventory', {
          ...itemData,
          location: toLocation,
          quantity: transferQty
        });
      }

      // 3. Record the Transfer Log
      await addItem('transfers', {
        date: new Date().toISOString(),
        from: fromLocation,
        to: toLocation,
        itemName: sourceItem.name,
        quantity: transferQty,
        transferredBy: currentUser.username
      });

      alert('Transfer Successful!');
      setQuantity('');
      setSelectedItem('');
      
      // Refresh data
      await loadInventory();
      await loadTransfers();

    } catch (error) {
      console.error("Transfer failed:", error);
      alert("Transfer failed. Please check console.");
    } finally {
      setLoading(false);
    }
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
            {loading ? <p>Loading items...</p> : (
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
            )}
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Transferring...' : 'Transfer Stock'}
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
import React, { useState, useEffect } from 'react';
import { getCollection, addItem, updateItem, deleteItem } from '../utils/storage';

const categories = [
  'Food Items', 'Beverages', 'Alcohol', 'Household Items',
  'Dish Washing', 'Soaps & Detergents', 'Perishables', 'Non-Perishables'
];

function Inventory({ selectedLocation, userRole, currentUser }) {
  // Permission check (safe default to false if undefined)
  const canSeeCostPrice = (userRole === 'admin' || userRole === 'manager');
  
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', 
    barcode: '', 
    category: '', 
    costPrice: '', 
    sellPrice: '', 
    quantity: '', 
    minStock: '', 
    unit: 'pieces'
  });

  // 1. Load Inventory from Cloud
  useEffect(() => {
    if (selectedLocation) {
      loadInventory();
    }
  }, [selectedLocation]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      console.log(`Fetching inventory for location: ${selectedLocation}...`);
      
      // Fetch ALL inventory from Firebase
      const allInventory = await getCollection('inventory');
      
      console.log("Raw data from Firebase:", allInventory);

      // Filter for the selected shop
      const locationInventory = allInventory.filter(
        item => item.location === selectedLocation
      );

      console.log(`Filtered items for ${selectedLocation}:`, locationInventory.length);
      setInventory(locationInventory);
    } catch (error) {
      console.error("Failed to load inventory:", error);
      alert("Error loading inventory from cloud. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Save Inventory to Cloud
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const processedData = {
      ...formData,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellPrice: parseFloat(formData.sellPrice) || 0,
      quantity: parseInt(formData.quantity) || 0,
      minStock: parseInt(formData.minStock) || 0
    };

    if (processedData.costPrice < 0 || processedData.sellPrice < 0 || processedData.quantity < 0 || processedData.minStock < 0) {
      alert('Prices and quantities cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await updateItem('inventory', editingItem.id, { 
            ...processedData, 
            location: selectedLocation 
        });
      } else {
        await addItem('inventory', {
          ...processedData,
          location: selectedLocation,
          createdAt: new Date().toISOString()
        });
      }
      await loadInventory(); // Refresh list
      resetForm();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete from Cloud
  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      setLoading(true);
      await deleteItem('inventory', id);
      await loadInventory();
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      barcode: '', 
      category: '', 
      costPrice: '', 
      sellPrice: '', 
      quantity: '', 
      minStock: '', 
      unit: 'pieces' 
    });
    setEditingItem(null);
    setShowModal(false);
  };

  // Filter logic for Search Bar
  const filteredInventory = inventory.filter(item => {
    const nameMatch = item.name ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const barcodeMatch = item.barcode ? item.barcode.includes(searchTerm) : false;
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    return (nameMatch || barcodeMatch) && categoryMatch;
  });

  const canEdit = userRole === 'admin' || userRole === 'manager';

  return (
    <div>
      <div className="page-header">
        <h1>Inventory Management</h1>
        {canEdit && (
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            + Add Product
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <h3>Loading Cloud Data...</h3>
            <p>(Check console if this takes too long)</p>
          </div>
      ) : (
        <div className="table-container">
            <table>
            <thead>
                <tr>
                <th>Name</th>
                <th>Barcode</th>
                {canSeeCostPrice && <th>Cost Price</th>}
                <th>Sell Price</th>
                <th>Quantity</th>
                {userRole === 'admin' && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>
                      No items found for this location.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => (
                  <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.barcode || 'N/A'}</td>
                      {canSeeCostPrice && <td>${(item.costPrice || 0).toFixed(2)}</td>}
                      <td>${(item.sellPrice || 0).toFixed(2)}</td>
                      <td style={{ 
                      color: item.quantity < (item.minStock || 10) 
                          ? '#dc3545' // Red color directly
                          : 'inherit',
                      fontWeight: item.quantity < (item.minStock || 10) 
                          ? 'bold' 
                          : 'normal'
                      }}>
                      {item.quantity}
                      {item.quantity < (item.minStock || 10) && ' ⚠️'}
                      </td>
                      {userRole === 'admin' && (
                      <td>
                          <button 
                          className="btn btn-primary" 
                          onClick={() => handleEdit(item)}
                          >
                          Edit
                          </button>
                          <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(item.id)}
                          style={{marginLeft: '0.5rem'}}
                          >
                          Delete
                          </button>
                      </td>
                      )}
                  </tr>
                  ))
                )}
            </tbody>
            </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Barcode</label>
                <input type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                  <option value="">Select Category</option>
                  {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>Cost Price</label>
                <input type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Sell Price</label>
                <input type="number" step="0.01" value={formData.sellPrice} onChange={(e) => setFormData({...formData, sellPrice: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Min Stock Level</label>
                <input type="number" value={formData.minStock} onChange={(e) => setFormData({...formData, minStock: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                  <option value="pieces">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="liters">Liters</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingItem ? 'Update' : 'Add') + ' Product'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
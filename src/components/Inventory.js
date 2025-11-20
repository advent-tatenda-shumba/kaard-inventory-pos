import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';

const categories = [
  'Food Items', 'Beverages', 'Alcohol', 'Household Items',
  'Dish Washing', 'Soaps & Detergents', 'Perishables', 'Non-Perishables'
];

function Inventory({ selectedLocation, userRole, currentUser }) {
  const canSeeCostPrice = userRole === 'admin' || userRole === 'manager';
  
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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

  useEffect(() => {
    loadInventory();
  }, [selectedLocation]);

  const loadInventory = () => {
    const allInventory = getItem('inventory', []);
    const locationInventory = allInventory.filter(
      item => item.location === selectedLocation
    );
    setInventory(locationInventory);
  };

  const saveInventory = (updatedInventory) => {
    const allInventory = getItem('inventory', []);
    const otherLocations = allInventory.filter(
      item => item.location !== selectedLocation
    );
    setItem('inventory', [...otherLocations, ...updatedInventory]);
    setInventory(updatedInventory);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const processedData = {
      ...formData,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellPrice: parseFloat(formData.sellPrice) || 0,
      quantity: parseInt(formData.quantity) || 0,
      minStock: parseInt(formData.minStock) || 0
    };

    // --- FIX: PREVENT NEGATIVE VALUES ---
    if (processedData.costPrice < 0 || processedData.sellPrice < 0 || processedData.quantity < 0 || processedData.minStock < 0) {
      alert('Prices and quantities cannot be negative.');
      return;
    }
    // ------------------------------------

    if (editingItem) {
      const updated = inventory.map(item => 
        item.id === editingItem.id 
          ? { ...processedData, id: item.id, location: selectedLocation } 
          : item
      );
      saveInventory(updated);
    } else {
      const newItem = {
        ...processedData,
        id: Date.now(),
        location: selectedLocation,
      };
      saveInventory([...inventory, newItem]);
    }
    
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this item?')) {
      saveInventory(inventory.filter(item => item.id !== id));
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

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.barcode && item.barcode.includes(searchTerm));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
            {filteredInventory.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.barcode || 'N/A'}</td>
                {canSeeCostPrice && <td>${(item.costPrice || 0).toFixed(2)}</td>}
                <td>${(item.sellPrice || 0).toFixed(2)}</td>
                <td style={{ 
                  color: item.quantity < (item.lowStockThreshold || 10) 
                    ? 'var(--danger-color)' 
                    : 'inherit',
                  fontWeight: item.quantity < (item.lowStockThreshold || 10) 
                    ? 'bold' 
                    : 'normal'
                }}>
                  {item.quantity}
                  {item.quantity < (item.lowStockThreshold || 10) && ' ⚠️'}
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
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cost Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Sell Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({...formData, sellPrice: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Min Stock Level</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                  <option value="pieces">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="liters">Liters</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Add'} Product
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
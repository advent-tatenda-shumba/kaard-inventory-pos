import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';

function StockRequests({ selectedLocation, currentUser }) {
  const [requests, setRequests] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    loadRequests();
    loadInventory();
  }, [selectedLocation]);

  const loadRequests = () => {
    const allRequests = getItem('stockRequests', []);
    if (currentUser.role === 'admin') {
      setRequests(allRequests);
    } else {
      setRequests(allRequests.filter(req => req.location === selectedLocation));
    }
  };

  const loadInventory = () => {
    const allInventory = getItem('inventory', []);
    const locationInventory = allInventory.filter(item => item.location === selectedLocation);
    setInventory(locationInventory);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRequest = {
      id: Date.now(),
      location: selectedLocation,
      itemName: formData.itemName,
      quantity: parseInt(formData.quantity),
      reason: formData.reason,
      status: 'pending',
      requestedBy: currentUser.username,
      requestDate: new Date().toISOString(),
      approvedBy: null,
      approvedDate: null,
      notes: ''
    };
    
    const allRequests = getItem('stockRequests', []);
    setItem('stockRequests', [...allRequests, newRequest]);
    
    setFormData({ itemName: '', quantity: '', reason: '' });
    setShowNewRequest(false);
    loadRequests();
    alert('Stock request submitted successfully!');
  };

  const handleApprove = (requestId) => {
    const allRequests = getItem('stockRequests', []);
    const updated = allRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'approved', approvedBy: currentUser.username, approvedDate: new Date().toISOString() }
        : req
    );
    setItem('stockRequests', updated);
    loadRequests();
    alert('Request approved! Remember to transfer the stock.');
  };

  const handleReject = (requestId) => {
    const notes = prompt('Reason for rejection:');
    if (notes === null) return;

    const allRequests = getItem('stockRequests', []);
    const updated = allRequests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'rejected', approvedBy: currentUser.username, approvedDate: new Date().toISOString(), notes }
        : req
    );
    setItem('stockRequests', updated);
    loadRequests();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Stock Requests</h1>
        {currentUser.role === 'manager' && (
          <button className="btn btn-primary" onClick={() => setShowNewRequest(true)}>
            + New Request
          </button>
        )}
      </div>

      {showNewRequest && (
        <div className="modal-overlay" onClick={() => setShowNewRequest(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Stock Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item Name:</label>
                <select
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  required
                >
                  <option value="">Select Item</option>
                  {inventory
                    .filter(item => item.quantity < (item.lowStockThreshold || 10))
                    .map(item => (
                      <option key={item.id} value={item.name}>
                        {item.name} (Current: {item.quantity})
                      </option>
                     ))
                  }
                </select>
              </div>

              <div className="form-group">
                <label>Quantity Needed:</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason:</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-success">Submit Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewRequest(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Location</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Reason</th>
              <th>Requested By</th>
              <th>Status</th>
              {currentUser.role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>
                  No stock requests found
                </td>
              </tr>
            ) : (
              requests.map(request => (
                <tr key={request.id}>
                  <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td>{request.location}</td>
                  <td>{request.itemName}</td>
                  <td>{request.quantity}</td>
                  <td>{request.reason}</td>
                  <td>{request.requestedBy}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: getStatusColor(request.status),
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}>
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  {currentUser.role === 'admin' && (
                    <td>
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-success" 
                            onClick={() => handleApprove(request.id)}
                            style={{marginRight: '0.5rem'}}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger" 
                            onClick={() => handleReject(request.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status !== 'pending' && (
                        <span style={{fontSize: '0.85rem', color: '#6c757d'}}>
                          {request.status === 'approved' ? 'Approved' : `Rejected: ${request.notes}`}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockRequests;
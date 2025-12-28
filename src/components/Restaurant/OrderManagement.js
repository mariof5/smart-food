import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/databaseService';

const OrderManagement = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for orders
    const unsubscribe = orderService.listenToOrders(currentUser.uid, (newOrders) => {
      setOrders(newOrders);
      applyFilter(newOrders, filter);
      setLoading(false);
      
      // Show notification for new orders
      const newOrder = newOrders.find(order => 
        order.status === 'placed' && 
        !orders.find(existingOrder => existingOrder.id === order.id)
      );
      
      if (newOrder && orders.length > 0) {
        toast.success(`🔔 New order received: ${newOrder.orderNumber}`, {
          autoClose: 5000,
          onClick: () => setSelectedOrder(newOrder)
        });
        
        // Play notification sound
        playNotificationSound();
      }
    });

    return () => unsubscribe();
  }, [currentUser, orders.length]);

  const playNotificationSound = () => {
    // Create audio notification
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {}); // Ignore errors if audio fails
  };

  const applyFilter = (orderList, filterType) => {
    let filtered = orderList;
    
    switch (filterType) {
      case 'pending':
        filtered = orderList.filter(order => order.status === 'placed');
        break;
      case 'preparing':
        filtered = orderList.filter(order => order.status === 'preparing');
        break;
      case 'ready':
        filtered = orderList.filter(order => order.status === 'ready');
        break;
      case 'completed':
        filtered = orderList.filter(order => order.status === 'delivered');
        break;
      default:
        filtered = orderList;
    }
    
    setFilteredOrders(filtered);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    applyFilter(orders, newFilter);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const result = await orderService.updateStatus(orderId, newStatus, currentUser.uid);
      if (result.success) {
        const statusMessages = {
          'preparing': '🔥 Order is now being prepared!',
          'ready': '✅ Order is ready for pickup!',
          'picked': '🏍️ Order is out for delivery!',
          'delivered': '🎉 Order has been delivered!'
        };
        
        toast.success(statusMessages[newStatus] || `Order status updated to ${newStatus}`);
      } else {
        toast.error(result.error || 'Failed to update order status');
      }
    } catch (error) {
      toast.error('An error occurred while updating order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'warning',
      'preparing': 'info',
      'ready': 'primary',
      'picked': 'primary',
      'delivered': 'success'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'placed': 'clock',
      'preparing': 'fire',
      'ready': 'box',
      'picked': 'motorcycle',
      'delivered': 'check-double'
    };
    return icons[status] || 'circle';
  };

  const getNextStatusButton = (order) => {
    const statusFlow = {
      'placed': { next: 'preparing', label: 'Start Preparing', color: 'info', icon: 'fire' },
      'preparing': { next: 'ready', label: 'Mark Ready', color: 'primary', icon: 'check' },
      'ready': { next: 'picked', label: 'Out for Delivery', color: 'warning', icon: 'motorcycle' },
      'picked': { next: 'delivered', label: 'Mark Delivered', color: 'success', icon: 'check-double' }
    };

    const nextStatus = statusFlow[order.status];
    
    if (!nextStatus) {
      return (
        <button className="btn btn-success btn-sm" disabled>
          <i className="fas fa-check-circle me-1"></i>
          Completed
        </button>
      );
    }

    return (
      <button 
        className={`btn btn-${nextStatus.color} btn-sm`}
        onClick={() => updateOrderStatus(order.id, nextStatus.next)}
      >
        <i className={`fas fa-${nextStatus.icon} me-1`}></i>
        {nextStatus.label}
      </button>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header with Stats */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="stat-item">
                    <h3 className="text-primary">{orders.length}</h3>
                    <p className="text-muted mb-0">Total Orders</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-item">
                    <h3 className="text-warning">{orders.filter(o => o.status === 'placed').length}</h3>
                    <p className="text-muted mb-0">New Orders</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-item">
                    <h3 className="text-info">{orders.filter(o => o.status === 'preparing').length}</h3>
                    <p className="text-muted mb-0">Preparing</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-item">
                    <h3 className="text-success">{orders.filter(o => o.status === 'delivered').length}</h3>
                    <p className="text-muted mb-0">Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="btn-group" role="group">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('all')}
            >
              <i className="fas fa-list me-1"></i>
              All ({orders.length})
            </button>
            <button 
              className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => handleFilterChange('pending')}
            >
              <i className="fas fa-clock me-1"></i>
              New ({orders.filter(o => o.status === 'placed').length})
            </button>
            <button 
              className={`btn ${filter === 'preparing' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => handleFilterChange('preparing')}
            >
              <i className="fas fa-fire me-1"></i>
              Preparing ({orders.filter(o => o.status === 'preparing').length})
            </button>
            <button 
              className={`btn ${filter === 'ready' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterChange('ready')}
            >
              <i className="fas fa-check me-1"></i>
              Ready ({orders.filter(o => o.status === 'ready').length})
            </button>
            <button 
              className={`btn ${filter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => handleFilterChange('completed')}
            >
              <i className="fas fa-check-double me-1"></i>
              Completed ({orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="row">
        <div className="col-12">
          {filteredOrders.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No {filter === 'all' ? '' : filter} orders found</h5>
                <p className="text-muted">Orders will appear here in real-time</p>
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="card mb-3 order-card-realtime">
                <div className="card-header bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">
                        <i className="fas fa-receipt me-2 text-primary"></i>
                        Order {order.orderNumber}
                      </h5>
                      <small className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        {formatTimestamp(order.createdAt)}
                      </small>
                    </div>
                    <span className={`badge bg-${getStatusColor(order.status)} fs-6 px-3 py-2`}>
                      <i className={`fas fa-${getStatusIcon(order.status)} me-1`}></i>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <h6 className="text-primary mb-2">
                        <i className="fas fa-user me-2"></i>Customer Details
                      </h6>
                      <p className="mb-1"><strong>Phone:</strong> {order.phoneNumber}</p>
                      <p className="mb-1"><strong>Address:</strong> {order.deliveryAddress}</p>
                      <p className="mb-0"><strong>Delivery Time:</strong> {formatTimestamp(order.deliveryDateTime)}</p>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-primary mb-2">
                        <i className="fas fa-credit-card me-2"></i>Payment Info
                      </h6>
                      <p className="mb-1"><strong>Method:</strong> {order.paymentMethod}</p>
                      <p className="mb-1"><strong>Subtotal:</strong> {order.subtotal?.toFixed(2)} ETB</p>
                      <p className="mb-0">
                        <strong>Total:</strong> 
                        <span className="text-success fw-bold ms-1">{order.total?.toFixed(2)} ETB</span>
                      </p>
                    </div>
                  </div>

                  <h6 className="text-primary mb-2">
                    <i className="fas fa-utensils me-2"></i>
                    Order Items ({order.items?.length || 0})
                  </h6>
                  <div className="order-items-list mb-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                        {item.image && (
                          <img 
                            src={item.image} 
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} 
                            alt={item.name}
                          />
                        )}
                        <div className="flex-grow-1 ms-3">
                          <strong>{item.name}</strong>
                          <small className="text-muted d-block">{item.description}</small>
                        </div>
                        <div className="text-end">
                          <div className="badge bg-secondary">x{item.quantity}</div>
                          <div className="text-primary fw-bold">{(item.price * item.quantity).toFixed(2)} ETB</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                    <div>
                      <strong className="text-muted">Update Status:</strong>
                    </div>
                    <div className="d-flex gap-2">
                      {getNextStatusButton(order)}
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <i className="fas fa-eye"></i> Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-receipt me-2"></i>
                  Order Details - {selectedOrder.orderNumber}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Customer Information</h6>
                    <p><strong>Phone:</strong> {selectedOrder.phoneNumber}</p>
                    <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
                    <p><strong>Delivery Time:</strong> {formatTimestamp(selectedOrder.deliveryDateTime)}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Order Information</h6>
                    <p><strong>Status:</strong> 
                      <span className={`badge bg-${getStatusColor(selectedOrder.status)} ms-2`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p><strong>Order Time:</strong> {formatTimestamp(selectedOrder.createdAt)}</p>
                    <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
                  </div>
                </div>
                
                <h6 className="mt-3">Items Ordered</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.price} ETB</td>
                          <td>{(item.price * item.quantity).toFixed(2)} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3">Total</th>
                        <th>{selectedOrder.total?.toFixed(2)} ETB</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
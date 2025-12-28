import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/databaseService';
import { toast } from 'react-toastify';
import OrderTrackingMap from './OrderTrackingMap';

const OrderTracking = ({ orderId, onClose }) => {
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    // Set up real-time listener for this specific order
    const unsubscribe = orderService.listenToOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
      setLoading(false);

      // Show notification when status changes
      if (order && order.status !== updatedOrder.status) {
        const statusMessages = {
          'confirmed': '✅ Your order has been confirmed!',
          'preparing': '🔥 Your order is being prepared!',
          'ready': '📦 Your order is ready for pickup!',
          'picked': '🏍️ Your order is out for delivery!',
          'nearby': '📍 Driver is nearby!',
          'delivered': '🎉 Your order has been delivered! Enjoy your meal!'
        };

        const message = statusMessages[updatedOrder.status];
        if (message) {
          toast.success(message, { autoClose: 5000 });
        }
      }
    });

    return () => unsubscribe();
  }, [orderId, order?.status]);

  const getStatusProgress = (status) => {
    const statusOrder = ['placed', 'confirmed', 'preparing', 'ready', 'picked', 'nearby', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'warning',
      'confirmed': 'info',
      'preparing': 'info',
      'ready': 'primary',
      'picked': 'primary',
      'nearby': 'warning',
      'delivered': 'success'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'placed': 'clock',
      'confirmed': 'check',
      'preparing': 'fire',
      'ready': 'box',
      'picked': 'motorcycle',
      'nearby': 'map-marker-alt',
      'delivered': 'check-double'
    };
    return icons[status] || 'circle';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getEstimatedDeliveryTime = () => {
    if (!order) return 'Calculating...';

    const statusTimes = {
      'placed': 30,
      'confirmed': 25,
      'preparing': 20,
      'ready': 15,
      'picked': 10,
      'nearby': 5,
      'delivered': 0
    };

    const estimatedMinutes = statusTimes[order.status] || 30;
    if (estimatedMinutes === 0) return 'Delivered!';

    return `${estimatedMinutes} minutes`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Order not found or you don't have permission to view it.
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
            <div className="card-body p-0">
              <div className="row g-0">
                <div className="col-lg-8">
                  <OrderTrackingMap order={order} />
                </div>
                <div className="col-lg-4 p-4 d-flex flex-column justify-content-center text-center">
                  <div className="mb-3">
                    <i className={`fas fa-${getStatusIcon(order.status)} fa-3x text-${getStatusColor(order.status)}`}></i>
                  </div>
                  <h2 className="mb-2">Order {order.orderNumber}</h2>
                  <span className={`badge bg-${getStatusColor(order.status)} fs-5 px-3 py-2 rounded-pill shadow-sm mb-3`}>
                    <i className={`fas fa-${getStatusIcon(order.status)} me-2`}></i>
                    {order.status.toUpperCase()}
                  </span>
                  <p className="text-muted mt-2 mb-0">
                    Estimated delivery: <strong className="text-dark">{getEstimatedDeliveryTime()}</strong>
                  </p>
                  {order.status === 'cancelled' && order.cancellationReason && (
                    <div className="alert alert-danger mt-3 mb-0 border-start border-4 border-danger py-2">
                      <small className="fw-bold d-block">Order Cancelled</small>
                      <small>{order.cancellationReason}</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3">
                <i className="fas fa-route me-2"></i>
                Order Progress
              </h5>
              <div className="progress mb-3" style={{ height: '20px' }}>
                <div
                  className={`progress-bar bg-${getStatusColor(order.status)}`}
                  style={{ width: `${getStatusProgress(order.status)}%` }}
                >
                  {Math.round(getStatusProgress(order.status))}%
                </div>
              </div>

              {/* Timeline */}
              <div className="timeline">
                {[
                  { status: 'placed', label: 'Order Placed', desc: 'Your order has been received' },
                  { status: 'confirmed', label: 'Confirmed', desc: 'Restaurant confirmed your order' },
                  { status: 'preparing', label: 'Preparing', desc: 'Your food is being prepared' },
                  { status: 'ready', label: 'Ready', desc: 'Food is ready for pickup' },
                  { status: 'picked', label: 'Out for Delivery', desc: 'Driver is on the way' },
                  { status: 'nearby', label: 'Driver Nearby', desc: 'Driver is approaching' },
                  { status: 'delivered', label: 'Delivered', desc: 'Order delivered successfully' }
                ].map((step, index) => {
                  const statusOrder = ['placed', 'confirmed', 'preparing', 'ready', 'picked', 'nearby', 'delivered'];
                  const currentIndex = statusOrder.indexOf(order.status);
                  const stepIndex = statusOrder.indexOf(step.status);
                  const isActive = stepIndex <= currentIndex;
                  const isCurrent = step.status === order.status;

                  return (
                    <div key={step.status} className={`timeline-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="timeline-marker">
                        <i className={`fas fa-${getStatusIcon(step.status)}`}></i>
                      </div>
                      <div className="timeline-content">
                        <h6 className="mb-1">{step.label}</h6>
                        <small className="text-muted">{step.desc}</small>
                        {isCurrent && (
                          <div className="mt-1">
                            <small className="text-primary">
                              <i className="fas fa-clock me-1"></i>
                              Current status
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Order Details
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Restaurant:</strong>
                <p className="mb-0">{order.restaurantName || 'Restaurant Name'}</p>
              </div>
              <div className="mb-3">
                <strong>Order Time:</strong>
                <p className="mb-0">{formatTimestamp(order.createdAt)}</p>
              </div>
              <div className="mb-3">
                <strong>Delivery Address:</strong>
                <p className="mb-0">{order.deliveryAddress}</p>
              </div>
              <div className="mb-3">
                <strong>Phone:</strong>
                <p className="mb-0">{order.phoneNumber}</p>
              </div>
              <div className="mb-0">
                <strong>Payment Method:</strong>
                <p className="mb-0">{order.paymentMethod}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-utensils me-2"></i>
                Items Ordered
              </h5>
            </div>
            <div className="card-body">
              <div className="order-items-scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {order.items && order.items.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {order.items.map((item, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">{item.name}</h6>
                          <small className="text-muted">Quantity: {item.quantity}</small>
                        </div>
                        <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} ETB</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No items found</p>
                )}
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Subtotal:</span>
                <strong>{order.subtotal?.toFixed(2)} ETB</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Delivery Fee:</span>
                <strong>{order.deliveryFee?.toFixed(2)} ETB</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Total:</h5>
                <h5 className="mb-0 text-primary">{order.total?.toFixed(2)} ETB</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
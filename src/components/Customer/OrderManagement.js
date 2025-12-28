import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { orderService, refundService, disputeService } from '../../services/databaseService';

const OrderManagement = ({ onTrackOrder }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [modificationItems, setModificationItems] = useState([]);
  const [disputeForm, setDisputeForm] = useState({
    type: '',
    description: '',
    evidence: []
  });

  useEffect(() => {
    let unsubscribeOrders;

    const setupListeners = async () => {
      if (!currentUser?.uid) return;

      try {
        // Real-time Orders Listener
        unsubscribeOrders = orderService.listenToCustomerOrders(currentUser.uid, (ordersData) => {
          setOrders(ordersData);
          setLoading(false);
        });

        // Load other data (Refunds, Disputes) - kept as one-time fetch for now
        const [refundsData, disputesData] = await Promise.all([
          refundService.getByCustomer(currentUser.uid),
          disputeService.getByCustomer(currentUser.uid)
        ]);
        setRefunds(refundsData);
        setDisputes(disputesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [currentUser]);

  // Reload non-realtime data
  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [refundsData, disputesData] = await Promise.all([
        refundService.getByCustomer(currentUser.uid),
        disputeService.getByCustomer(currentUser.uid)
      ]);
      setRefunds(refundsData);
      setDisputes(disputesData);
    } catch (error) {
      console.error('Error reloading data:', error);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      const result = await orderService.cancelOrder(
        selectedOrder.id,
        cancelReason,
        currentUser.uid
      );

      if (result.success) {
        toast.success('Order cancelled successfully!');
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedOrder(null);
        loadData();
      } else {
        toast.error(result.error || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('An error occurred while cancelling the order');
    }
  };

  const handleModifyOrder = async () => {
    if (!selectedOrder || modificationItems.length === 0) {
      toast.error('Please add items to modify the order');
      return;
    }

    try {
      const modifications = {
        items: modificationItems,
        reason: 'Customer requested modification'
      };

      const result = await orderService.modifyOrder(
        selectedOrder.id,
        modifications,
        currentUser.uid
      );

      if (result.success) {
        toast.success('Order modified successfully!');
        setShowModifyModal(false);
        setModificationItems([]);
        setSelectedOrder(null);
        loadData();
      } else {
        toast.error(result.error || 'Failed to modify order');
      }
    } catch (error) {
      toast.error('An error occurred while modifying the order');
    }
  };

  const handleCreateDispute = async () => {
    if (!selectedOrder || !disputeForm.type || !disputeForm.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await disputeService.create(
        selectedOrder.id,
        disputeForm.type,
        disputeForm.description,
        disputeForm.evidence,
        currentUser.uid
      );

      if (result.success) {
        toast.success('Dispute created successfully! We will review it shortly.');
        setShowDisputeModal(false);
        setDisputeForm({ type: '', description: '', evidence: [] });
        setSelectedOrder(null);
        loadData();
      } else {
        toast.error(result.error || 'Failed to create dispute');
      }
    } catch (error) {
      toast.error('An error occurred while creating the dispute');
    }
  };

  const canCancelOrder = (order) => {
    if (!order.canCancel || order.status === 'cancelled' || order.status === 'delivered') {
      return false;
    }

    const deadline = order.cancellationDeadline?.toDate ? order.cancellationDeadline.toDate() : new Date(order.cancellationDeadline || 0);
    return new Date() <= deadline;
  };

  const canModifyOrder = (order) => {
    if (!order.canModify || ['preparing', 'ready', 'picked', 'delivered', 'cancelled'].includes(order.status)) {
      return false;
    }

    const deadline = order.modificationDeadline?.toDate ? order.modificationDeadline.toDate() : new Date(order.modificationDeadline || 0);
    return new Date() <= deadline;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'warning',
      'confirmed': 'info',
      'preparing': 'info',
      'ready': 'primary',
      'picked': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
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
      'delivered': 'check-double',
      'cancelled': 'times-circle'
    };
    return icons[status] || 'circle';
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="fas fa-shopping-bag me-2"></i>
                My Orders ({orders.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'refunds' ? 'active' : ''}`}
                onClick={() => setActiveTab('refunds')}
              >
                <i className="fas fa-undo me-2"></i>
                Refunds ({refunds.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'disputes' ? 'active' : ''}`}
                onClick={() => setActiveTab('disputes')}
              >
                <i className="fas fa-exclamation-triangle me-2"></i>
                Disputes ({disputes.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="row">
          <div className="col-12">
            {orders.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No orders yet</h5>
                  <p className="text-muted">Start ordering from your favorite restaurants!</p>
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="card mb-3">
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-0">
                          <i className="fas fa-receipt me-2"></i>
                          Order {order.orderNumber}
                        </h5>
                        <small className="text-muted">
                          {formatTimestamp(order.createdAt)}
                        </small>
                      </div>
                      <span className={`badge bg-${getStatusColor(order.status)} fs-6 shadow-sm rounded-pill px-3`}>
                        <i className={`fas fa-${getStatusIcon(order.status)} me-1`}></i>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <h6>Order Details</h6>
                        <p className="mb-1"><strong>Items:</strong> {order.items?.length || 0}</p>
                        <p className="mb-1"><strong>Total:</strong> {order.total?.toFixed(2)} ETB</p>
                        <p className="mb-0"><strong>Payment:</strong> {order.paymentMethod}</p>
                      </div>
                      <div className="col-md-6">
                        <h6>Delivery Info</h6>
                        <p className="mb-1"><strong>Address:</strong> {order.deliveryAddress}</p>
                        <p className="mb-1"><strong>Phone:</strong> {order.phoneNumber}</p>
                        <p className="mb-0"><strong>Scheduled:</strong> {formatTimestamp(order.deliveryDateTime)}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-3">
                      <h6>Items Ordered</h6>
                      <div className="row">
                        {order.items?.map((item, index) => (
                          <div key={index} className="col-md-6 mb-2">
                            <div className="d-flex align-items-center p-2 bg-light rounded">
                              {item.image && (
                                <img
                                  src={item.image}
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                  alt={item.name}
                                />
                              )}
                              <div className="ms-2 flex-grow-1">
                                <strong>{item.name}</strong>
                                <div className="text-muted small">x{item.quantity} - {(item.price * item.quantity).toFixed(2)} ETB</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2 flex-wrap">
                      {canCancelOrder(order) && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowCancelModal(true);
                          }}
                        >
                          <i className="fas fa-times me-1"></i>
                          Cancel Order
                        </button>
                      )}

                      {canModifyOrder(order) && (
                        <button
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setModificationItems([...order.items]);
                            setShowModifyModal(true);
                          }}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Modify Order
                        </button>
                      )}

                      {['delivered', 'cancelled'].includes(order.status) && (
                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDisputeModal(true);
                          }}
                        >
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Report Issue
                        </button>
                      )}

                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onTrackOrder(order.id)}
                      >
                        <i className="fas fa-map-marker-alt me-1"></i>
                        Track Order
                      </button>
                    </div>

                    {/* Cancellation Reason */}
                    {order.status === 'cancelled' && order.cancellationReason && (
                      <div className="mt-3 p-3 bg-danger bg-opacity-10 border-start border-4 border-danger rounded">
                        <h6 className="text-danger mb-1">
                          <i className="fas fa-exclamation-circle me-2"></i>
                          Cancellation Reason
                        </h6>
                        <p className="mb-0 text-dark">{order.cancellationReason}</p>
                      </div>
                    )}

                    {/* Cancellation/Modification Deadlines */}
                    {order.status !== 'cancelled' && (order.canCancel || order.canModify) && (
                      <div className="mt-3 p-2 bg-info bg-opacity-10 rounded">
                        <small className="text-info">
                          <i className="fas fa-info-circle me-1"></i>
                          {order.canCancel && (
                            <>Cancel by: {formatTimestamp(order.cancellationDeadline)}</>
                          )}
                          {order.canCancel && order.canModify && ' • '}
                          {order.canModify && (
                            <>Modify by: {formatTimestamp(order.modificationDeadline)}</>
                          )}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Refunds Tab */}
      {activeTab === 'refunds' && (
        <div className="row">
          <div className="col-12">
            {refunds.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-undo fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No refunds</h5>
                  <p className="text-muted">Your refund requests will appear here</p>
                </div>
              </div>
            ) : (
              refunds.map((refund) => (
                <div key={refund.id} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6>Refund #{refund.refundId}</h6>
                        <p className="mb-1">Order: {refund.orderId}</p>
                        <p className="mb-1">Amount: {refund.amount} ETB</p>
                        <p className="mb-0">Reason: {refund.reason}</p>
                      </div>
                      <span className={`badge bg-${refund.status === 'completed' ? 'success' : refund.status === 'pending' ? 'warning' : 'danger'}`}>
                        {refund.status}
                      </span>
                    </div>
                    <small className="text-muted">
                      Requested: {formatTimestamp(refund.createdAt)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="row">
          <div className="col-12">
            {disputes.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No disputes</h5>
                  <p className="text-muted">Your dispute reports will appear here</p>
                </div>
              </div>
            ) : (
              disputes.map((dispute) => (
                <div key={dispute.id} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6>Dispute #{dispute.disputeId}</h6>
                      <span className={`badge bg-${dispute.status === 'resolved' ? 'success' : dispute.status === 'open' ? 'warning' : 'info'}`}>
                        {dispute.status}
                      </span>
                    </div>
                    <p className="mb-1"><strong>Type:</strong> {dispute.type}</p>
                    <p className="mb-1"><strong>Order:</strong> {dispute.orderId}</p>
                    <p className="mb-2">{dispute.description}</p>
                    {dispute.resolution && (
                      <div className="alert alert-success">
                        <strong>Resolution:</strong> {dispute.resolution}
                      </div>
                    )}
                    <small className="text-muted">
                      Created: {formatTimestamp(dispute.createdAt)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel order {selectedOrder?.orderNumber}?</p>
                <div className="mb-3">
                  <label className="form-label">Reason for cancellation *</label>
                  <select
                    className="form-select"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="">Select a reason</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Found better option">Found better option</option>
                    <option value="Delivery time too long">Delivery time too long</option>
                    <option value="Payment issues">Payment issues</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {cancelReason === 'Other' && (
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      placeholder="Please specify..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancelOrder}
                  disabled={!cancelReason}
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Issue</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDisputeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Issue Type *</label>
                  <select
                    className="form-select"
                    value={disputeForm.type}
                    onChange={(e) => setDisputeForm({ ...disputeForm, type: e.target.value })}
                  >
                    <option value="">Select issue type</option>
                    <option value="quality">Food Quality Issue</option>
                    <option value="delivery">Delivery Problem</option>
                    <option value="billing">Billing/Payment Issue</option>
                    <option value="service">Poor Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Please describe the issue in detail..."
                    value={disputeForm.description}
                    onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  />
                </div>
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Our support team will review your report and get back to you within 24 hours.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateDispute}
                  disabled={!disputeForm.type || !disputeForm.description.trim()}
                >
                  Submit Report
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
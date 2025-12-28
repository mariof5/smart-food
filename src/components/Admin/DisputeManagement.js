import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { disputeService, refundService, orderService } from '../../services/databaseService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DisputeManagement = () => {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('disputes');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    // Set up real-time listeners
    const disputesQuery = query(
      collection(db, 'disputes'),
      orderBy('createdAt', 'desc')
    );

    const refundsQuery = query(
      collection(db, 'refunds'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeDisputes = onSnapshot(disputesQuery, (snapshot) => {
      const disputesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDisputes(disputesData);
      setLoading(false);
    });

    const unsubscribeRefunds = onSnapshot(refundsQuery, (snapshot) => {
      const refundsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRefunds(refundsData);
    });

    return () => {
      unsubscribeDisputes();
      unsubscribeRefunds();
    };
  }, []);

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolutionText.trim()) {
      toast.error('Please provide a resolution');
      return;
    }

    try {
      const result = await disputeService.resolve(
        selectedDispute.id,
        resolutionText,
        currentUser.uid
      );

      if (result.success) {
        toast.success('Dispute resolved successfully!');
        setSelectedDispute(null);
        setResolutionText('');
      } else {
        toast.error(result.error || 'Failed to resolve dispute');
      }
    } catch (error) {
      toast.error('An error occurred while resolving the dispute');
    }
  };

  const handleAddMessage = async () => {
    if (!selectedDispute || !messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      const result = await disputeService.addMessage(
        selectedDispute.id,
        messageText,
        currentUser.uid
      );

      if (result.success) {
        toast.success('Message added successfully!');
        setMessageText('');
      } else {
        toast.error(result.error || 'Failed to add message');
      }
    } catch (error) {
      toast.error('An error occurred while adding the message');
    }
  };

  const handleProcessRefund = async (status, note = '') => {
    if (!selectedRefund) return;

    try {
      const result = await refundService.processRefund(
        selectedRefund.id,
        status,
        currentUser.uid,
        note
      );

      if (result.success) {
        toast.success(`Refund ${status} successfully!`);
        setSelectedRefund(null);
      } else {
        toast.error(result.error || 'Failed to process refund');
      }
    } catch (error) {
      toast.error('An error occurred while processing the refund');
    }
  };

  const getDisputePriorityColor = (priority) => {
    const colors = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'info'
    };
    return colors[priority] || 'secondary';
  };

  const getDisputeStatusColor = (status) => {
    const colors = {
      'open': 'warning',
      'in-progress': 'info',
      'resolved': 'success',
      'closed': 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const getRefundStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'info',
      'completed': 'success',
      'rejected': 'danger'
    };
    return colors[status] || 'secondary';
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
      {/* Header Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-warning">{disputes.filter(d => d.status === 'open').length}</h3>
              <p className="text-muted mb-0">Open Disputes</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-info">{disputes.filter(d => d.status === 'in-progress').length}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-warning">{refunds.filter(r => r.status === 'pending').length}</h3>
              <p className="text-muted mb-0">Pending Refunds</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success">{disputes.filter(d => d.status === 'resolved').length}</h3>
              <p className="text-muted mb-0">Resolved Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'disputes' ? 'active' : ''}`}
                onClick={() => setActiveTab('disputes')}
              >
                <i className="fas fa-exclamation-triangle me-2"></i>
                Disputes ({disputes.length})
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
          </ul>
        </div>
      </div>

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="row">
          <div className="col-12">
            {disputes.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                  <h5 className="text-muted">No disputes to resolve</h5>
                  <p className="text-muted">All disputes have been handled!</p>
                </div>
              </div>
            ) : (
              disputes.map((dispute) => (
                <div key={dispute.id} className="card mb-3">
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          Dispute #{dispute.disputeId}
                        </h6>
                        <small className="text-muted">
                          Order: {dispute.orderId} • Created: {formatTimestamp(dispute.createdAt)}
                        </small>
                      </div>
                      <div className="d-flex gap-2">
                        <span className={`badge bg-${getDisputePriorityColor(dispute.priority)}`}>
                          {dispute.priority} priority
                        </span>
                        <span className={`badge bg-${getDisputeStatusColor(dispute.status)}`}>
                          {dispute.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="row mb-3">
                      <div className="col-md-8">
                        <h6>Issue Details</h6>
                        <p className="mb-1"><strong>Type:</strong> {dispute.type}</p>
                        <p className="mb-2">{dispute.description}</p>
                        
                        {dispute.messages && dispute.messages.length > 0 && (
                          <div className="mt-3">
                            <h6>Messages</h6>
                            <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              {dispute.messages.map((message, index) => (
                                <div key={index} className="mb-2 p-2 bg-light rounded">
                                  <small className="text-muted">
                                    {formatTimestamp(message.timestamp)} - {message.sender}
                                  </small>
                                  <p className="mb-0">{message.message}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-md-4">
                        <h6>Actions</h6>
                        {dispute.status !== 'resolved' && (
                          <div className="d-grid gap-2">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <i className="fas fa-gavel me-1"></i>
                              Resolve Dispute
                            </button>
                            <button 
                              className="btn btn-outline-info btn-sm"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                // Show message modal
                              }}
                            >
                              <i className="fas fa-comment me-1"></i>
                              Add Message
                            </button>
                          </div>
                        )}
                        
                        {dispute.resolution && (
                          <div className="alert alert-success mt-3">
                            <strong>Resolution:</strong>
                            <p className="mb-0">{dispute.resolution}</p>
                            <small>Resolved: {formatTimestamp(dispute.resolvedAt)}</small>
                          </div>
                        )}
                      </div>
                    </div>
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
                  <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                  <h5 className="text-muted">No refunds to process</h5>
                  <p className="text-muted">All refunds have been handled!</p>
                </div>
              </div>
            ) : (
              refunds.map((refund) => (
                <div key={refund.id} className="card mb-3">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6>
                          <i className="fas fa-undo me-2"></i>
                          Refund #{refund.refundId}
                        </h6>
                        <p className="mb-1"><strong>Order:</strong> {refund.orderId}</p>
                        <p className="mb-1"><strong>Amount:</strong> {refund.amount} ETB</p>
                        <p className="mb-1"><strong>Reason:</strong> {refund.reason}</p>
                        <small className="text-muted">
                          Requested: {formatTimestamp(refund.createdAt)}
                        </small>
                        {refund.note && (
                          <div className="mt-2">
                            <small><strong>Note:</strong> {refund.note}</small>
                          </div>
                        )}
                      </div>
                      
                      <div className="d-flex flex-column align-items-end gap-2">
                        <span className={`badge bg-${getRefundStatusColor(refund.status)}`}>
                          {refund.status}
                        </span>
                        
                        {refund.status === 'pending' && (
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleProcessRefund('approved', 'Refund approved by admin')}
                            >
                              <i className="fas fa-check me-1"></i>
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleProcessRefund('rejected', 'Refund rejected by admin')}
                            >
                              <i className="fas fa-times me-1"></i>
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {refund.status === 'approved' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleProcessRefund('completed', 'Refund processed successfully')}
                          >
                            <i className="fas fa-money-bill-wave me-1"></i>
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {selectedDispute && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Resolve Dispute #{selectedDispute.disputeId}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setSelectedDispute(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>Dispute Details</h6>
                  <p><strong>Type:</strong> {selectedDispute.type}</p>
                  <p><strong>Description:</strong> {selectedDispute.description}</p>
                  <p><strong>Order:</strong> {selectedDispute.orderId}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Resolution *</label>
                  <textarea 
                    className="form-control"
                    rows="4"
                    placeholder="Provide a detailed resolution for this dispute..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Add Message (Optional)</label>
                  <textarea 
                    className="form-control"
                    rows="2"
                    placeholder="Add a message to communicate with the customer..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setSelectedDispute(null)}
                >
                  Cancel
                </button>
                {messageText && (
                  <button 
                    type="button" 
                    className="btn btn-info"
                    onClick={handleAddMessage}
                  >
                    Add Message
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleResolveDispute}
                  disabled={!resolutionText.trim()}
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
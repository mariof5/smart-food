import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/databaseService';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const [availableOrders, setAvailableOrders] = useState([]);
    const [activeDeliveries, setActiveDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDeliveries: 0,
        todayDeliveries: 0,
        earnings: 0
    });

    useEffect(() => {
        if (currentUser) {
            setupRealtimeListeners();
            loadStats();
        }
    }, [currentUser]);

    const setupRealtimeListeners = () => {
        setLoading(true);

        // Listen for available orders (ready for pickup)
        const unsubscribeAvailable = deliveryService.getAvailableOrders((orders) => {
            setAvailableOrders(orders);
            setLoading(false);
        });

        // Listen for active deliveries assigned to this driver
        const unsubscribeActive = deliveryService.getActiveDeliveries(currentUser.uid, (orders) => {
            setActiveDeliveries(orders);
        });

        return () => {
            unsubscribeAvailable();
            unsubscribeActive();
        };
    };

    const loadStats = async () => {
        const statsData = await deliveryService.getDriverStats(currentUser.uid);
        setStats(statsData);
    };

    const handleAcceptDelivery = async (order) => {
        setLoading(true);
        const result = await deliveryService.acceptDelivery(order.id, currentUser.uid, userData.name || 'Driver');
        if (result.success) {
            toast.success('Delivery accepted! Please proceed to restaurant.');
        } else {
            toast.error('Failed to accept delivery: ' + result.error);
        }
        setLoading(false);
    };

    const handleCompleteDelivery = async (order) => {
        if (!window.confirm('Confirm delivery completion?')) return;

        setLoading(true);
        const result = await deliveryService.completeDelivery(order.id, currentUser.uid);
        if (result.success) {
            toast.success('Order delivered successfully!');
            loadStats(); // Reload stats to show earnings
        } else {
            toast.error('Failed to complete delivery: ' + result.error);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await logout();
    };

    if (loading && !availableOrders.length && !activeDeliveries.length) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3">Loading delivery dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light dashboard-layout">
            {/* Navigation */}
            <nav className="navbar navbar-smartfood navbar-expand-lg navbar-light sticky-top shadow-sm">
                <div className="container-fluid">
                    <span className="navbar-brand-smartfood fw-bold ethiopia-flag text-decoration-none">
                        Food Express <small className="fs-6 text-muted ms-2">Driver</small>
                    </span>

                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarDriver">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarDriver">
                        <div className="ms-auto d-flex align-items-center">
                            <div className="me-3">
                                <span className="fw-semibold text-dark">
                                    <i className="fas fa-user-circle me-2 text-primary"></i>
                                    {userData?.name || 'Driver'}
                                </span>
                            </div>
                            <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt me-2"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container p-4">
                {/* Stats Cards */}
                <div className="row g-4 mb-4">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm driver-stats-card">
                            <div className="card-body text-center p-4">
                                <div className="feature-icon mb-3">
                                    <i className="fas fa-box"></i>
                                </div>
                                <h3 className="mb-1 fw-bold">{stats.totalDeliveries}</h3>
                                <p className="text-muted text-uppercase small fw-bold mb-0">Total Deliveries</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm driver-stats-card highlight-gold">
                            <div className="card-body text-center p-4">
                                <div className="feature-icon bg-warning bg-opacity-10 text-warning mb-3">
                                    <i className="fas fa-calendar-day"></i>
                                </div>
                                <h3 className="mb-1 fw-bold">{stats.todayDeliveries}</h3>
                                <p className="text-muted text-uppercase small fw-bold mb-0">Today's Deliveries</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm driver-stats-card highlight-rust">
                            <div className="card-body text-center p-4">
                                <div className="feature-icon bg-success bg-opacity-10 text-success mb-3">
                                    <i className="fas fa-wallet"></i>
                                </div>
                                <h3 className="mb-1 fw-bold text-primary">{stats.earnings.toFixed(2)} <small className="fs-6">ETB</small></h3>
                                <p className="text-muted text-uppercase small fw-bold mb-0">Today's Earnings</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Active Deliveries Column */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100 border-0">
                            <div className="card-header bg-white py-3 border-0">
                                <h5 className="mb-0 fw-bold text-primary">
                                    <i className="fas fa-map-marked-alt me-2"></i>
                                    My Active Deliveries
                                    {activeDeliveries.length > 0 && <span className="badge bg-primary ms-2">{activeDeliveries.length}</span>}
                                </h5>
                            </div>
                            <div className="card-body">
                                {activeDeliveries.length === 0 ? (
                                    <div className="text-center text-muted py-5">
                                        <i className="fas fa-check-circle fa-3x mb-3 opacity-25"></i>
                                        <p>No active deliveries.</p>
                                        <small>Accept a request to get started!</small>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {activeDeliveries.map((delivery) => (
                                            <div key={delivery.id} className="card border-primary border-2">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 className="fw-bold mb-0">Order {delivery.orderNumber}</h6>
                                                        <span className="badge bg-info">{delivery.status.toUpperCase()}</span>
                                                    </div>

                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-start mb-2">
                                                            <i className="fas fa-store text-danger mt-1 me-2"></i>
                                                            <div>
                                                                <small className="text-muted d-block">Pickup</small>
                                                                <strong>{delivery.restaurantName}</strong>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-start">
                                                            <i className="fas fa-map-marker-alt text-success mt-1 me-2"></i>
                                                            <div>
                                                                <small className="text-muted d-block">Dropoff</small>
                                                                <strong>{delivery.deliveryAddress}</strong>
                                                                <div className="text-muted small">{delivery.phoneNumber}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="d-grid gap-2">
                                                        {delivery.status === 'picked' ? (
                                                            <button
                                                                className="btn btn-success btn-lg"
                                                                onClick={() => handleCompleteDelivery(delivery)}
                                                            >
                                                                <i className="fas fa-check-circle me-2"></i>
                                                                Complete Delivery
                                                            </button>
                                                        ) : (
                                                            <div className="alert alert-info mb-0 text-center">
                                                                <small>Head to restaurant for pickup</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Available Orders Column */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100 border-0">
                            <div className="card-header bg-white py-3 border-0">
                                <h5 className="mb-0 fw-bold text-success">
                                    <i className="fas fa-list-ul me-2"></i>
                                    Available for Pickup
                                    {availableOrders.length > 0 && <span className="badge bg-success ms-2">{availableOrders.length}</span>}
                                </h5>
                            </div>
                            <div className="card-body">
                                {availableOrders.length === 0 ? (
                                    <div className="text-center text-muted py-5">
                                        <i className="fas fa-clock fa-3x mb-3 opacity-25"></i>
                                        <p>No new orders available.</p>
                                        <div className="spinner-grow spinner-grow-sm text-warning" role="status"></div>
                                        <small className="ms-2">Waiting for new requests...</small>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {availableOrders.map((order) => (
                                            <div key={order.id} className="card hover-shadow transition-all">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <h6 className="fw-bold mb-1">{order.restaurantName}</h6>
                                                            <small className="text-muted mb-2 d-block">
                                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                                {order.deliveryAddress}
                                                            </small>
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="badge bg-success fs-6 mb-1">
                                                                +{order.deliveryFee} ETB
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">Fee</small>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded mb-3">
                                                        <small className="text-muted">Order Total:</small>
                                                        <strong>{order.total?.toFixed(2)} ETB</strong>
                                                    </div>

                                                    <button
                                                        className="btn btn-outline-primary w-100"
                                                        onClick={() => handleAcceptDelivery(order)}
                                                    >
                                                        Accept Delivery
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Dashboard;

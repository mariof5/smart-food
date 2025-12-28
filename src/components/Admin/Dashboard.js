import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { disputeService, refundService } from '../../services/databaseService';
import { demoService } from '../../services/demoService';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [activeView, setActiveView] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        pendingDisputes: 0,
        pendingRefunds: 0
    });

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            // In a real app, you'd load all disputes and refunds
            setDisputes([]);
            setRefunds([]);

            toast.info('Admin dashboard loaded');
        } catch (error) {
            console.error('Error loading admin data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDemoData = async () => {
        if (!window.confirm('Create sample restaurant and menu items?')) return;

        toast.info('Generating demo data...');
        const result = await demoService.createDemoData(currentUser.uid);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error('Failed to generate data: ' + result.error);
        }
    };

    const handleResolveDispute = async (disputeId, resolution) => {
        const result = await disputeService.resolve(disputeId, resolution, currentUser.uid);

        if (result.success) {
            toast.success('Dispute resolved successfully!');
            loadAdminData();
        } else {
            toast.error(result.error || 'Failed to resolve dispute');
        }
    };

    const handleProcessRefund = async (refundId, status) => {
        const result = await refundService.processRefund(refundId, status, currentUser.uid);

        if (result.success) {
            toast.success('Refund processed successfully!');
            loadAdminData();
        } else {
            toast.error(result.error || 'Failed to process refund');
        }
    };

    const handleSeedDatabase = async () => {
        if (!window.confirm('Seed database with top restaurants and menus?')) return;

        toast.info('Seeding database...');
        const { seedDatabase } = require('../../utils/seeder');
        const result = await seedDatabase();

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error('Failed to seed: ' + result.error);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            {/* Navigation */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container-fluid">
                    <span className="navbar-brand">
                        <i className="fas fa-user-shield me-2"></i>
                        Admin Dashboard
                    </span>

                    <div className="ms-auto">
                        <span className="text-white me-3">
                            <i className="fas fa-user me-2"></i>
                            {userData?.name}
                        </span>
                        <button className="btn btn-outline-light" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt me-2"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3 col-lg-2 bg-white border-end min-vh-100 p-0">
                        <div className="list-group list-group-flush">
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveView('overview')}
                            >
                                <i className="fas fa-chart-line me-2"></i>
                                Overview
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'disputes' ? 'active' : ''}`}
                                onClick={() => setActiveView('disputes')}
                            >
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                Disputes
                                {stats.pendingDisputes > 0 && (
                                    <span className="badge bg-danger ms-2">{stats.pendingDisputes}</span>
                                )}
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'refunds' ? 'active' : ''}`}
                                onClick={() => setActiveView('refunds')}
                            >
                                <i className="fas fa-undo me-2"></i>
                                Refunds
                                {stats.pendingRefunds > 0 && (
                                    <span className="badge bg-warning ms-2">{stats.pendingRefunds}</span>
                                )}
                            </button>
                            <div className="mt-4 px-3">
                                <hr />
                                <p className="text-muted small mb-2">Dev Tools</p>
                                <button
                                    className="btn btn-outline-primary w-100 btn-sm"
                                    onClick={handleGenerateDemoData}
                                >
                                    <i className="fas fa-database me-2"></i>
                                    Generate Demo Data
                                </button>
                                <button
                                    className="btn btn-outline-success w-100 btn-sm mt-2"
                                    onClick={handleSeedDatabase}
                                >
                                    <i className="fas fa-seedling me-2"></i>
                                    Seed Top Restaurants
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9 col-lg-10 p-4">
                        {/* Overview */}
                        {activeView === 'overview' && (
                            <div>
                                <h2 className="mb-4">System Overview</h2>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="card border-primary">
                                            <div className="card-body text-center">
                                                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                                                <h3 className="mb-0">{stats.totalUsers}</h3>
                                                <small className="text-muted">Total Users</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="card border-success">
                                            <div className="card-body text-center">
                                                <i className="fas fa-shopping-bag fa-2x text-success mb-2"></i>
                                                <h3 className="mb-0">{stats.totalOrders}</h3>
                                                <small className="text-muted">Total Orders</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="card border-danger">
                                            <div className="card-body text-center">
                                                <i className="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                                                <h3 className="mb-0">{stats.pendingDisputes}</h3>
                                                <small className="text-muted">Pending Disputes</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="card border-warning">
                                            <div className="card-body text-center">
                                                <i className="fas fa-undo fa-2x text-warning mb-2"></i>
                                                <h3 className="mb-0">{stats.pendingRefunds}</h3>
                                                <small className="text-muted">Pending Refunds</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Welcome to the Admin Dashboard. Monitor system activity, manage disputes, and process refunds.
                                </div>
                            </div>
                        )}

                        {/* Disputes Management */}
                        {activeView === 'disputes' && (
                            <div>
                                <h2 className="mb-4">Dispute Management</h2>

                                {disputes.length === 0 ? (
                                    <div className="alert alert-success">
                                        <i className="fas fa-check-circle me-2"></i>
                                        No pending disputes. Great job!
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {disputes.map((dispute) => (
                                            <div key={dispute.id} className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <div className="d-flex justify-content-between">
                                                            <span>
                                                                <strong>Dispute #{dispute.disputeId}</strong>
                                                                <span className="badge bg-warning ms-2">{dispute.type}</span>
                                                            </span>
                                                            <small className="text-muted">
                                                                {dispute.createdAt?.toDate?.()?.toLocaleString()}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="card-body">
                                                        <p><strong>Description:</strong> {dispute.description}</p>
                                                        <p><strong>Order ID:</strong> {dispute.orderId}</p>

                                                        {dispute.status === 'open' && (
                                                            <div className="mt-3">
                                                                <button
                                                                    className="btn btn-success me-2"
                                                                    onClick={() => handleResolveDispute(dispute.id, 'Resolved in favor of customer')}
                                                                >
                                                                    Resolve - Favor Customer
                                                                </button>
                                                                <button
                                                                    className="btn btn-secondary"
                                                                    onClick={() => handleResolveDispute(dispute.id, 'Resolved - No action needed')}
                                                                >
                                                                    Resolve - No Action
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Refunds Management */}
                        {activeView === 'refunds' && (
                            <div>
                                <h2 className="mb-4">Refund Management</h2>

                                {refunds.length === 0 ? (
                                    <div className="alert alert-success">
                                        <i className="fas fa-check-circle me-2"></i>
                                        No pending refunds to process.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Refund ID</th>
                                                    <th>Order ID</th>
                                                    <th>Amount</th>
                                                    <th>Reason</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {refunds.map((refund) => (
                                                    <tr key={refund.id}>
                                                        <td>{refund.refundId}</td>
                                                        <td>{refund.orderId}</td>
                                                        <td>${refund.amount?.toFixed(2)}</td>
                                                        <td>{refund.reason}</td>
                                                        <td>
                                                            <span className={`badge bg-${refund.status === 'approved' ? 'success' :
                                                                refund.status === 'rejected' ? 'danger' :
                                                                    'warning'
                                                                }`}>
                                                                {refund.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {refund.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        className="btn btn-sm btn-success me-2"
                                                                        onClick={() => handleProcessRefund(refund.id, 'approved')}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => handleProcessRefund(refund.id, 'rejected')}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

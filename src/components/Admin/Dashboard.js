import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { disputeService, refundService, adminService } from '../../services/databaseService';
import { demoService } from '../../services/demoService';
import { toast } from 'react-toastify';
import AnalyticsDashboard from './AnalyticsDashboard';
import ThemeToggle from '../UI/ThemeToggle';

const Dashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeView, setActiveView] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        pendingDisputes: 0,
        pendingRefunds: 0,
        totalRevenue: 0,
        activeRestaurants: 0,
        popularItems: [],
        usersByRole: { customers: 0, restaurants: 0, delivery: 0, admin: 0 }
    });

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            // Load all admin data
            const [allUsers, allOrders, platformStats] = await Promise.all([
                adminService.getAllUsers(),
                adminService.getAllOrders(),
                adminService.getPlatformAnalytics()
            ]);

            setUsers(allUsers.filter(user => !user.isDeleted));
            setOrders(allOrders);
            setStats(platformStats);

            // In a real app, you'd load all disputes and refunds
            setDisputes([]);
            setRefunds([]);

            toast.success('Admin dashboard loaded successfully');
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
            loadAdminData(); // Refresh data
        } else {
            toast.error('Failed to generate data: ' + result.error);
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        const newStatus = !currentStatus;
        const result = await adminService.updateUserStatus(userId, newStatus);

        if (result.success) {
            toast.success(`User ${newStatus ? 'activated' : 'suspended'} successfully`);
            loadAdminData();
        } else {
            toast.error(result.error || 'Failed to update user status');
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            return;
        }

        const result = await adminService.deleteUser(userId);

        if (result.success) {
            toast.success('User deleted successfully');
            loadAdminData();
        } else {
            toast.error(result.error || 'Failed to delete user');
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
            loadAdminData(); // Refresh data
        } else {
            toast.error('Failed to seed: ' + result.error);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0
        }).format(amount);
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

                    <div className="ms-auto d-flex align-items-center gap-3">
                        <ThemeToggle size="sm" />
                        <span className="text-white">
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
                                className={`list-group-item list-group-item-action ${activeView === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveView('users')}
                            >
                                <i className="fas fa-users me-2"></i>
                                Manage Users
                                <span className="badge bg-primary ms-2">{stats.totalUsers}</span>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveView('analytics')}
                            >
                                <i className="fas fa-chart-bar me-2"></i>
                                Analytics
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveView('orders')}
                            >
                                <i className="fas fa-shopping-bag me-2"></i>
                                All Orders
                                <span className="badge bg-success ms-2">{stats.totalOrders}</span>
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
                                        <div className="card border-info">
                                            <div className="card-body text-center">
                                                <i className="fas fa-dollar-sign fa-2x text-info mb-2"></i>
                                                <h3 className="mb-0">{formatCurrency(stats.totalRevenue)}</h3>
                                                <small className="text-muted">Total Revenue</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="card border-warning">
                                            <div className="card-body text-center">
                                                <i className="fas fa-store fa-2x text-warning mb-2"></i>
                                                <h3 className="mb-0">{stats.activeRestaurants}</h3>
                                                <small className="text-muted">Active Restaurants</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* User Distribution */}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="mb-0">User Distribution</h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row text-center">
                                                    <div className="col-6 mb-3">
                                                        <div className="text-primary">
                                                            <i className="fas fa-user fa-2x mb-2"></i>
                                                            <h4>{stats.usersByRole.customers}</h4>
                                                            <small>Customers</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6 mb-3">
                                                        <div className="text-success">
                                                            <i className="fas fa-utensils fa-2x mb-2"></i>
                                                            <h4>{stats.usersByRole.restaurants}</h4>
                                                            <small>Restaurants</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="text-warning">
                                                            <i className="fas fa-motorcycle fa-2x mb-2"></i>
                                                            <h4>{stats.usersByRole.delivery}</h4>
                                                            <small>Delivery</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="text-danger">
                                                            <i className="fas fa-user-shield fa-2x mb-2"></i>
                                                            <h4>{stats.usersByRole.admin}</h4>
                                                            <small>Admins</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="mb-0">Popular Items</h5>
                                            </div>
                                            <div className="card-body">
                                                {stats.popularItems.length > 0 ? (
                                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {stats.popularItems.slice(0, 5).map((item, index) => (
                                                            <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                                                <span className="fw-bold">{item.item}</span>
                                                                <span className="badge bg-primary">{item.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-muted">No order data available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Welcome to the Admin Dashboard. Monitor system activity, manage users, and track platform performance.
                                </div>
                            </div>
                        )}

                        {/* User Management */}
                        {activeView === 'users' && (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h2>Manage Users</h2>
                                    <div className="d-flex gap-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ width: '200px' }}
                                        />
                                        <select
                                            className="form-select"
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            style={{ width: '150px' }}
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="customer">Customers</option>
                                            <option value="restaurant">Restaurants</option>
                                            <option value="delivery">Delivery</option>
                                            <option value="admin">Admins</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Role</th>
                                                        <th>Status</th>
                                                        <th>Joined</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredUsers.map((user) => (
                                                        <tr key={user.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="avatar-circle me-2">
                                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                                    </div>
                                                                    <span className="fw-bold">{user.name || 'Unknown'}</span>
                                                                </div>
                                                            </td>
                                                            <td>{user.email}</td>
                                                            <td>
                                                                <span className={`badge bg-${
                                                                    user.role === 'admin' ? 'danger' :
                                                                    user.role === 'restaurant' ? 'success' :
                                                                    user.role === 'delivery' ? 'warning' : 'primary'
                                                                }`}>
                                                                    {user.role}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge bg-${user.isActive ? 'success' : 'secondary'}`}>
                                                                    {user.isActive ? 'Active' : 'Suspended'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                                            </td>
                                                            <td>
                                                                <div className="btn-group btn-group-sm">
                                                                    <button
                                                                        className={`btn btn-outline-${user.isActive ? 'warning' : 'success'}`}
                                                                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                                                        title={user.isActive ? 'Suspend User' : 'Activate User'}
                                                                    >
                                                                        <i className={`fas fa-${user.isActive ? 'pause' : 'play'}`}></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-outline-danger"
                                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                                        title="Delete User"
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {filteredUsers.length === 0 && (
                                            <div className="text-center py-4">
                                                <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                                <p className="text-muted">No users found matching your criteria</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Analytics */}
                        {activeView === 'analytics' && (
                            <AnalyticsDashboard />
                        )}

                        {/* All Orders */}
                        {activeView === 'orders' && (
                            <div>
                                <h2 className="mb-4">All Orders</h2>

                                <div className="card">
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Order #</th>
                                                        <th>Customer</th>
                                                        <th>Restaurant</th>
                                                        <th>Total</th>
                                                        <th>Status</th>
                                                        <th>Date</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.slice(0, 50).map((order) => (
                                                        <tr key={order.id}>
                                                            <td>
                                                                <span className="fw-bold">{order.orderNumber || order.id.slice(-6)}</span>
                                                            </td>
                                                            <td>{order.customerName || 'Unknown'}</td>
                                                            <td>{order.restaurantName || 'Unknown'}</td>
                                                            <td>{formatCurrency(order.total || 0)}</td>
                                                            <td>
                                                                <span className={`badge bg-${
                                                                    order.status === 'delivered' ? 'success' :
                                                                    order.status === 'cancelled' ? 'danger' :
                                                                    order.status === 'preparing' ? 'warning' :
                                                                    order.status === 'ready' ? 'info' : 'primary'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm"
                                                                    title="View Details"
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {orders.length === 0 && (
                                            <div className="text-center py-4">
                                                <i className="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
                                                <p className="text-muted">No orders found</p>
                                            </div>
                                        )}

                                        {orders.length > 50 && (
                                            <div className="text-center mt-3">
                                                <small className="text-muted">Showing first 50 orders</small>
                                            </div>
                                        )}
                                    </div>
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
                                                        <td>{formatCurrency(refund.amount)}</td>
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
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Import admin components
import UserManagement from './UserManagement';
import RestaurantManagement from './RestaurantManagement';
import OrderManagement from './OrderManagement';
import DisputeManagement from './DisputeManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SystemSettings from './SystemSettings';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    pendingDisputes: 0,
    pendingRefunds: 0,
    newUsersToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Set up real-time listeners for dashboard stats
      const unsubscribers = [];

      // Users count
      const usersQuery = query(collection(db, 'users'));
      unsubscribers.push(onSnapshot(usersQuery, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const today = new Date().toDateString();
        const newUsersToday = users.filter(user =>
          user.createdAt?.toDate?.()?.toDateString() === today
        ).length;

        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          newUsersToday
        }));
      }));

      // Restaurants count
      const restaurantsQuery = query(collection(db, 'restaurants'));
      unsubscribers.push(onSnapshot(restaurantsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          totalRestaurants: snapshot.docs.length
        }));
      }));

      // Orders stats
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsubscribers.push(onSnapshot(ordersQuery, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const activeOrders = orders.filter(order =>
          !['delivered', 'cancelled'].includes(order.status)
        ).length;

        setStats(prev => ({
          ...prev,
          totalOrders: orders.length,
          totalRevenue,
          activeOrders
        }));

        // Set recent activity
        setRecentActivity(orders.slice(0, 10));
      }));

      // Disputes count
      const disputesQuery = query(
        collection(db, 'disputes'),
        where('status', '==', 'open')
      );
      unsubscribers.push(onSnapshot(disputesQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingDisputes: snapshot.docs.length
        }));
      }));

      // Refunds count
      const refundsQuery = query(
        collection(db, 'refunds'),
        where('status', '==', 'pending')
      );
      unsubscribers.push(onSnapshot(refundsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingRefunds: snapshot.docs.length
        }));
      }));

      setLoading(false);

      // Cleanup function
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getActivityIcon = (type) => {
    const icons = {
      'order': 'shopping-bag',
      'user': 'user-plus',
      'restaurant': 'store',
      'dispute': 'exclamation-triangle',
      'refund': 'undo'
    };
    return icons[type] || 'circle';
  };

  const getActivityColor = (type) => {
    const colors = {
      'order': 'primary',
      'user': 'success',
      'restaurant': 'info',
      'dispute': 'warning',
      'refund': 'danger'
    };
    return colors[type] || 'secondary';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header bg-dark text-white">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center py-3">
            <div>
              <h3 className="mb-0">
                <i className="fas fa-cog me-2"></i>
                Admin Dashboard
              </h3>
              <small className="text-light">Food Express Management System</small>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="fw-bold">{currentUser?.displayName || 'Admin'}</div>
                <small className="text-light">System Administrator</small>
              </div>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex">
        {/* Sidebar */}
        <div className="admin-sidebar bg-light" style={{ width: '250px', minHeight: 'calc(100vh - 80px)' }}>
          <div className="p-3">
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveView('overview')}
                >
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Overview
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveView('users')}
                >
                  <i className="fas fa-users me-2"></i>
                  User Management
                  {stats.newUsersToday > 0 && (
                    <span className="badge bg-success ms-2">{stats.newUsersToday}</span>
                  )}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'restaurants' ? 'active' : ''}`}
                  onClick={() => setActiveView('restaurants')}
                >
                  <i className="fas fa-store me-2"></i>
                  Restaurants
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveView('orders')}
                >
                  <i className="fas fa-shopping-bag me-2"></i>
                  Orders
                  {stats.activeOrders > 0 && (
                    <span className="badge bg-primary ms-2">{stats.activeOrders}</span>
                  )}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'disputes' ? 'active' : ''}`}
                  onClick={() => setActiveView('disputes')}
                >
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Disputes & Refunds
                  {(stats.pendingDisputes + stats.pendingRefunds) > 0 && (
                    <span className="badge bg-warning ms-2">
                      {stats.pendingDisputes + stats.pendingRefunds}
                    </span>
                  )}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveView('analytics')}
                >
                  <i className="fas fa-chart-line me-2"></i>
                  Analytics
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`nav-link w-100 text-start ${activeView === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveView('settings')}
                >
                  <i className="fas fa-cog me-2"></i>
                  System Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4">
          {activeView === 'overview' && (
            <div>
              {/* Stats Cards */}
              <div className="row mb-4">
                <div className="col-lg-3 col-md-6 mb-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h4 className="mb-0">{stats.totalUsers.toLocaleString()}</h4>
                          <p className="mb-0">Total Users</p>
                          {stats.newUsersToday > 0 && (
                            <small>+{stats.newUsersToday} today</small>
                          )}
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-users fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-3">
                  <div className="card bg-success text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h4 className="mb-0">{stats.totalRestaurants.toLocaleString()}</h4>
                          <p className="mb-0">Restaurants</p>
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-store fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-3">
                  <div className="card bg-info text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h4 className="mb-0">{stats.totalOrders.toLocaleString()}</h4>
                          <p className="mb-0">Total Orders</p>
                          {stats.activeOrders > 0 && (
                            <small>{stats.activeOrders} active</small>
                          )}
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-shopping-bag fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-3 col-md-6 mb-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h4 className="mb-0">{formatCurrency(stats.totalRevenue)}</h4>
                          <p className="mb-0">Total Revenue</p>
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-dollar-sign fa-2x"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-exclamation-circle me-2 text-warning"></i>
                        Action Required
                      </h5>
                    </div>
                    <div className="card-body">
                      {stats.pendingDisputes > 0 && (
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Pending Disputes</span>
                          <span className="badge bg-warning">{stats.pendingDisputes}</span>
                        </div>
                      )}
                      {stats.pendingRefunds > 0 && (
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span>Pending Refunds</span>
                          <span className="badge bg-danger">{stats.pendingRefunds}</span>
                        </div>
                      )}
                      {stats.pendingDisputes === 0 && stats.pendingRefunds === 0 && (
                        <p className="text-muted mb-0">
                          <i className="fas fa-check-circle text-success me-2"></i>
                          All caught up! No pending actions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-clock me-2 text-info"></i>
                        Recent Activity
                      </h5>
                    </div>
                    <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {recentActivity.length === 0 ? (
                        <p className="text-muted mb-0">No recent activity</p>
                      ) : (
                        recentActivity.slice(0, 5).map((activity, index) => (
                          <div key={index} className="d-flex align-items-center mb-3">
                            <div className={`me-3 text-${getActivityColor('order')}`}>
                              <i className={`fas fa-${getActivityIcon('order')}`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-bold">Order {activity.orderNumber}</div>
                              <small className="text-muted">
                                {formatTimestamp(activity.createdAt)} • {formatCurrency(activity.total)}
                              </small>
                            </div>
                            <span className={`badge bg-${activity.status === 'delivered' ? 'success' : 'primary'}`}>
                              {activity.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'users' && <UserManagement />}
          {activeView === 'restaurants' && <RestaurantManagement />}
          {activeView === 'orders' && <OrderManagement />}
          {activeView === 'disputes' && <DisputeManagement />}
          {activeView === 'analytics' && <AnalyticsDashboard />}
          {activeView === 'settings' && <SystemSettings />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
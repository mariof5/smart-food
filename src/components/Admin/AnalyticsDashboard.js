import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      customerRetentionRate: 0,
      restaurantGrowthRate: 0,
      deliverySuccessRate: 0
    },
    trends: {
      dailyOrders: [],
      weeklyRevenue: [],
      monthlyGrowth: [],
      popularCategories: [],
      peakHours: []
    },
    restaurants: {
      topPerforming: [],
      underPerforming: [],
      newRestaurants: [],
      restaurantRatings: []
    },
    customers: {
      newCustomers: [],
      returningCustomers: [],
      customerLifetimeValue: [],
      geographicDistribution: []
    },
    delivery: {
      averageDeliveryTime: 0,
      deliverySuccessRate: 0,
      topDeliveryPersonnel: [],
      deliveryHeatmap: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '24hours':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      // Load data from Firestore
      const [orders, restaurants, users] = await Promise.all([
        getDocs(query(
          collection(db, 'orders'),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc')
        )),
        getDocs(collection(db, 'restaurants')),
        getDocs(collection(db, 'users'))
      ]);

      const ordersData = orders.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const restaurantsData = restaurants.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usersData = users.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate analytics
      const calculatedAnalytics = calculateAnalytics(ordersData, restaurantsData, usersData, startDate, endDate);
      setAnalytics(calculatedAnalytics);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (orders, restaurants, users, startDate, endDate) => {
    // Overview calculations
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const deliverySuccessRate = totalOrders > 0 ? (deliveredOrders.length / totalOrders) * 100 : 0;

    // Daily orders trend
    const dailyOrders = [];
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });

      dailyOrders.push({
        date: date.toLocaleDateString(),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      });
    }

    // Popular categories
    const categoryCount = {};
    const itemCount = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        // Count categories
        const category = item.category || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
        
        // Count individual items
        const itemKey = `${item.name} (${order.restaurantName || 'Unknown'})`;
        itemCount[itemKey] = (itemCount[itemKey] || 0) + item.quantity;
      });
    });

    const popularCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const popularItems = Object.entries(itemCount)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Peak hours analysis
    const hourlyOrders = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = (order.createdAt?.toDate?.() || new Date(order.createdAt)).getHours();
      hourlyOrders[hour]++;
    });

    const peakHours = hourlyOrders
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Restaurant performance
    const restaurantStats = {};
    orders.forEach(order => {
      const restaurantId = order.restaurantId;
      if (!restaurantStats[restaurantId]) {
        restaurantStats[restaurantId] = {
          orders: 0,
          revenue: 0,
          avgRating: 0,
          deliveryTime: 0
        };
      }
      restaurantStats[restaurantId].orders++;
      restaurantStats[restaurantId].revenue += order.total || 0;
    });

    const topPerforming = Object.entries(restaurantStats)
      .map(([id, stats]) => {
        const restaurant = restaurants.find(r => r.id === id);
        return {
          id,
          name: restaurant?.name || 'Unknown',
          ...stats,
          avgOrderValue: stats.orders > 0 ? stats.revenue / stats.orders : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Customer analysis
    const customerOrders = {};
    orders.forEach(order => {
      const customerId = order.customerId;
      if (!customerOrders[customerId]) {
        customerOrders[customerId] = [];
      }
      customerOrders[customerId].push(order);
    });

    const returningCustomers = Object.values(customerOrders).filter(orders => orders.length > 1).length;
    const totalCustomers = Object.keys(customerOrders).length;
    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    return {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        customerRetentionRate,
        restaurantGrowthRate: 15.5, // Placeholder
        deliverySuccessRate
      },
      trends: {
        dailyOrders,
        weeklyRevenue: dailyOrders, // Simplified
        monthlyGrowth: [], // Placeholder
        popularCategories,
        popularItems,
        peakHours
      },
      restaurants: {
        topPerforming,
        underPerforming: topPerforming.slice(-5).reverse(),
        newRestaurants: restaurants.slice(-5),
        restaurantRatings: restaurants.map(r => ({ name: r.name, rating: r.rating || 0 }))
      },
      customers: {
        newCustomers: users.filter(u => u.role === 'customer').slice(-10),
        returningCustomers: [],
        customerLifetimeValue: [],
        geographicDistribution: []
      },
      delivery: {
        averageDeliveryTime: 32, // Placeholder
        deliverySuccessRate,
        topDeliveryPersonnel: [],
        deliveryHeatmap: []
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-chart-line me-2 text-primary"></i>
          Analytics Dashboard
        </h2>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <button className="btn btn-outline-primary" onClick={loadAnalytics}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="row mb-4">
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-dollar-sign fa-2x text-success mb-2"></i>
              <h4 className="text-success">{formatCurrency(analytics.overview.totalRevenue)}</h4>
              <p className="text-muted mb-0">Revenue</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-shopping-bag fa-2x text-primary mb-2"></i>
              <h4 className="text-primary">{analytics.overview.totalOrders.toLocaleString()}</h4>
              <p className="text-muted mb-0">Orders</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-chart-line fa-2x text-info mb-2"></i>
              <h4 className="text-info">{formatCurrency(analytics.overview.averageOrderValue)}</h4>
              <p className="text-muted mb-0">Avg Order</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-users fa-2x text-warning mb-2"></i>
              <h4 className="text-warning">{formatPercentage(analytics.overview.customerRetentionRate)}</h4>
              <p className="text-muted mb-0">Retention</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-motorcycle fa-2x text-success mb-2"></i>
              <h4 className="text-success">{formatPercentage(analytics.overview.deliverySuccessRate)}</h4>
              <p className="text-muted mb-0">Delivery Rate</p>
            </div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="fas fa-store fa-2x text-info mb-2"></i>
              <h4 className="text-info">{formatPercentage(analytics.overview.restaurantGrowthRate)}</h4>
              <p className="text-muted mb-0">Growth Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        {/* Daily Orders Chart */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Daily Orders Trend
              </h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '300px' }}>
                {analytics.trends.dailyOrders.map((day, index) => (
                  <div key={index} className="chart-bar-wrapper">
                    <div
                      className="chart-bar bg-primary"
                      style={{
                        height: `${(day.orders / Math.max(...analytics.trends.dailyOrders.map(d => d.orders))) * 250}px`,
                        minHeight: '20px'
                      }}
                    >
                      <span className="chart-value">{day.orders}</span>
                    </div>
                    <div className="chart-label">{day.date.split('/').slice(0, 2).join('/')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Popular Categories
              </h5>
            </div>
            <div className="card-body">
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {analytics.trends.popularCategories.map((category, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center">
                      <div
                        className="category-color-indicator me-3"
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: `hsl(${index * 45}, 70%, 50%)`,
                          borderRadius: '50%'
                        }}
                      ></div>
                      <span className="fw-bold">{category.category}</span>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">{category.count}</div>
                      <small className="text-muted">orders</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Items Row */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-star me-2"></i>
                Popular Items
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {analytics.trends.popularItems && analytics.trends.popularItems.length > 0 ? (
                  analytics.trends.popularItems.slice(0, 8).map((item, index) => (
                    <div key={index} className="col-md-3 col-sm-6 mb-3">
                      <div className="card border-0 bg-light">
                        <div className="card-body text-center p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className={`badge bg-${index < 3 ? 'warning' : 'secondary'}`}>
                              #{index + 1}
                            </span>
                            <span className="badge bg-primary">{item.count}</span>
                          </div>
                          <h6 className="card-title mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                            {item.item}
                          </h6>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-4">
                    <i className="fas fa-utensils fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No item data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Performance */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-trophy me-2"></i>
                Top Performing Restaurants
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Restaurant</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.restaurants.topPerforming.map((restaurant, index) => (
                      <tr key={restaurant.id}>
                        <td>
                          <span className={`badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold">{restaurant.name}</div>
                        </td>
                        <td>{restaurant.orders}</td>
                        <td>{formatCurrency(restaurant.revenue)}</td>
                        <td>{formatCurrency(restaurant.avgOrderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Peak Hours
              </h5>
            </div>
            <div className="card-body">
              {analytics.trends.peakHours.map((peak, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="fw-bold">
                      {peak.hour}:00 - {peak.hour + 1}:00
                    </span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div
                      className="progress me-3"
                      style={{ width: '100px', height: '10px' }}
                    >
                      <div
                        className="progress-bar bg-primary"
                        style={{
                          width: `${(peak.count / Math.max(...analytics.trends.peakHours.map(p => p.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="badge bg-primary">{peak.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="fas fa-chart-area me-2"></i>
                  Detailed Analytics
                </h5>
                <div className="btn-group" role="group">
                  <button
                    className={`btn ${selectedMetric === 'revenue' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                    onClick={() => setSelectedMetric('revenue')}
                  >
                    Revenue
                  </button>
                  <button
                    className={`btn ${selectedMetric === 'orders' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                    onClick={() => setSelectedMetric('orders')}
                  >
                    Orders
                  </button>
                  <button
                    className={`btn ${selectedMetric === 'customers' ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
                    onClick={() => setSelectedMetric('customers')}
                  >
                    Customers
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Metric-specific content */}
              {selectedMetric === 'revenue' && (
                <div className="row">
                  <div className="col-md-8">
                    <h6>Revenue Trend</h6>
                    <div className="chart-container" style={{ height: '250px' }}>
                      {analytics.trends.dailyOrders.map((day, index) => (
                        <div key={index} className="chart-bar-wrapper">
                          <div
                            className="chart-bar bg-success"
                            style={{
                              height: `${(day.revenue / Math.max(...analytics.trends.dailyOrders.map(d => d.revenue))) * 200}px`,
                              minHeight: '10px'
                            }}
                          >
                            <span className="chart-value">{formatCurrency(day.revenue)}</span>
                          </div>
                          <div className="chart-label">{day.date.split('/').slice(0, 2).join('/')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <h6>Revenue Insights</h6>
                    <div className="list-group list-group-flush">
                      <div className="list-group-item d-flex justify-content-between">
                        <span>Highest Day</span>
                        <strong>{formatCurrency(Math.max(...analytics.trends.dailyOrders.map(d => d.revenue)))}</strong>
                      </div>
                      <div className="list-group-item d-flex justify-content-between">
                        <span>Average Daily</span>
                        <strong>{formatCurrency(analytics.overview.totalRevenue / analytics.trends.dailyOrders.length)}</strong>
                      </div>
                      <div className="list-group-item d-flex justify-content-between">
                        <span>Growth Rate</span>
                        <strong className="text-success">+{formatPercentage(analytics.overview.restaurantGrowthRate)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'orders' && (
                <div className="row">
                  <div className="col-md-8">
                    <h6>Order Volume Trend</h6>
                    <div className="chart-container" style={{ height: '250px' }}>
                      {analytics.trends.dailyOrders.map((day, index) => (
                        <div key={index} className="chart-bar-wrapper">
                          <div
                            className="chart-bar bg-info"
                            style={{
                              height: `${(day.orders / Math.max(...analytics.trends.dailyOrders.map(d => d.orders))) * 200}px`,
                              minHeight: '10px'
                            }}
                          >
                            <span className="chart-value">{day.orders}</span>
                          </div>
                          <div className="chart-label">{day.date.split('/').slice(0, 2).join('/')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <h6>Order Insights</h6>
                    <div className="list-group list-group-flush">
                      <div className="list-group-item d-flex justify-content-between">
                        <span>Peak Day</span>
                        <strong>{Math.max(...analytics.trends.dailyOrders.map(d => d.orders))} orders</strong>
                      </div>
                      <div className="list-group-item d-flex justify-content-between">
                        <span>Average Daily</span>
                        <strong>{Math.round(analytics.overview.totalOrders / analytics.trends.dailyOrders.length)} orders</strong>
                      </div>
                      <div className="list-group-item d-flex justify-content-between">
                        <span>Success Rate</span>
                        <strong className="text-success">{formatPercentage(analytics.overview.deliverySuccessRate)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'customers' && (
                <div className="row">
                  <div className="col-md-6">
                    <h6>Customer Retention</h6>
                    <div className="progress mb-3" style={{ height: '30px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${analytics.overview.customerRetentionRate}%` }}
                      >
                        {formatPercentage(analytics.overview.customerRetentionRate)}
                      </div>
                    </div>
                    <p className="text-muted">
                      {formatPercentage(analytics.overview.customerRetentionRate)} of customers place multiple orders
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>New Customers</h6>
                    <div className="list-group list-group-flush">
                      {analytics.customers.newCustomers.slice(0, 5).map((customer, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between">
                          <span>{customer.name}</span>
                          <small className="text-muted">
                            {customer.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
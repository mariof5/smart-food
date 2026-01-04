import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { restaurantService, menuService, orderService, analyticsService, storageService } from '../../services/databaseService';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeView, setActiveView] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({});
    const [profileImage, setProfileImage] = useState(null);

    // Menu Item Form State
    const [editingItem, setEditingItem] = useState(null);
    const [menuForm, setMenuForm] = useState({
        name: '', description: '', price: '', category: '', image: ''
    });
    const [menuImage, setMenuImage] = useState(null);
    const [showOtherCategory, setShowOtherCategory] = useState(false);

    const MENU_CATEGORIES = ['Fast Food', 'Ethiopian', 'Italian', 'Drinks', 'Other'];

    // Cancellation State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        if (currentUser?.uid) {
            loadRestaurantData();
            const unsubscribe = orderService.listenToOrders(currentUser.uid, (newOrders) => {
                setOrders(newOrders);
            });
            return () => unsubscribe();
        }
    }, [currentUser?.uid]);

    const loadRestaurantData = async () => {
        setLoading(true);
        try {
            const restaurantData = await restaurantService.getById(currentUser.uid);
            setRestaurant(restaurantData);
            setProfileForm(restaurantData || {});

            const items = await menuService.getByRestaurant(currentUser.uid);
            setMenuItems(items);

            const orderData = await orderService.getByRestaurant(currentUser.uid);
            setOrders(orderData);

            const analytics = await analyticsService.getRestaurantStats(currentUser.uid);
            setStats(analytics);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file, path) => {
        if (!file) return null;
        setUploading(true);
        try {
            const result = await storageService.uploadImage(file, path);
            if (result.success) return result.url;
            throw new Error(result.error);
        } catch (error) {
            toast.error('Image upload failed');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        let imageUrl = profileForm.image;

        if (profileImage) {
            imageUrl = await handleImageUpload(profileImage, `restaurants/${currentUser.uid}/profile`);
            if (!imageUrl) return;
        }

        const result = await restaurantService.update(currentUser.uid, {
            ...profileForm,
            image: imageUrl
        });

        if (result.success) {
            toast.success('Profile updated!');
            setIsEditingProfile(false);
            loadRestaurantData();
        } else {
            toast.error('Failed to update profile');
        }
    };

    const handleSaveMenuItem = async (e) => {
        e.preventDefault();
        let imageUrl = menuForm.image;

        if (menuImage) {
            imageUrl = await handleImageUpload(menuImage, `restaurants/${currentUser.uid}/menu/${Date.now()}`);
            if (!imageUrl) return;
        }

        const itemData = {
            ...menuForm,
            price: parseFloat(menuForm.price),
            image: imageUrl
        };

        let result;
        if (editingItem) {
            result = await menuService.update(editingItem.id, itemData);
        } else {
            result = await menuService.add(currentUser.uid, itemData);
        }

        if (result.success) {
            toast.success(`Menu item ${editingItem ? 'updated' : 'added'}!`);
            setMenuForm({ name: '', description: '', price: '', category: '', image: '' });
            setMenuImage(null);
            setEditingItem(null);
            loadRestaurantData();
            // Switch to list view if strictly managing
            // setActiveView('menu'); 
        } else {
            toast.error('Failed to save menu item');
        }
    };

    const handleEditMenuItem = (item) => {
        setEditingItem(item);
        setMenuForm(item);
        // Check if the current category is one of the defaults
        if (!MENU_CATEGORIES.includes(item.category) && item.category !== '') {
            setShowOtherCategory(true);
        } else {
            setShowOtherCategory(false);
        }
        window.scrollTo(0, 0); // Scroll to form
    };

    const handleDeleteMenuItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        const result = await menuService.delete(id);
        if (result.success) {
            toast.success('Item deleted');
            loadRestaurantData();
        } else {
            toast.error('Failed to delete item');
        }
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setMenuForm({ name: '', description: '', price: '', category: '', image: '' });
        setMenuImage(null);
        setShowOtherCategory(false);
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value === 'Other') {
            setShowOtherCategory(true);
            setMenuForm({ ...menuForm, category: '' });
        } else {
            setShowOtherCategory(false);
            setMenuForm({ ...menuForm, category: value });
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        const result = await orderService.updateStatus(orderId, newStatus, currentUser.uid);
        if (result.success) toast.success(`Order status updated to ${newStatus}!`);
        else toast.error('Failed to update order');
    };

    const handleToggleStatus = async () => {
        const newStatus = !restaurant.isOpen;
        const result = await restaurantService.update(currentUser.uid, {
            isOpen: newStatus
        });

        if (result.success) {
            toast.success(`Store is now ${newStatus ? 'OPEN' : 'CLOSED'}`);
            loadRestaurantData();
        } else {
            toast.error('Failed to update status');
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder || !cancelReason) {
            toast.error('Please select a reason');
            return;
        }

        const result = await orderService.cancelOrder(
            selectedOrder.id,
            cancelReason,
            currentUser.uid
        );

        if (result.success) {
            toast.success('Order cancelled successfully');
            setShowCancelModal(false);
            setCancelReason('');
            setSelectedOrder(null);
        } else {
            toast.error(result.error || 'Failed to cancel order');
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light dashboard-layout">
            {/* Navigation */}
            <nav className="navbar navbar-smartfood navbar-expand-lg navbar-light sticky-top">
                <div className="container-fluid">
                    <Link className="navbar-brand-smartfood fw-bold ethiopia-flag text-decoration-none" to="/">
                        Food Express <small className="fs-6 text-muted ms-2">Restaurant</small>
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarRestaurant"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarRestaurant">
                        <div className="ms-auto d-flex align-items-center">
                            <div className="me-4 d-none d-lg-block">
                                <button
                                    className={`btn ${restaurant?.isOpen ? 'btn-success' : 'btn-danger'} shadow-sm p-2 px-3 rounded-pill transition-all`}
                                    onClick={handleToggleStatus}
                                >
                                    <i className={`fas fa-circle ms-1 me-2 small ${restaurant?.isOpen ? 'blink' : ''}`}></i>
                                    {restaurant?.isOpen ? 'Online & Accepting Orders' : 'Offline - Closed'}
                                </button>
                            </div>
                            <div className="dropdown me-3">
                                <a
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    href="#"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                >
                                    <div className="user-avatar me-2">
                                        <i className="fas fa-store-alt fa-lg text-primary"></i>
                                    </div>
                                    <span className="fw-semibold text-dark">{restaurant?.name || 'Restaurant'}</span>
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                    <li className="px-3 py-2">
                                        <div className="small text-muted text-uppercase mb-1">Owner</div>
                                        <div className="fw-bold text-dark">{userData?.name}</div>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item py-2" onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt me-2 text-danger"></i>
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container-fluid py-4">
                <div className="row g-4">
                    {/* Sidebar */}
                    <div className="col-md-3 col-lg-2">
                        <div className="card border-0 shadow-sm sticky-top" style={{ top: '100px', borderRadius: '20px' }}>
                            <div className="card-body p-2">
                                <div className="nav flex-column nav-pills custom-pills">
                                    <button
                                        className={`nav-link text-start mb-2 py-3 px-4 rounded-pill transition-all ${activeView === 'overview' ? 'active shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveView('overview')}
                                    >
                                        <i className="fas fa-chart-line me-3"></i>
                                        Overview
                                    </button>
                                    <button
                                        className={`nav-link text-start mb-2 py-3 px-4 rounded-pill transition-all ${activeView === 'orders' ? 'active shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveView('orders')}
                                    >
                                        <i className="fas fa-shopping-bag me-3"></i>
                                        Orders
                                        {orders.filter(o => o.status === 'placed').length > 0 && (
                                            <span className="badge bg-danger ms-auto rounded-pill shadow-sm">
                                                {orders.filter(o => o.status === 'placed').length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        className={`nav-link text-start py-3 px-4 rounded-pill transition-all ${activeView === 'menu' ? 'active shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveView('menu')}
                                    >
                                        <i className="fas fa-utensils me-3"></i>
                                        Menu
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9 col-lg-10 p-0 px-md-3">
                        {/* Overview */}
                        {activeView === 'overview' && (
                            <div className="fade-in">
                                <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm border-start border-4 border-success d-flex justify-content-between align-items-center">
                                    <div>
                                        <h2 className="section-title mb-1">Store Dashboard</h2>
                                        <p className="text-muted mb-0">Manage your restaurant performance and orders</p>
                                    </div>
                                    <button
                                        className="btn btn-outline-success rounded-pill px-4"
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    >
                                        <i className="fas fa-cog me-2"></i>
                                        {isEditingProfile ? 'Close Settings' : 'Store Settings'}
                                    </button>
                                </div>

                                {isEditingProfile && (
                                    <div className="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
                                        <div className="card-header bg-success text-white p-3">
                                            <h5 className="mb-0">Restaurant Profile</h5>
                                        </div>
                                        <div className="card-body p-4 text-dark">
                                            <form onSubmit={handleProfileUpdate}>
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold">Restaurant Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control rounded-3"
                                                            value={profileForm.name || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold">Cuisine Type</label>
                                                        <input
                                                            type="text"
                                                            className="form-control rounded-3"
                                                            value={profileForm.cuisine || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label fw-semibold">Description</label>
                                                        <textarea
                                                            className="form-control rounded-3"
                                                            rows="2"
                                                            value={profileForm.description || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label fw-semibold">Store Address</label>
                                                        <textarea
                                                            className="form-control rounded-3"
                                                            rows="2"
                                                            placeholder="e.g. Kality, Addis Ababa, Near Customs"
                                                            value={profileForm.address || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold">Delivery Time</label>
                                                        <input
                                                            type="text"
                                                            className="form-control rounded-3"
                                                            placeholder="e.g. 30-45 min"
                                                            value={profileForm.deliveryTime || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, deliveryTime: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold">Delivery Fee (ETB)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control rounded-3"
                                                            value={profileForm.deliveryFee || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, deliveryFee: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label fw-semibold">Image</label>
                                                        <input
                                                            type="file"
                                                            className="form-control rounded-3"
                                                            accept="image/*"
                                                            onChange={(e) => setProfileImage(e.target.files[0])}
                                                        />
                                                    </div>
                                                    <div className="col-12 pt-2">
                                                        <button type="submit" className="btn btn-success px-5 rounded-pill shadow-sm" disabled={uploading}>
                                                            {uploading ? (
                                                                <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                                                            ) : 'Save Store Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <div className="row g-4 mb-4">
                                    <div className="col-md-3">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                                            <div className="card-body text-center p-4">
                                                <div className="avatar-lg mx-auto mb-3">
                                                    {restaurant?.image ? (
                                                        <img src={restaurant.image} alt="Store" className="img-fluid rounded-circle shadow-sm" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px' }}>
                                                            <i className="fas fa-store fa-2x text-muted"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <h5 className="mb-0 fw-bold">{restaurant?.name}</h5>
                                                <span className="badge bg-light text-primary mt-2">{restaurant?.cuisine}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 border-bottom border-4 border-primary">
                                            <div className="card-body text-center p-4">
                                                <div className="feature-icon mb-2" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>
                                                    <i className="fas fa-shopping-bag"></i>
                                                </div>
                                                <h3 className="mb-0 fw-bold">{stats?.totalOrders || 0}</h3>
                                                <small className="text-muted text-uppercase fw-semibold">Orders</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 border-bottom border-4 border-success">
                                            <div className="card-body text-center p-4">
                                                <div className="feature-icon bg-success bg-opacity-10 text-success mb-2" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>
                                                    <i className="fas fa-money-bill-wave"></i>
                                                </div>
                                                <h3 className="mb-0 fw-bold">{stats?.totalRevenue?.toFixed(0) || '0'} <small className="fs-6">ETB</small></h3>
                                                <small className="text-muted text-uppercase fw-semibold">Revenue</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 border-bottom border-4 border-info">
                                            <div className="card-body text-center p-4">
                                                <div className="feature-icon bg-info bg-opacity-10 text-info mb-2" style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}>
                                                    <i className="fas fa-utensils"></i>
                                                </div>
                                                <h3 className="mb-0 fw-bold">{menuItems.length}</h3>
                                                <small className="text-muted text-uppercase fw-semibold">Items</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Orders Management */}
                        {activeView === 'orders' && (
                            <div>
                                <h2 className="mb-4">Order Management</h2>
                                {orders.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        No orders yet. Start by adding menu items!
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {orders.map((order) => (
                                            <div key={order.id} className="col-12">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h5>{order.orderNumber}</h5>
                                                                <p className="mb-1"><strong>Customer:</strong> {order.customerName || 'Customer'}</p>
                                                                <p className="mb-1"><strong>Address:</strong> {order.deliveryAddress}</p>
                                                                <p className="mb-1"><strong>Items:</strong></p>
                                                                <ul>
                                                                    {order.items?.map((item, idx) => (
                                                                        <li key={idx}>
                                                                            {item.name} x {item.quantity} - {(item.price * item.quantity).toFixed(2)} ETB
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <p className="mb-0"><strong>Total:</strong> {order.total?.toFixed(2)} ETB</p>
                                                            </div>
                                                            <div className="text-end">
                                                                <span className={`badge bg-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'} mb-2 d-block`}>
                                                                    {order.status.toUpperCase()}
                                                                </span>
                                                                {order.status === 'placed' && (
                                                                    <div className="d-flex flex-column gap-2 mt-2">
                                                                        <button className="btn btn-sm btn-success rounded-pill px-3" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                                                                            <i className="fas fa-check me-1"></i> Accept
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                                            onClick={() => {
                                                                                setSelectedOrder(order);
                                                                                setShowCancelModal(true);
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-times me-1"></i> Cancel
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {['preparing', 'confirmed'].includes(order.status) && (
                                                                    <button className="btn btn-sm btn-primary rounded-pill px-3 mt-2" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
                                                                        <i className="fas fa-box me-1"></i> Ready for Pickup
                                                                    </button>
                                                                )}
                                                                {order.status === 'cancelled' && order.cancellationReason && (
                                                                    <div className="small text-danger mt-2">
                                                                        <strong>Reason:</strong> {order.cancellationReason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Menu Management */}
                        {activeView === 'menu' && (
                            <div>
                                <h2 className="mb-4">Menu Management</h2>

                                {/* Add/Edit Item Form */}
                                <div className="card mb-4">
                                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h5>
                                        {editingItem && (
                                            <button className="btn btn-sm btn-outline-secondary" onClick={handleCancelEdit}>
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={handleSaveMenuItem}>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Item Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={menuForm.name}
                                                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label">Price (ETB)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control"
                                                        value={menuForm.price}
                                                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label">Category</label>
                                                    <select
                                                        className="form-select"
                                                        value={showOtherCategory ? 'Other' : (MENU_CATEGORIES.includes(menuForm.category) ? menuForm.category : 'Other')}
                                                        onChange={handleCategoryChange}
                                                        required
                                                    >
                                                        <option value="">Select Category...</option>
                                                        {MENU_CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {showOtherCategory && (
                                                    <div className="col-md-3">
                                                        <label className="form-label">Specify Category</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={menuForm.category}
                                                            onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                                                            placeholder="Enter category name"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                                <div className={showOtherCategory ? "col-12" : "col-12"}>
                                                    <label className="form-label">Description</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows="2"
                                                        value={menuForm.description}
                                                        onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">Item Image</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={(e) => setMenuImage(e.target.files[0])}
                                                    />
                                                    {menuForm.image && !menuImage && (
                                                        <div className="mt-2">
                                                            <small className="text-muted">Current image:</small>
                                                            <img src={menuForm.image} alt="Preview" className="d-block mt-1" style={{ height: '50px' }} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="col-12">
                                                    <button type="submit" className={`btn ${editingItem ? 'btn-primary' : 'btn-success'}`} disabled={uploading}>
                                                        <i className={`fas ${editingItem ? 'fa-save' : 'fa-plus'} me-2`}></i>
                                                        {uploading ? 'Processing...' : (editingItem ? 'Update Item' : 'Add Item')}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Current Menu Items */}
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="mb-0">Current Menu ({menuItems.length} items)</h5>
                                    </div>
                                    <div className="card-body">
                                        {menuItems.length === 0 ? (
                                            <p className="text-muted text-center">No menu items yet. Add your first item above!</p>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th>Image</th>
                                                            <th>Name</th>
                                                            <th>Category</th>
                                                            <th>Price</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {menuItems.map((item) => (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    {item.image ? (
                                                                        <img src={item.image} alt={item.name} className="rounded" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                                                            <i className="fas fa-utensils text-muted"></i>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="fw-bold">{item.name}</div>
                                                                    <small className="text-muted">{item.description}</small>
                                                                </td>
                                                                <td>{item.category && <span className="badge bg-secondary">{item.category}</span>}</td>
                                                                <td>{item.price?.toFixed(2)} ETB</td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary me-2"
                                                                        onClick={() => handleEditMenuItem(item)}
                                                                    >
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => handleDeleteMenuItem(item.id)}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cancellation Modal */}
            {showCancelModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Cancel Order {selectedOrder?.orderNumber}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCancelModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted">Please select a reason for cancelling this order. This will be shown to the customer.</p>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Cancellation Reason</label>
                                    <select
                                        className="form-select rounded-3"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                    >
                                        <option value="">Select a reason...</option>
                                        <option value="Item(s) Out of Stock">Item(s) Out of Stock</option>
                                        <option value="Store Too Busy / Overcapacity">Store Too Busy / Overcapacity</option>
                                        <option value="Delivery Issue / Driver Unavailable">Delivery Issue / Driver Unavailable</option>
                                        <option value="Inaccurate Price/Description">Inaccurate Price/Description</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowCancelModal(false)}>Close</button>
                                <button
                                    type="button"
                                    className="btn btn-danger rounded-pill px-4"
                                    onClick={handleCancelOrder}
                                    disabled={!cancelReason}
                                >
                                    Confirm Cancellation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

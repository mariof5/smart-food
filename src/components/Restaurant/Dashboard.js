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
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        const result = await orderService.updateStatus(orderId, newStatus, currentUser.uid);
        if (result.success) toast.success(`Order status updated to ${newStatus}!`);
        else toast.error('Failed to update order');
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
        <div className="min-vh-100 bg-light">
            {/* Navigation */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-success">
                <div className="container-fluid">
                    <span className="navbar-brand">
                        <i className="fas fa-store me-2"></i>
                        {restaurant?.name || 'Restaurant Dashboard'}
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
                                className={`list-group-item list-group-item-action ${activeView === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveView('orders')}
                            >
                                <i className="fas fa-shopping-bag me-2"></i>
                                Orders
                                {orders.filter(o => o.status === 'placed').length > 0 && (
                                    <span className="badge bg-danger ms-2">
                                        {orders.filter(o => o.status === 'placed').length}
                                    </span>
                                )}
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'menu' ? 'active' : ''}`}
                                onClick={() => setActiveView('menu')}
                            >
                                <i className="fas fa-utensils me-2"></i>
                                Menu Management
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9 col-lg-10 p-4">
                        {/* Overview */}
                        {activeView === 'overview' && (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h2 className="mb-0">Dashboard Overview</h2>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    >
                                        <i className="fas fa-edit me-2"></i>
                                        {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                                    </button>
                                </div>

                                {isEditingProfile && (
                                    <div className="card mb-4">
                                        <div className="card-header">
                                            <h5 className="mb-0">Edit Restaurant Profile</h5>
                                        </div>
                                        <div className="card-body">
                                            <form onSubmit={handleProfileUpdate}>
                                                <div className="row g-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label">Restaurant Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={profileForm.name || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label">Cuisine Type</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={profileForm.cuisine || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label">Description</label>
                                                        <textarea
                                                            className="form-control"
                                                            rows="2"
                                                            value={profileForm.description || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Delivery Time Estimate</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="e.g. 30-45 min"
                                                            value={profileForm.deliveryTime || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, deliveryTime: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Delivery Fee (ETB)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={profileForm.deliveryFee || ''}
                                                            onChange={(e) => setProfileForm({ ...profileForm, deliveryFee: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Profile Image</label>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            onChange={(e) => setProfileImage(e.target.files[0])}
                                                        />
                                                    </div>
                                                    <div className="col-12">
                                                        <button type="submit" className="btn btn-success" disabled={uploading}>
                                                            {uploading ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                        <div className="card h-100">
                                            <div className="card-body text-center">
                                                {restaurant?.image ? (
                                                    <img src={restaurant.image} alt="Restaurant" className="img-thumbnail mb-2" style={{ height: '80px', objectFit: 'cover' }} />
                                                ) : (
                                                    <i className="fas fa-store fa-4x text-muted mb-2"></i>
                                                )}
                                                <h5 className="mb-0">{restaurant?.name}</h5>
                                                <small className="text-muted">{restaurant?.cuisine}</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card h-100 border-primary">
                                            <div className="card-body text-center">
                                                <i className="fas fa-shopping-bag fa-2x text-primary mb-2"></i>
                                                <h3 className="mb-0">{stats?.totalOrders || 0}</h3>
                                                <small className="text-muted">Total Orders</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card h-100 border-success">
                                            <div className="card-body text-center">
                                                <i className="fas fa-dollar-sign fa-2x text-success mb-2"></i>
                                                <h3 className="mb-0">${stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                                                <small className="text-muted">Total Revenue</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card h-100 border-info">
                                            <div className="card-body text-center">
                                                <i className="fas fa-utensils fa-2x text-info mb-2"></i>
                                                <h3 className="mb-0">{menuItems.length}</h3>
                                                <small className="text-muted">Menu Items</small>
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
                                                                            {item.name} x {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <p className="mb-0"><strong>Total:</strong> ${order.total?.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <span className={`badge bg-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning'} mb-2`}>
                                                                    {order.status}
                                                                </span>
                                                                {order.status === 'placed' && (
                                                                    <div className="btn-group-vertical">
                                                                        <button className="btn btn-sm btn-success" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                                                                            Accept & Prepare
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {order.status === 'preparing' && (
                                                                    <button className="btn btn-sm btn-primary" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
                                                                        Mark Ready
                                                                    </button>
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
                                                    <label className="form-label">Price ($)</label>
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
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={menuForm.category}
                                                        onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-12">
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
                                                                <td><span className="badge bg-secondary">{item.category}</span></td>
                                                                <td>${item.price?.toFixed(2)}</td>
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
        </div>
    );
};

export default Dashboard;

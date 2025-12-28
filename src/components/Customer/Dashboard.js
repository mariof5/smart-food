import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cartService } from '../../services/databaseService';
import RestaurantBrowser from './RestaurantBrowser';
import RestaurantMenu from './RestaurantMenu';
import OrderManagement from './OrderManagement';
import OrderTracking from './OrderTracking';

const Dashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const location = useLocation();
    const [activeView, setActiveView] = useState('browse');
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [trackingOrderId, setTrackingOrderId] = useState(null);
    const [cart, setCart] = useState([]);
    const [cartLoaded, setCartLoaded] = useState(false);

    // Load cart on mount/user change
    useEffect(() => {
        if (currentUser?.uid) {
            const loadCart = async () => {
                const savedCart = await cartService.getCart(currentUser.uid);
                setCart(savedCart);
                setCartLoaded(true);
            };
            loadCart();
        }
    }, [currentUser?.uid]);

    // Save cart on change
    useEffect(() => {
        if (cartLoaded && currentUser?.uid) {
            cartService.saveCart(currentUser.uid, cart);
        }
    }, [cart, cartLoaded, currentUser?.uid]);

    const handleLogout = async () => {
        await logout();
    };

    const handleSelectRestaurant = (restaurant) => {
        setSelectedRestaurant(restaurant);
    };

    const handleBackToRestaurants = () => {
        setSelectedRestaurant(null);
    };

    const getTotalCartItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const handleOrderPlaced = (orderId) => {
        setSelectedRestaurant(null);
        setTrackingOrderId(orderId);
        setActiveView('tracking');
    };

    const handleTrackOrder = (orderId) => {
        setTrackingOrderId(orderId);
        setActiveView('tracking');
    };

    const renderContent = () => {
        if (selectedRestaurant) {
            return <RestaurantMenu
                restaurant={selectedRestaurant}
                onBack={handleBackToRestaurants}
                cart={cart}
                setCart={setCart}
                onOrderPlaced={handleOrderPlaced}
            />;
        }

        switch (activeView) {
            case 'browse':
                return <RestaurantBrowser onSelectRestaurant={handleSelectRestaurant} />;
            case 'orders':
                return <OrderManagement onTrackOrder={handleTrackOrder} />;
            case 'tracking':
                return <OrderTracking orderId={trackingOrderId} />;
            default:
                return <RestaurantBrowser onSelectRestaurant={handleSelectRestaurant} />;
        }
    };

    return (
        <div className="min-vh-100 bg-light dashboard-layout">
            {/* Navigation Bar */}
            <nav className="navbar navbar-smartfood navbar-expand-lg navbar-light sticky-top">
                <div className="container-fluid">
                    <Link className="navbar-brand-smartfood fw-bold ethiopia-flag text-decoration-none" to="/">
                        SmartFood
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarDashboard"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarDashboard">
                        <ul className="navbar-nav ms-auto align-items-center">
                            {/* User Profile */}
                            <li className="nav-item dropdown me-3">
                                <a
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    href="#"
                                    id="profileDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                >
                                    <div className="user-avatar me-2">
                                        <i className="fas fa-user-circle fa-lg text-primary"></i>
                                    </div>
                                    <span className="fw-semibold text-dark">{userData?.name || 'User'}</span>
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                                    <li className="px-3 py-2">
                                        <div className="small text-muted text-uppercase mb-1">Account</div>
                                        <div className="fw-bold text-dark">{currentUser?.email}</div>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item py-2" onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt me-2 text-danger"></i>
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </li>

                            {/* Shopping Cart */}
                            <li className="nav-item dropdown">
                                <button
                                    className="btn btn-primary rounded-pill px-4 position-relative d-flex align-items-center"
                                    id="cartDropdown"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="fas fa-shopping-cart me-2"></i>
                                    Cart
                                    {cart.length > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow">
                                            {getTotalCartItems()}
                                        </span>
                                    )}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 p-0" style={{ minWidth: '320px', borderRadius: '15px', overflow: 'hidden' }}>
                                    <div className="p-3 bg-primary text-white">
                                        <h6 className="mb-0">Your Order ({getTotalCartItems()} items)</h6>
                                    </div>
                                    <div className="cart-items-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {cart.length === 0 ? (
                                            <div className="px-3 py-5 text-center text-muted">
                                                <i className="fas fa-shopping-basket fa-3x mb-3 opacity-25"></i>
                                                <p className="mb-0">Your cart looks a bit lonely</p>
                                            </div>
                                        ) : (
                                            <>
                                                {cart.map(item => (
                                                    <div key={item.id} className="p-3 border-bottom hover-bg-light transition-all">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-0 small fw-bold">{item.name}</h6>
                                                                <small className="text-muted">{item.quantity} x {item.price} ETB</small>
                                                            </div>
                                                            <div className="text-end ms-3">
                                                                <span className="fw-bold text-primary">{(item.quantity * item.price).toFixed(2)} ETB</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="p-3 bg-light">
                                                    <div className="d-flex justify-content-between align-items-center mb-0">
                                                        <span className="h6 mb-0 fw-bold">Grand Total</span>
                                                        <span className="h5 mb-0 fw-bold text-primary">
                                                            {cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)} ETB
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-2 border-top">
                                                    <button className="btn btn-primary w-100 py-2 rounded-pill shadow-sm">
                                                        Proceed to Checkout
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="container-fluid py-4">
                <div className="row g-4">
                    {/* Sidebar */}
                    <div className="col-md-3 col-lg-2">
                        <div className="card border-0 shadow-sm sticky-top" style={{ top: '100px', borderRadius: '20px' }}>
                            <div className="card-body p-2">
                                <div className="nav flex-column nav-pills custom-pills">
                                    <button
                                        className={`nav-link text-start mb-2 py-3 px-4 rounded-pill transition-all ${activeView === 'browse' ? 'active shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveView('browse')}
                                    >
                                        <i className="fas fa-store me-3"></i>
                                        Browse
                                    </button>
                                    <button
                                        className={`nav-link text-start mb-2 py-3 px-4 rounded-pill transition-all ${activeView === 'orders' ? 'active shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveView('orders')}
                                    >
                                        <i className="fas fa-shopping-bag me-3"></i>
                                        My Orders
                                    </button>
                                    <button
                                        className={`nav-link text-start py-3 px-4 rounded-pill transition-all ${activeView === 'tracking' ? 'active shadow-sm' : 'text-dark'}`}
                                        onClick={() => setActiveView('tracking')}
                                    >
                                        <i className="fas fa-map-marker-alt me-3"></i>
                                        Tracking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9 col-lg-10">
                        <div className="welcome-banner mb-4 p-4 rounded-4 bg-white shadow-sm border-start border-4 border-primary">
                            <h2 className="section-title mb-1">
                                Hello, {userData?.name || 'Foodie'}!
                            </h2>
                            <p className="text-muted mb-0">What are you craving for today?</p>
                        </div>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

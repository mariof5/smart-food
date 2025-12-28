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

    const handleOrderPlaced = () => {
        setSelectedRestaurant(null);
        setActiveView('orders');
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
                return <OrderManagement />;
            case 'tracking':
                return <OrderTracking />;
            default:
                return <RestaurantBrowser onSelectRestaurant={handleSelectRestaurant} />;
        }
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Navigation Bar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container-fluid">
                    <Link className="navbar-brand" to="/customer/dashboard">
                        <i className="fas fa-utensils me-2"></i>
                        SmartFood
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            {/* Shopping Cart */}
                            <li className="nav-item dropdown me-3">
                                <a
                                    className="nav-link position-relative"
                                    href="#"
                                    id="cartDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="fas fa-shopping-cart fa-lg"></i>
                                    {cart.length > 0 && (
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                            {getTotalCartItems()}
                                        </span>
                                    )}
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '300px' }}>
                                    {cart.length === 0 ? (
                                        <li className="px-3 py-4 text-center text-muted">
                                            <i className="fas fa-shopping-cart fa-2x mb-2"></i>
                                            <p className="mb-0">Your cart is empty</p>
                                        </li>
                                    ) : (
                                        <>
                                            <li className="px-3 py-2">
                                                <h6 className="mb-0">Cart Items ({getTotalCartItems()})</h6>
                                            </li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {cart.map(item => (
                                                    <div key={item.id} className="px-3 py-2 border-bottom">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <small className="fw-bold">{item.name}</small>
                                                                <br />
                                                                <small className="text-muted">{item.quantity} x {item.price} ETB</small>
                                                            </div>
                                                            <small className="fw-bold">{(item.quantity * item.price).toFixed(2)} ETB</small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li className="px-3 py-2">
                                                <div className="d-flex justify-content-between">
                                                    <strong>Total:</strong>
                                                    <strong className="text-primary">
                                                        {cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)} ETB
                                                    </strong>
                                                </div>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </li>

                            {/* User Profile */}
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    id="navbarDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="fas fa-user-circle me-2"></i>
                                    {userData?.name || 'User'}
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <span className="dropdown-item-text">
                                            <small className="text-muted">{currentUser?.email}</small>
                                        </span>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt me-2"></i>
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3 col-lg-2 bg-white border-end min-vh-100 p-0">
                        <div className="list-group list-group-flush">
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'browse' ? 'active' : ''}`}
                                onClick={() => setActiveView('browse')}
                            >
                                <i className="fas fa-store me-2"></i>
                                Browse Restaurants
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveView('orders')}
                            >
                                <i className="fas fa-shopping-bag me-2"></i>
                                My Orders
                            </button>
                            <button
                                className={`list-group-item list-group-item-action ${activeView === 'tracking' ? 'active' : ''}`}
                                onClick={() => setActiveView('tracking')}
                            >
                                <i className="fas fa-map-marker-alt me-2"></i>
                                Track Order
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-md-9 col-lg-10 p-4">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../services/authService';

const Navbar = () => {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!userData) return '/login';

        switch (userData.role) {
            case USER_ROLES.CUSTOMER:
                return '/customer/dashboard';
            case USER_ROLES.RESTAURANT:
                return '/restaurant/dashboard';
            case USER_ROLES.DELIVERY:
                return '/delivery/dashboard';
            case USER_ROLES.ADMIN:
                return '/admin/dashboard';
            default:
                return '/login';
        }
    };

    return (
        <nav className="navbar navbar-smartfood navbar-expand-lg navbar-light sticky-top">
            <div className="container">
                <Link className="navbar-brand-smartfood fw-bold ethiopia-flag text-decoration-none" to="/">
                    SmartFood
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <a className="nav-link active" href="#">Home</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#restaurants">Restaurants</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#features">Features</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#how-it-works">How It Works</a>
                        </li>
                    </ul>
                    <div className="d-flex">
                        {currentUser ? (
                            <div className="dropdown">
                                <button className="btn btn-outline-primary dropdown-toggle" type="button" id="userMenu" data-bs-toggle="dropdown">
                                    <i className="fas fa-user me-1"></i> {userData?.name || currentUser?.email}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <Link className="dropdown-item" to={getDashboardLink()}>
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                                </ul>
                            </div>
                        ) : (
                            <div>
                                <Link to="/login" className="btn btn-outline-primary me-2">
                                    <i className="fas fa-sign-in-alt me-1"></i> Sign In
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    <i className="fas fa-user-plus me-1"></i> Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

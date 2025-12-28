import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const { currentUser, userData } = useAuth();

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="card shadow text-center">
                            <div className="card-body p-5">
                                <div className="mb-4">
                                    <i className="fas fa-ban text-danger" style={{ fontSize: '5rem' }}></i>
                                </div>

                                <h2 className="text-danger mb-3">Access Denied</h2>
                                <p className="text-muted mb-4">
                                    You don't have permission to access this page.
                                </p>

                                {currentUser && userData && (
                                    <div className="alert alert-info mb-4">
                                        <small>
                                            You are logged in as: <strong>{userData.name}</strong>
                                            <br />
                                            Role: <strong>{userData.role}</strong>
                                        </small>
                                    </div>
                                )}

                                <div className="d-flex gap-2 justify-content-center">
                                    <Link to="/" className="btn btn-primary">
                                        <i className="fas fa-home me-2"></i>
                                        Go Home
                                    </Link>

                                    {currentUser ? (
                                        <Link to="/login" className="btn btn-outline-secondary">
                                            <i className="fas fa-exchange-alt me-2"></i>
                                            Switch Account
                                        </Link>
                                    ) : (
                                        <Link to="/login" className="btn btn-outline-secondary">
                                            <i className="fas fa-sign-in-alt me-2"></i>
                                            Sign In
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;

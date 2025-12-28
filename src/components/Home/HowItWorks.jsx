import React from 'react';
import TrackingBar from '../UI/TrackingBar';

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-5">
            <div className="container">
                <h2 className="section-title text-center mb-5">How It Works</h2>
                <TrackingBar activeStep={0} />

                <div className="row">
                    <div className="col-md-6 mb-4">
                        <div className="card h-100 recommendation-card">
                            <div className="card-body">
                                <h4 className="card-title">Smart Recommendations</h4>
                                <p>Our AI-powered recommendation system suggests dishes you'll love based on your previous
                                    orders and preferences.</p>
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <div className="card">
                                            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                                className="card-img-top" alt="Recommended" />
                                            <div className="card-body">
                                                <h6 className="card-title">Chicken Burger</h6>
                                                <p className="card-text text-muted">Roma Burger</p>
                                                <p className="card-text text-primary">120 ETB</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6 mb-3">
                                        <div className="card">
                                            <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                                className="card-img-top" alt="Recommended" />
                                            <div className="card-body">
                                                <h6 className="card-title">ዶሮ ወጥ</h6>
                                                <p className="card-text text-muted">Habesha Kitchen</p>
                                                <p className="card-text text-primary">180 ETB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h4 className="card-title">Order Tracking</h4>
                                <div className="map-container mb-3">
                                    <div id="deliveryMap"
                                        className="w-100 h-100 d-flex align-items-center justify-content-center bg-light position-relative">
                                        <i className="fas fa-map-marked-alt fa-3x text-muted"></i>
                                        <div id="deliveryMarker" className="delivery-marker" style={{ top: '30%', left: '20%' }}></div>
                                        <div id="restaurantMarker" className="delivery-marker"
                                            style={{ top: '70%', left: '80%', background: 'var(--ethiopia-green)' }}></div>
                                    </div>
                                </div>
                                <div className="card order-card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5>Order #1245</h5>
                                                <p className="mb-0">Roma Burger → Your Location</p>
                                            </div>
                                            <span className="status-badge badge-delivery">On the way</span>
                                        </div>
                                        <div className="progress mt-3" style={{ height: '8px' }}>
                                            <div className="progress-bar bg-primary" style={{ width: '70%' }}></div>
                                        </div>
                                        <div className="d-flex justify-content-between mt-2">
                                            <small>Order placed</small>
                                            <small>Preparing</small>
                                            <small>On the way</small>
                                            <small>Delivered</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

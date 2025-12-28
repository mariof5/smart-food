import React from 'react';

const HeroSection = () => {
    return (
        <section className="hero-section d-flex align-items-center">
            <div className="container text-center">
                <h1 className="display-4 fw-bold mb-3">Online Food Ordering & Scheduled Delivery</h1>
                <p className="lead mb-4">Order your favorite meals from local restaurants with real-time tracking</p>
                <div className="d-flex justify-content-center">
                    <div className="input-group w-75">
                        <input type="text" className="form-control form-control-lg"
                            placeholder="Search for restaurants or dishes..." />
                        <button className="btn btn-primary btn-lg">Search</button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

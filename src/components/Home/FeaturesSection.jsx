import React from 'react';

const FeaturesSection = () => {
    const features = [
        { icon: 'fas fa-robot', title: 'Smart Recommendations', desc: 'Personalized food suggestions based on your preferences and order history' },
        { icon: 'fas fa-map-marked-alt', title: 'Real-time Tracking', desc: 'Track your order from preparation to delivery with GPS technology' },
        { icon: 'fas fa-money-bill-wave', title: 'Ethiopian Payments', desc: 'Secure payment options including Telebirr and EthioPay' },
        { icon: 'fas fa-bolt', title: 'Fast Delivery', desc: 'Efficient delivery system with optimized routes for faster service' },
        { icon: 'fas fa-calendar-alt', title: 'Scheduled Delivery', desc: 'Order now for delivery at your preferred time' },
        { icon: 'fas fa-headset', title: '24/7 Support', desc: 'Dedicated customer support available anytime you need assistance' }
    ];

    return (
        <section id="features" className="py-5 bg-light">
            <div className="container">
                <h2 className="section-title text-center mb-5">Key Features</h2>
                <div className="row g-4">
                    {features.map((feature, index) => (
                        <div key={index} className="col-md-4 text-center">
                            <div className="feature-icon">
                                <i className={feature.icon}></i>
                            </div>
                            <h4>{feature.title}</h4>
                            <p className="text-muted">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;

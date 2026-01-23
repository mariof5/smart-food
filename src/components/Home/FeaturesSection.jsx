import React, { useState } from 'react';

const FeaturesSection = () => {
    const [hoveredFeature, setHoveredFeature] = useState(null);

    const features = [
        { icon: 'fas fa-robot', title: 'Smart Recommendations', desc: 'Personalized food suggestions based on your preferences and order history', color: '#ff6b35' },
        { icon: 'fas fa-map-marked-alt', title: 'Real-time Tracking', desc: 'Track your order from preparation to delivery with GPS technology', color: '#2ecc71' },
        { icon: 'fas fa-money-bill-wave', title: 'Ethiopian Payments', desc: 'Secure payment options including Telebirr and Chapa', color: '#3498db' },
        { icon: 'fas fa-bolt', title: 'Fast Delivery', desc: 'Efficient delivery system with optimized routes for faster service', color: '#f39c12' },
        { icon: 'fas fa-calendar-alt', title: 'Scheduled Delivery', desc: 'Order now for delivery at your preferred time', color: '#9b59b6' },
        { icon: 'fas fa-headset', title: '24/7 Support', desc: 'Dedicated customer support available anytime you need assistance', color: '#e74c3c' }
    ];

    return (
        <section id="features" className="py-5 bg-light">
            <div className="container">
                <h2 className="section-title text-center mb-5">Key Features</h2>
                <div className="row g-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="col-md-4 text-center"
                            onMouseEnter={() => setHoveredFeature(index)}
                            onMouseLeave={() => setHoveredFeature(null)}
                        >
                            <div className={`feature-card ${hoveredFeature === index ? 'feature-card-hover' : ''}`}>
                                <div
                                    className="feature-icon"
                                    style={{
                                        background: hoveredFeature === index ? feature.color : '#fff3e9',
                                        color: hoveredFeature === index ? '#fff' : feature.color
                                    }}
                                >
                                    <i className={feature.icon}></i>
                                </div>
                                <h4>{feature.title}</h4>
                                <p className="text-muted">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;

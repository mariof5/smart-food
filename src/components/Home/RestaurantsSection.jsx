import React from 'react';
import { restaurantsData } from '../../data/restaurants';
import Card from '../UI/Card';

const RestaurantsSection = () => {
    return (
        <section id="restaurants" className="py-5">
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title">Top Restaurants</h2>
                    <a href="#" className="text-primary">View All</a>
                </div>
                <div className="row g-4">
                    {restaurantsData.map((restaurant, index) => (
                        <div key={index} className="col-lg-3 col-md-6">
                            <Card className="restaurant-card">
                                <img src={restaurant.img} className="card-img-top food-card-img" alt={restaurant.name} />
                                <div className="card-body">
                                    <h5 className="card-title">{restaurant.name}</h5>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted"><i className="fas fa-star text-warning"></i> {restaurant.rating} ({restaurant.reviews})</span>
                                        <span className="text-muted">•</span>
                                        <span className="text-muted">{restaurant.cuisine}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span><i className="fas fa-motorcycle text-primary"></i> {restaurant.deliveryTime}</span>
                                        <span className="badge bg-success">{restaurant.status}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RestaurantsSection;

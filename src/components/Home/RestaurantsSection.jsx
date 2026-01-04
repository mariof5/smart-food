import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { restaurantsData } from '../../data/restaurants';
import Card from '../UI/Card';
import { toast } from 'react-toastify';

const RestaurantsSection = ({ selectedCategory }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleRestaurantClick = (restaurantName) => {
        if (!currentUser) {
            toast.info('Please sign up to view restaurant details');
            navigate('/register');
            return;
        }
        // If logged in, maybe navigate to restaurant menu or details
        // For now, let's keep it simple or show a message
        toast.success(`Opening ${restaurantName}...`);
    };

    const filteredRestaurants = selectedCategory
        ? restaurantsData.filter(r => r.category === selectedCategory)
        : restaurantsData;

    return (
        <section id="restaurants" className="py-5">
            <div className="container">
                <div className="mb-4">
                    <h2 className="section-title">Top Restaurants</h2>
                </div>
                <div className="row g-4">
                    {filteredRestaurants.length > 0 ? (
                        filteredRestaurants.map((restaurant, index) => (
                            <div key={index} className="col-lg-3 col-md-6">
                                <Card
                                    className="restaurant-card"
                                    onClick={() => handleRestaurantClick(restaurant.name)}
                                >
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
                        ))
                    ) : (
                        <div className="col-12 text-center py-5">
                            <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
                            <p className="lead text-muted">No restaurants found in this category.</p>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => window.location.reload()}
                            >
                                View All Restaurants
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RestaurantsSection;

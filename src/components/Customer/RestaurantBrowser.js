import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { restaurantService, menuService } from '../../services/databaseService';
import { gpsService } from '../../services/gpsService';

const RestaurantBrowser = ({ onSelectRestaurant }) => {
  const { currentUser } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [userLocation, setUserLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Restaurants', icon: 'utensils' },
    { id: 'fast-food', name: 'Fast Food', icon: 'hamburger' },
    { id: 'ethiopian', name: 'Ethiopian', icon: 'bread-slice' },
    { id: 'italian', name: 'Italian', icon: 'pizza-slice' },
    { id: 'coffee', name: 'Coffee & Drinks', icon: 'mug-hot' }
  ];

  useEffect(() => {
    loadRestaurants();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterAndSortRestaurants();
  }, [restaurants, searchTerm, selectedCategory, sortBy, userLocation]);

  const loadRestaurants = async () => {
    try {
      const restaurantsData = await restaurantService.getAll();

      // Calculate distance and delivery time for each restaurant
      const restaurantsWithDistance = await Promise.all(
        restaurantsData.map(async (restaurant) => {
          let distance = null;
          let deliveryTime = restaurant.deliveryTime || '30-45 min';

          if (userLocation && restaurant.latitude && restaurant.longitude) {
            distance = gpsService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              restaurant.latitude,
              restaurant.longitude
            );

            const estimatedTime = gpsService.calculateDeliveryTime(distance);
            deliveryTime = `${estimatedTime}-${estimatedTime + 10} min`;
          }

          // Store is open ONLY if manual toggle is true (or not set) AND opening hours match
          const manualStatus = restaurant.isOpen !== false;
          const timeStatus = isRestaurantOpen(restaurant.openingHours);

          return {
            ...restaurant,
            distance,
            deliveryTime,
            isOpen: manualStatus && timeStatus
          };
        })
      );

      setRestaurants(restaurantsWithDistance);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const location = await gpsService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.log('Location access denied or unavailable');
    }
  };

  const isRestaurantOpen = (openingHours) => {
    if (!openingHours) return true; // Assume open if no hours specified

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

    const todayHours = openingHours[currentDay];
    if (!todayHours || todayHours.closed) return false;

    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const filterAndSortRestaurants = () => {
    let filtered = [...restaurants];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        restaurant.categories?.includes(selectedCategory)
      );
    }

    // Sort restaurants
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          if (!a.distance || !b.distance) return 0;
          return a.distance - b.distance;
        case 'delivery-time':
          const aTime = parseInt(a.deliveryTime.split('-')[0]);
          const bTime = parseInt(b.deliveryTime.split('-')[0]);
          return aTime - bTime;
        case 'popularity':
          return (b.totalOrders || 0) - (a.totalOrders || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredRestaurants(filtered);
  };

  const handleRestaurantSelect = async (restaurant) => {
    try {
      // Load restaurant menu
      const menuItems = await menuService.getByRestaurant(restaurant.id);

      onSelectRestaurant({
        ...restaurant,
        menuItems
      });
    } catch (error) {
      console.error('Error loading restaurant menu:', error);
      toast.error('Failed to load restaurant menu');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading restaurants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Search Bar */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '25px', background: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="row g-3 align-items-center justify-content-center">
              <div className="col-lg-8">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 ps-4">
                    <i className="fas fa-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg border-start-0 ps-0"
                    placeholder="What would you like to eat today?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: '0 30px 30px 0', fontSize: '1.1rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="d-flex flex-nowrap overflow-auto pb-3 gap-3 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {categories.map(category => (
              <div
                key={category.id}
                className={`category-badge ${selectedCategory === category.id ? 'active' : ''} text-nowrap`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <i className={`fas fa-${category.icon} me-2`}></i>
                {category.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="row mb-3">
        <div className="col-12">
          <p className="text-muted">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            {userLocation && ' near you'}
          </p>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="row">
        {filteredRestaurants.length === 0 ? (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No restaurants found</h5>
                <p className="text-muted">
                  Try adjusting your search terms or filters
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="col-lg-4 col-md-6 mb-4">
              <div
                className={`card restaurant-card h-100 ${!restaurant.isOpen ? 'restaurant-closed' : ''}`}
                onClick={() => restaurant.isOpen && handleRestaurantSelect(restaurant)}
                style={{ cursor: restaurant.isOpen ? 'pointer' : 'not-allowed' }}
              >
                {/* Restaurant Image */}
                <div className="position-relative">
                  <img
                    src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'}
                    className="card-img-top restaurant-image"
                    alt={restaurant.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />

                  {/* Status Badge */}
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className={`badge ${restaurant.isOpen ? 'bg-success' : 'bg-danger'}`}>
                      {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Distance Badge */}
                  {restaurant.distance && (
                    <div className="position-absolute top-0 start-0 m-2">
                      <span className="badge bg-dark bg-opacity-75">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {restaurant.distance.toFixed(1)} km
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{restaurant.name}</h5>
                    <div className="text-end">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-star text-warning me-1"></i>
                        <span className="fw-bold">{restaurant.rating?.toFixed(1) || 'New'}</span>
                      </div>
                      <small className="text-muted">({restaurant.totalReviews || 0} reviews)</small>
                    </div>
                  </div>

                  <p className="text-muted small mb-2">{restaurant.cuisine}</p>

                  {restaurant.description && (
                    <p className="card-text small text-muted mb-3">
                      {restaurant.description.length > 100
                        ? restaurant.description.substring(0, 100) + '...'
                        : restaurant.description
                      }
                    </p>
                  )}

                  <div className="row text-center">
                    <div className="col-4">
                      <div className="border-end">
                        <i className="fas fa-clock text-primary d-block"></i>
                        <small className="text-muted">{restaurant.deliveryTime}</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border-end">
                        <i className="fas fa-motorcycle text-primary d-block"></i>
                        <small className="text-muted">{restaurant.deliveryFee || 25} ETB</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <i className="fas fa-utensils text-primary d-block"></i>
                      <small className="text-muted">{restaurant.totalMenuItems || 0} items</small>
                    </div>
                  </div>

                  {/* Promotions */}
                  {restaurant.promotions && restaurant.promotions.length > 0 && (
                    <div className="mt-3">
                      {restaurant.promotions.map((promo, index) => (
                        <span key={index} className="badge bg-warning text-dark me-1">
                          <i className="fas fa-tag me-1"></i>
                          {promo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {!restaurant.isOpen && (
                  <div className="card-footer bg-light">
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      Opens at {restaurant.openingHours?.[new Date().getDay()]?.open || 'N/A'}
                    </small>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredRestaurants.length > 0 && filteredRestaurants.length % 12 === 0 && (
        <div className="row">
          <div className="col-12 text-center">
            <button className="btn btn-outline-primary">
              <i className="fas fa-plus me-2"></i>
              Load More Restaurants
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantBrowser;
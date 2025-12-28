import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { menuService, orderService } from '../../services/databaseService';
import { toast } from 'react-toastify';

const RestaurantMenu = ({ restaurant, onBack, cart, setCart, onOrderPlaced }) => {
    const { currentUser, userData } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [deliveryAddress, setDeliveryAddress] = useState(userData?.address || '');
    const [phoneNumber, setPhoneNumber] = useState(userData?.phone || '');
    const [specialInstructions, setSpecialInstructions] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('telebirr');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    useEffect(() => {
        loadMenu();
    }, [restaurant.id]);

    const loadMenu = async () => {
        try {
            const items = await menuService.getByRestaurant(restaurant.id);
            setMenuItems(items);
        } catch (error) {
            console.error('Error loading menu:', error);
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', ...new Set(menuItems.map(item => item.category))];

    const filteredMenuItems = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === selectedCategory);

    const addToCart = (item) => {
        const existing = cart.find(cartItem => cartItem.id === item.id);
        if (existing) {
            setCart(cart.map(cartItem =>
                cartItem.id === item.id
                    ? { ...cartItem, quantity: cartItem.quantity + 1 }
                    : cartItem
            ));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
        toast.success(`${item.name} added to cart!`);
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId, newQuantity) => {
        if (newQuantity === 0) {
            removeFromCart(itemId);
        } else {
            setCart(cart.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            ));
        }
    };

    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const deliveryFee = restaurant.deliveryFee || 25;
    const subtotal = calculateSubtotal();
    const total = subtotal + deliveryFee;

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            toast.error('Please add items to your cart');
            return;
        }
        if (!deliveryAddress) {
            toast.error('Please enter delivery address');
            return;
        }
        if (!phoneNumber) {
            toast.error('Please enter phone number');
            return;
        }

        setIsPlacingOrder(true);

        try {
            const orderData = {
                customerId: currentUser.uid,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                items: cart.map(item => ({
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal,
                deliveryFee,
                total,
                deliveryAddress,
                phoneNumber,
                specialInstructions,
                paymentMethod,
                paymentStatus: paymentMethod === 'telebirr' ? 'pending_verification' : 'pending_payment',
                createdAt: new Date().toISOString()
            };

            const result = await orderService.create(orderData);

            if (result.success) {
                setCart([]);
                toast.success(`Order placed successfully!`);
                if (onOrderPlaced) {
                    onOrderPlaced(); // Navigate to Orders Dashboard
                }
            } else {
                toast.error(result.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Failed to place order');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading menu...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid position-relative">
            {/* Restaurant Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <button className="btn btn-link text-decoration-none mb-3" onClick={onBack}>
                        <i className="fas fa-arrow-left me-2"></i>
                        Back to Restaurants
                    </button>

                    <div className="card">
                        <div className="row g-0">
                            <div className="col-md-4">
                                <img
                                    src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'}
                                    className="img-fluid rounded-start"
                                    alt={restaurant.name}
                                    style={{ height: '100%', objectFit: 'cover', minHeight: '200px' }}
                                />
                            </div>
                            <div className="col-md-8">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h2 className="card-title">{restaurant.name}</h2>
                                            <p className="text-muted mb-2">
                                                <i className="fas fa-utensils me-2"></i>
                                                {restaurant.cuisine}
                                            </p>
                                            <p className="card-text">{restaurant.description}</p>
                                        </div>
                                        <div className="text-end">
                                            <div className="d-flex align-items-center mb-2">
                                                <i className="fas fa-star text-warning me-1"></i>
                                                <span className="fw-bold">{restaurant.rating?.toFixed(1) || 'New'}</span>
                                            </div>
                                            <span className={`badge ${restaurant.isOpen ? 'bg-success' : 'bg-danger'} `}>
                                                {restaurant.isOpen ? 'Open' : 'Closed'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="row mt-3">
                                        <div className="col-md-4">
                                            <i className="fas fa-clock text-primary me-2"></i>
                                            <small>{restaurant.deliveryTime}</small>
                                        </div>
                                        <div className="col-md-4">
                                            <i className="fas fa-motorcycle text-primary me-2"></i>
                                            <small>{deliveryFee} ETB delivery fee</small>
                                        </div>
                                        <div className="col-md-4">
                                            <i className="fas fa-map-marker-alt text-primary me-2"></i>
                                            <small>{restaurant.distance ? `${restaurant.distance.toFixed(1)} km away` : 'Location'}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex gap-2 flex-wrap">
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`btn ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'} btn - sm`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Menu Items */}
                <div className="col-lg-8">
                    {filteredMenuItems.length === 0 ? (
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <i className="fas fa-utensils fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No menu items available</h5>
                            </div>
                        </div>
                    ) : (
                        <div className="row">
                            {filteredMenuItems.map(item => (
                                <div key={item.id} className="col-md-6 mb-3">
                                    <div className="card h-100">
                                        <div className="row g-0">
                                            {item.image && (
                                                <div className="col-4">
                                                    <img
                                                        src={item.image}
                                                        className="img-fluid rounded-start"
                                                        alt={item.name}
                                                        style={{ height: '100%', objectFit: 'cover', minHeight: '120px' }}
                                                    />
                                                </div>
                                            )}
                                            <div className={item.image ? 'col-8' : 'col-12'}>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="card-title mb-0">{item.name}</h6>
                                                        <span className="badge bg-primary">{item.price} ETB</span>
                                                    </div>
                                                    <p className="card-text small text-muted mb-2">
                                                        {item.description}
                                                    </p>
                                                    {item.available ? (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary w-100"
                                                            onClick={() => addToCart(item)}
                                                        >
                                                            <i className="fas fa-plus me-1"></i>
                                                            Add to Cart
                                                        </button>
                                                    ) : (
                                                        <span className="text-danger small">
                                                            <i className="fas fa-times-circle me-1"></i>
                                                            Currently unavailable
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Sidebar */}
                <div className="col-lg-4">
                    <div className="card sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-shopping-cart me-2"></i>
                                Your Cart ({cart.length})
                            </h5>
                        </div>
                        <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {cart.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <i className="fas fa-shopping-cart fa-3x mb-3"></i>
                                    <p>Your cart is empty</p>
                                    <small>Add items from the menu</small>
                                </div>
                            ) : (
                                <>
                                    {cart.map(item => (
                                        <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">{item.name}</h6>
                                                <small className="text-muted">{item.price} ETB each</small>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <i className="fas fa-minus"></i>
                                                </button>
                                                <span className="fw-bold">{item.quantity}</span>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <i className="fas fa-plus"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Order Summary */}
                                    <div className="mt-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Subtotal:</span>
                                            <strong>{subtotal.toFixed(2)} ETB</strong>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Delivery Fee:</span>
                                            <strong>{deliveryFee.toFixed(2)} ETB</strong>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between mb-3">
                                            <strong>Total:</strong>
                                            <strong className="text-primary">{total.toFixed(2)} ETB</strong>
                                        </div>

                                        {/* Delivery Details */}
                                        <div className="mb-3">
                                            <label className="form-label small">Delivery Address</label>
                                            <textarea
                                                className="form-control form-control-sm"
                                                rows="2"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter your full address"
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label small">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control form-control-sm"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="+251 9XX XXX XXX"
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label small">Special Instructions</label>
                                            <textarea
                                                className="form-control form-control-sm"
                                                rows="2"
                                                value={specialInstructions}
                                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                                placeholder="Any special requests?"
                                            />
                                        </div>

                                        {/* Payment Method */}
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold">Payment Method</label>
                                            <div className="d-flex gap-2 mb-2">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="paymentMethod"
                                                        id="paymentTelebirr"
                                                        checked={paymentMethod === 'telebirr'}
                                                        onChange={() => setPaymentMethod('telebirr')}
                                                    />
                                                    <label className="form-check-label" htmlFor="paymentTelebirr">
                                                        Telebirr
                                                    </label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="paymentMethod"
                                                        id="paymentCash"
                                                        checked={paymentMethod === 'cash'}
                                                        onChange={() => setPaymentMethod('cash')}
                                                    />
                                                    <label className="form-check-label" htmlFor="paymentCash">
                                                        Cash
                                                    </label>
                                                </div>
                                            </div>

                                            {paymentMethod === 'telebirr' && (
                                                <div className="alert alert-light border p-2">
                                                    <p className="mb-0 small"><strong>Instructions:</strong> Please transfer <strong>{total.toFixed(2)} ETB</strong> to <strong>0911223344</strong> (SmartFood).</p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={handlePlaceOrder}
                                            disabled={!restaurant.isOpen || isPlacingOrder}
                                        >
                                            {isPlacingOrder ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Placing Order...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-check me-2"></i>
                                                    Place Order
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default RestaurantMenu;

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { reviewService } from '../../services/databaseService';

const RatingModal = ({ order, onRatingComplete, onDismiss }) => {
    const [restaurantRating, setRestaurantRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (restaurantRating === 0 || deliveryRating === 0) {
            toast.warn('Please provide a rating for both the restaurant and the delivery.');
            return;
        }

        setIsSubmitting(true);
        try {
            const reviewData = {
                customerId: order.customerId,
                restaurantId: order.restaurantId,
                driverId: order.driverId,
                restaurantRating,
                deliveryRating,
                comment
            };

            const result = await reviewService.addReview(order.id, reviewData);

            if (result.success) {
                toast.success('Thank you for your feedback! ✨');
                onRatingComplete(order.id);
            } else {
                toast.error('Failed to save review. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (rating, setRating) => {
        return (
            <div className="d-flex gap-2 justify-content-center my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i
                        key={star}
                        className={`${star <= rating ? 'fas' : 'far'} fa-star fa-2x text-warning cursor-pointer`}
                        onClick={() => setRating(star)}
                        style={{ cursor: 'pointer' }}
                    ></i>
                ))}
            </div>
        );
    };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                    <div className="modal-header bg-primary text-white border-0 py-3" style={{ borderRadius: '20px 20px 0 0' }}>
                        <h5 className="modal-title w-100 text-center">
                            <i className="fas fa-star-half-alt me-2"></i>
                            Rate Your Experience
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onDismiss} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="text-center mb-4">
                            <div className="mb-3">
                                <img
                                    src={order.restaurantImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'}
                                    alt="Logo"
                                    className="rounded-circle shadow-sm"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                />
                            </div>
                            <h4>Order {order.orderNumber}</h4>
                            <p className="text-muted">How was your meal and delivery?</p>
                        </div>

                        {/* Restaurant Rating */}
                        <div className="mb-4 text-center">
                            <label className="form-label fw-bold">Restaurant Rating</label>
                            {renderStars(restaurantRating, setRestaurantRating)}
                            <small className="text-muted">{order.restaurantName || 'The Restaurant'}</small>
                        </div>

                        {/* Delivery Rating */}
                        <div className="mb-4 text-center">
                            <label className="form-label fw-bold">Delivery Performance</label>
                            {renderStars(deliveryRating, setDeliveryRating)}
                            <small className="text-muted">Driver: {order.driverName || 'Anonymous'}</small>
                        </div>

                        {/* Comment */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">Anything else you'd like to share?</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="The food was great! The driver was very polite..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                style={{ borderRadius: '12px' }}
                            ></textarea>
                        </div>
                    </div>
                    <div className="modal-footer border-0 p-4">
                        <button
                            type="button"
                            className="btn btn-light rounded-pill px-4"
                            onClick={onDismiss}
                            disabled={isSubmitting}
                        >
                            Skip for now
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary rounded-pill px-4 shadow-sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;

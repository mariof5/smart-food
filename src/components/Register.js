import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, registerRestaurant, registerDelivery, validatePasswordStrength, validatePassword } from '../services/authService';
import { gpsService } from '../services/gpsService';
import { locationService } from '../services/locationService';
import { toast } from 'react-toastify';
import ThemeToggle from './UI/ThemeToggle';

const Register = () => {
    const [userType, setUserType] = useState(USER_ROLES.CUSTOMER);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        address: '',
        // Restaurant specific
        restaurantName: '',
        description: '',
        cuisine: '',
        // Delivery specific
        vehicleType: 'motorcycle',
        licenseNumber: '',
        // Payment specific
        paymentMethod: 'chapa'
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [showPaymentSection, setShowPaymentSection] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Update password strength in real-time
        if (name === 'password') {
            const strength = validatePasswordStrength(value);
            setPasswordStrength(strength);
        }

        // Address suggestions logic
        if (name === 'address') {
            setAddressSuggestions(locationService.getSuggestions(value));
        }
    };

    const handleAddressChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, address: value }));
        setAddressSuggestions(locationService.getSuggestions(value));
    };

    const selectSuggestion = (suggestion) => {
        setFormData(prev => ({ ...prev, address: suggestion }));
        setAddressSuggestions([]);
    };

    const detectLocation = async () => {
        setIsDetectingLocation(true);
        try {
            const position = await gpsService.getCurrentLocation();
            const address = await locationService.getAddressFromCoords(position.latitude, position.longitude);
            setFormData(prev => ({ ...prev, address: address }));
            toast.success('Location detected!');
        } catch (error) {
            console.error('Error detecting location:', error);
            toast.error('Could not detect location. Please enter manually.');
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            setLoading(false);
            return;
        }

        // Validate password strength
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            toast.error(passwordValidation.error);
            setLoading(false);
            return;
        }

        try {
            let result;

            if (userType === USER_ROLES.RESTAURANT) {
                // Determine signup fee status based on payment method
                const signupFeeStatus = formData.paymentMethod === 'chapa' ? 'paid' : 'pending';
                
                result = await registerRestaurant(formData.email, formData.password, {
                    ownerName: formData.name,
                    name: formData.restaurantName,
                    description: formData.description,
                    cuisine: formData.cuisine,
                    address: formData.address,
                    phone: formData.phone,
                    signupFeeStatus,
                    paymentMethod: formData.paymentMethod
                });

                if (result.success) {
                    if (formData.paymentMethod === 'cash') {
                        toast.success('Registration submitted! Your account is pending approval after payment verification.');
                    } else {
                        toast.success('Registration successful! Please login.');
                    }
                    navigate('/login');
                }
            } else if (userType === USER_ROLES.DELIVERY) {
                result = await registerDelivery(formData.email, formData.password, {
                    name: formData.name,
                    phone: formData.phone,
                    vehicleType: formData.vehicleType,
                    licenseNumber: formData.licenseNumber
                });

                if (result.success) {
                    toast.success('Registration successful! Please login.');
                    navigate('/login');
                }
            } else {
                result = await register(formData.email, formData.password, {
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    role: userType
                });

                if (result.success) {
                    toast.success('Registration successful! Please login.');
                    navigate('/login');
                }
            }

            if (!result.success) {
                toast.error(result.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center auth-page py-5">
            <div className="container">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                    <Link to="/" className="back-link">
                        <i className="fas fa-arrow-left me-2"></i> Back to Home
                    </Link>
                    <ThemeToggle size="sm" />
                </div>
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow auth-card">
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <h2 className="auth-header">
                                        <i className="fas fa-utensils me-2"></i>
                                        Food Express
                                    </h2>
                                    <p className="auth-subtitle">Create your account</p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {/* User Type Selection */}
                                    <div className="mb-3">
                                        <label className="form-label">Register as</label>
                                        <select
                                            className="form-select auth-select"
                                            value={userType}
                                            onChange={(e) => setUserType(e.target.value)}
                                            required
                                        >
                                            <option value={USER_ROLES.CUSTOMER}>Customer</option>
                                            <option value={USER_ROLES.RESTAURANT}>Restaurant Owner</option>
                                            <option value={USER_ROLES.DELIVERY}>Delivery Personnel</option>
                                        </select>
                                    </div>

                                    {/* Common Fields */}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">
                                                {userType === USER_ROLES.RESTAURANT ? 'Owner Name' : 'Full Name'}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+251911234567"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Restaurant Specific Fields */}
                                    {userType === USER_ROLES.RESTAURANT && (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label">Restaurant Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="restaurantName"
                                                    value={formData.restaurantName}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleChange}
                                                    rows="2"
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Cuisine Type</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="cuisine"
                                                    value={formData.cuisine}
                                                    onChange={handleChange}
                                                    placeholder="e.g., Italian, Fast Food, Ethiopian"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Delivery Specific Fields */}
                                    {userType === USER_ROLES.DELIVERY && (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label">Vehicle Type</label>
                                                <select
                                                    className="form-select auth-select"
                                                    name="vehicleType"
                                                    value={formData.vehicleType}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="motorcycle">Motorcycle</option>
                                                    <option value="car">Car</option>
                                                    <option value="bicycle">Bicycle</option>
                                                </select>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">License Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="licenseNumber"
                                                    value={formData.licenseNumber}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Address (for Customer and Restaurant) */}
                                    {(userType === USER_ROLES.CUSTOMER || userType === USER_ROLES.RESTAURANT) && (
                                        <div className="mb-3 position-relative">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="form-label mb-0">
                                                    {userType === USER_ROLES.RESTAURANT ? 'Restaurant Address' : 'Address'}
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-sm p-0 text-decoration-none"
                                                    onClick={detectLocation}
                                                    disabled={isDetectingLocation}
                                                >
                                                    {isDetectingLocation ? (
                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                    ) : (
                                                        <i className="fas fa-location-arrow me-1"></i>
                                                    )}
                                                    Track my location
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleAddressChange}
                                                placeholder="Enter neighborhood or area (e.g. Bole, Kality...)"
                                                required
                                                autoComplete="off"
                                            />
                                            {addressSuggestions.length > 0 && (
                                                <div className="position-absolute w-100 shadow-lg bg-white border rounded mt-1 overflow-hidden" style={{ zIndex: 1000 }}>
                                                    {addressSuggestions.map((suggestion, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-2 small hover-bg-light cursor-pointer border-bottom last-border-0 text-dark"
                                                            onClick={() => selectSuggestion(suggestion)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <i className="fas fa-map-marker-alt text-primary me-2"></i>
                                                            {suggestion}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Restaurant Payment Section */}
                                    {userType === USER_ROLES.RESTAURANT && (
                                        <div className="mb-4">
                                            <div className="card border-primary">
                                                <div className="card-header bg-primary text-white">
                                                    <h6 className="mb-0">
                                                        <i className="fas fa-credit-card me-2"></i>
                                                        Payment Details - Signup Fee
                                                    </h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="alert alert-info mb-3">
                                                        <div className="d-flex align-items-center">
                                                            <i className="fas fa-info-circle fa-2x me-3"></i>
                                                            <div>
                                                                <strong>Registration Fee: 5,000 ETB</strong>
                                                                <p className="mb-0 small">This one-time fee grants you access to our platform and customer base.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label fw-bold">Select Payment Method</label>
                                                        
                                                        <div className="form-check mb-2 p-3 border rounded">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="paymentMethod"
                                                                id="chapaPayment"
                                                                value="chapa"
                                                                checked={formData.paymentMethod === 'chapa'}
                                                                onChange={handleChange}
                                                            />
                                                            <label className="form-check-label w-100" htmlFor="chapaPayment">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <strong>Pay with Chapa</strong>
                                                                        <p className="mb-0 small text-muted">Instant approval - Pay securely online</p>
                                                                    </div>
                                                                    <i className="fas fa-credit-card fa-2x text-primary"></i>
                                                                </div>
                                                            </label>
                                                        </div>

                                                        <div className="form-check p-3 border rounded">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="paymentMethod"
                                                                id="cashPayment"
                                                                value="cash"
                                                                checked={formData.paymentMethod === 'cash'}
                                                                onChange={handleChange}
                                                            />
                                                            <label className="form-check-label w-100" htmlFor="cashPayment">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <strong>Cash / Bank Transfer</strong>
                                                                        <p className="mb-0 small text-muted">Pending approval - Manual verification required</p>
                                                                    </div>
                                                                    <i className="fas fa-money-bill-wave fa-2x text-success"></i>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {formData.paymentMethod === 'cash' && (
                                                        <div className="alert alert-warning">
                                                            <strong><i className="fas fa-exclamation-triangle me-2"></i>Important:</strong>
                                                            <p className="mb-2">Your account will be pending approval until payment is verified.</p>
                                                            <p className="mb-0 small">
                                                                <strong>Bank Details:</strong><br />
                                                                Bank: Commercial Bank of Ethiopia<br />
                                                                Account: 1000123456789<br />
                                                                Account Name: Food Express Platform
                                                            </p>
                                                        </div>
                                                    )}

                                                    {formData.paymentMethod === 'chapa' && (
                                                        <div className="alert alert-success">
                                                            <i className="fas fa-check-circle me-2"></i>
                                                            You will be redirected to Chapa payment gateway after registration.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Password Fields */}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Password</label>
                                            <div className="input-group">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-control"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <button
                                                    className="btn btn-outline-secondary border-start-0"
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                >
                                                    <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                                                </button>
                                            </div>

                                            {/* Password Strength Meter */}
                                            {formData.password && passwordStrength && (
                                                <div className="mt-2">
                                                    <div className="password-strength-meter">
                                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                                            <small className="text-muted">Password Strength:</small>
                                                            <small
                                                                className="fw-bold"
                                                                style={{ color: passwordStrength.color }}
                                                            >
                                                                {passwordStrength.strength.toUpperCase()}
                                                            </small>
                                                        </div>
                                                        <div className="progress" style={{ height: '4px' }}>
                                                            <div
                                                                className="progress-bar"
                                                                style={{
                                                                    width: `${(passwordStrength.score / 5) * 100}%`,
                                                                    backgroundColor: passwordStrength.color
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="password-criteria mt-2">
                                                            <div className="row">
                                                                <div className="col-6">
                                                                    <small className={passwordStrength.criteria.minLength ? 'text-success' : 'text-muted'}>
                                                                        <i className={`fas fa-${passwordStrength.criteria.minLength ? 'check' : 'times'} me-1`}></i>
                                                                        8+ characters
                                                                    </small>
                                                                </div>
                                                                <div className="col-6">
                                                                    <small className={passwordStrength.criteria.hasUpperCase ? 'text-success' : 'text-muted'}>
                                                                        <i className={`fas fa-${passwordStrength.criteria.hasUpperCase ? 'check' : 'times'} me-1`}></i>
                                                                        Uppercase
                                                                    </small>
                                                                </div>
                                                                <div className="col-6">
                                                                    <small className={passwordStrength.criteria.hasNumbers ? 'text-success' : 'text-muted'}>
                                                                        <i className={`fas fa-${passwordStrength.criteria.hasNumbers ? 'check' : 'times'} me-1`}></i>
                                                                        Number
                                                                    </small>
                                                                </div>
                                                                <div className="col-6">
                                                                    <small className={passwordStrength.criteria.hasSpecialChar ? 'text-success' : 'text-muted'}>
                                                                        <i className={`fas fa-${passwordStrength.criteria.hasSpecialChar ? 'check' : 'times'} me-1`}></i>
                                                                        Special char
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Confirm Password</label>
                                            <div className="input-group">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="form-control"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <button
                                                    className="btn btn-outline-secondary border-start-0"
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                                >
                                                    <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                                                </button>
                                            </div>
                                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                                <small className="text-danger">
                                                    <i className="fas fa-times me-1"></i>
                                                    Passwords do not match
                                                </small>
                                            )}
                                            {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                                                <small className="text-success">
                                                    <i className="fas fa-check me-1"></i>
                                                    Passwords match
                                                </small>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-auth-primary w-100"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin me-2"></i>
                                                Creating Account...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-user-plus me-2"></i>
                                                Create Account
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="text-center mt-3">
                                    <p className="mb-0">
                                        Already have an account?{' '}
                                        <Link to="/login" className="auth-link">
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

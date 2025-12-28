import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, registerRestaurant, registerDelivery } from '../services/authService';
import { toast } from 'react-toastify';

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
        licenseNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters!');
            setLoading(false);
            return;
        }

        try {
            let result;

            if (userType === USER_ROLES.RESTAURANT) {
                result = await registerRestaurant(formData.email, formData.password, {
                    ownerName: formData.name,
                    name: formData.restaurantName,
                    description: formData.description,
                    cuisine: formData.cuisine,
                    address: formData.address,
                    phone: formData.phone
                });
            } else if (userType === USER_ROLES.DELIVERY) {
                result = await registerDelivery(formData.email, formData.password, {
                    name: formData.name,
                    phone: formData.phone,
                    vehicleType: formData.vehicleType,
                    licenseNumber: formData.licenseNumber
                });
            } else {
                result = await register(formData.email, formData.password, {
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                    role: userType
                });
            }

            if (result.success) {
                toast.success('Registration successful! Please login.');
                navigate('/login');
            } else {
                toast.error(result.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow">
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <h2 className="text-primary">
                                        <i className="fas fa-utensils me-2"></i>
                                        SmartFood
                                    </h2>
                                    <p className="text-muted">Create your account</p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {/* User Type Selection */}
                                    <div className="mb-3">
                                        <label className="form-label">Register as</label>
                                        <select
                                            className="form-select"
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
                                                    className="form-select"
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
                                        <div className="mb-3">
                                            <label className="form-label">
                                                {userType === USER_ROLES.RESTAURANT ? 'Restaurant Address' : 'Address'}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* Password Fields */}
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Confirm Password</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100"
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
                                        <Link to="/login" className="text-primary">
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

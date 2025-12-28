import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../services/authService';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: USER_ROLES.CUSTOMER
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Login successful!');

        // Redirect based on user role
        const userRole = result.user.userData?.role;
        switch (userRole) {
          case USER_ROLES.CUSTOMER:
            navigate('/customer/dashboard');
            break;
          case USER_ROLES.RESTAURANT:
            navigate('/restaurant/dashboard');
            break;
          case USER_ROLES.DELIVERY:
            navigate('/delivery/dashboard');
            break;
          case USER_ROLES.ADMIN:
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="mb-3">
          <Link to="/" className="text-decoration-none text-secondary">
            <i className="fas fa-arrow-left me-2"></i> Back to Home
          </Link>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="text-primary">
                    <i className="fas fa-utensils me-2"></i>
                    SmartFood
                  </h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Account Type</label>
                    <select
                      className="form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value={USER_ROLES.CUSTOMER}>Customer</option>
                      <option value={USER_ROLES.RESTAURANT}>Restaurant Owner</option>
                      <option value={USER_ROLES.DELIVERY}>Delivery Personnel</option>
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary">
                      Sign up here
                    </Link>
                  </p>
                </div>

                {/* Demo Accounts */}
                <div className="mt-4 p-3 bg-light rounded">
                  <small className="text-muted">
                    <strong>Demo Accounts:</strong><br />
                    Customer: customer@demo.com / 123456<br />
                    Restaurant: restaurant@demo.com / 123456<br />
                    Delivery: delivery@demo.com / 123456
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
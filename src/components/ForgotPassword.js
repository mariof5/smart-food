import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { toast } from 'react-toastify';
import ThemeToggle from './UI/ThemeToggle';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setEmailSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      } else {
        toast.error(result.error || 'Failed to send password reset email');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center auth-page">
        <div className="container">
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <Link to="/login" className="back-link">
              <i className="fas fa-arrow-left me-2"></i> Back to Login
            </Link>
            <ThemeToggle size="sm" />
          </div>
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow auth-card">
                <div className="card-body p-4 text-center">
                  <div className="mb-4">
                    <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                    <h2 className="auth-header">Email Sent!</h2>
                    <p className="auth-subtitle">
                      We've sent a password reset link to <strong>{email}</strong>
                    </p>
                  </div>

                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <small>
                      Check your email and click the reset link to create a new password. 
                      The link will expire in 1 hour.
                    </small>
                  </div>

                  <div className="d-grid gap-2">
                    <Link to="/login" className="btn btn-auth-primary">
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Return to Login
                    </Link>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                      }}
                    >
                      <i className="fas fa-redo me-2"></i>
                      Send Another Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-page">
      <div className="container">
        <div className="mb-3">
          <Link to="/login" className="back-link">
            <i className="fas fa-arrow-left me-2"></i> Back to Login
          </Link>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow auth-card">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="fas fa-key fa-3x text-primary mb-3"></i>
                  <h2 className="auth-header">Forgot Password?</h2>
                  <p className="auth-subtitle">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-auth-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Reset Email
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <p className="mb-0">
                    Remember your password?{' '}
                    <Link to="/login" className="auth-link">
                      Sign in here
                    </Link>
                  </p>
                </div>

                <div className="mt-4 demo-accounts">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> Make sure to check your spam folder if you don't receive the email within a few minutes.
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

export default ForgotPassword;
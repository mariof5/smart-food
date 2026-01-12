import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { toast } from 'react-toastify';
import ThemeToggle from './UI/ThemeToggle';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [lastResetTime, setLastResetTime] = useState(null);

  const startResendTimer = () => {
    setResendTimer(60); // 1 minute cooldown
    setLastResetTime(new Date());
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email.trim());

      if (result.success) {
        setEmailSent(true);
        toast.success('Password reset email sent! Check your inbox and spam folder.');
        startResendTimer();
      } else {
        toast.error(result.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;

    setLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        toast.success('Reset link resent successfully! Check your email.');
        startResendTimer();
      } else {
        toast.error(result.error || 'Failed to resend reset link');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('An unexpected error occurred. Please try again.');
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



                  {lastResetTime && (
                    <div className="alert alert-warning">
                      <i className="fas fa-clock me-2"></i>
                      <small>
                        Email sent at {lastResetTime.toLocaleTimeString()}.
                        You can request another reset link in {resendTimer > 0 ? `${resendTimer} seconds` : 'now'}.
                      </small>
                    </div>
                  )}

                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-auth-primary"
                      onClick={handleResend}
                      disabled={loading || resendTimer > 0}
                      title={resendTimer > 0 ? `Wait ${resendTimer} seconds before resending` : 'Send another reset link'}
                    >
                      {loading ? (
                        <><i className="fas fa-spinner fa-spin me-2"></i>Sending...</>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          {resendTimer > 0 ? `Resend Link (${resendTimer}s)` : 'Resend Reset Link'}
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEmailSent(false);
                        setEmail('');
                        setResendTimer(0);
                      }}
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Use Different Email
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
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-envelope text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        autoFocus
                        autoComplete="email"
                      />
                    </div>
                    {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                      <small className="text-danger mt-1 d-block">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Please enter a valid email address
                      </small>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-auth-primary w-100 mb-3"
                    disabled={loading || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
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
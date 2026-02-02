import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { activateRestaurant } from '../../services/authService';
import { toast } from 'react-toastify';

const RestaurantPaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [restaurantEmail, setRestaurantEmail] = useState('');

    useEffect(() => {
        const verify = async () => {
            // Log all URL parameters for debugging
            console.log('=== Payment Callback URL Parameters ===');
            const allParams = {};
            for (let [key, value] of searchParams.entries()) {
                allParams[key] = value;
            }
            console.log(JSON.stringify(allParams, null, 2));
            console.log('Current URL:', window.location.href);
            console.log('=======================================');

            const tx_ref = searchParams.get('tx_ref') || searchParams.get('trx_ref');
            const restaurantIdFromUrl = searchParams.get('restaurantId');

            // Check if we have pending signup data (new flow)
            const pendingSignupDataRaw = localStorage.getItem('pendingRestaurantSignup');
            const pendingSignupData = pendingSignupDataRaw ? JSON.parse(pendingSignupDataRaw) : null;

            // Try to get restaurant ID from URL or localStorage (legacy/existing user flow)
            const existingRestaurantId = restaurantIdFromUrl !== 'new' ? restaurantIdFromUrl : null || localStorage.getItem('pendingRestaurantId');
            const email = pendingSignupData?.email || localStorage.getItem('pendingRestaurantEmail') || '';

            if (!tx_ref) {
                setStatus('error');
                setMessage('No transaction reference found');
                return;
            }

            setRestaurantEmail(email);

            try {
                // Verify payment with the backend
                const result = await paymentService.verifyRestaurantSignup(tx_ref, existingRestaurantId || 'new');

                if (result.status === 'success' && result.paymentStatus === 'success') {
                    // Payment successful!

                    if (pendingSignupData) {
                        // NEW FLOW: Register the restaurant now that payment is confirmed
                        setStatus('verifying');
                        setMessage('Payment verified! Creating your account...');

                        try {
                            const { registerRestaurant } = await import('../../services/authService');
                            const regResult = await registerRestaurant(pendingSignupData.email, pendingSignupData.password, {
                                ownerName: pendingSignupData.name,
                                name: pendingSignupData.restaurantName,
                                description: pendingSignupData.description,
                                cuisine: pendingSignupData.cuisine,
                                address: pendingSignupData.address,
                                phone: pendingSignupData.phone,
                                signupFeeStatus: 'paid', // Mark as paid!
                                paymentMethod: 'chapa'
                            });

                            if (regResult.success) {
                                setStatus('success');
                                setMessage('Payment successful! Your restaurant account has been created and activated.');
                                setPaymentDetails(result.data);
                                toast.success('Your account has been created successfully!');

                                // Clear all pending data only on success
                                localStorage.removeItem('pendingRestaurantSignup');
                            } else {
                                console.error('Account creation failed:', regResult.error);
                                setStatus('error');
                                setMessage(`Payment was verified, but we couldn't create your account: ${regResult.error}. Please contact support with Ref: ${tx_ref}`);
                            }
                        } catch (regError) {
                            console.error('Registration runtime error:', regError);
                            setStatus('error');
                            setMessage(`Payment was successful, but we encountered an error: ${regError.message}. Ref: ${tx_ref}`);
                            return;
                        }
                    } else if (existingRestaurantId) {
                        // LEGACY FLOW: Account already exists, just activate it
                        setStatus('success');
                        setMessage('Payment successful! Your restaurant account has been activated.');
                        setPaymentDetails(result.data);

                        if (result.activationData) {
                            try {
                                await activateRestaurant(existingRestaurantId, result.activationData);
                                toast.success('Restaurant account activated successfully!');
                            } catch (activationError) {
                                console.error('Activation error:', activationError);
                                toast.warning('Payment verified but activation pending. Please contact support.');
                            }
                        }
                    } else {
                        setStatus('error');
                        setMessage('Payment verified, but no registration data found. Please contact support with your transaction reference.');
                        return;
                    }

                    // Clear legacy localStorage items
                    localStorage.removeItem('pendingRestaurantId');
                    localStorage.removeItem('pendingRestaurantEmail');

                } else {
                    setStatus('failed');
                    setMessage('Payment was not successful. Please try again or contact support.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('Error verifying payment. Please contact support with your transaction reference.');
            }
        };

        verify();
    }, [searchParams]);

    const handleRetryPayment = () => {
        // Clear localStorage and redirect to register
        localStorage.removeItem('pendingRestaurantId');
        localStorage.removeItem('pendingRestaurantEmail');
        localStorage.removeItem('pendingRestaurantSignup');
        navigate('/register');
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-5 text-center">
                                {status === 'verifying' && (
                                    <>
                                        <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3rem', height: '3rem' }}>
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h3 className="mb-3">Verifying Payment...</h3>
                                        <p className="text-muted">Please wait while we confirm your transaction.</p>
                                    </>
                                )}

                                {status === 'success' && (
                                    <>
                                        <div className="mb-4 text-success">
                                            <i className="fas fa-check-circle" style={{ fontSize: '4rem' }}></i>
                                        </div>
                                        <h3 className="text-success mb-4">Payment Successful!</h3>
                                        <p className="lead mb-4">{message}</p>

                                        <div className="receipt-details text-start bg-light p-4 rounded mb-4 border">
                                            <h5 className="border-bottom pb-3 mb-3">
                                                <i className="fas fa-file-invoice me-2"></i>
                                                Transaction Receipt
                                            </h5>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">Transaction Ref:</div>
                                                <div className="col-7 text-break">{searchParams.get('tx_ref')}</div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">Date:</div>
                                                <div className="col-7">{new Date().toLocaleString()}</div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">Amount:</div>
                                                <div className="col-7">5,000 ETB</div>
                                            </div>
                                            <div className="row mb-2">
                                                <div className="col-5 fw-bold">Email:</div>
                                                <div className="col-7 text-break">{restaurantEmail}</div>
                                            </div>
                                            <div className="row">
                                                <div className="col-5 fw-bold">Status:</div>
                                                <div className="col-7">
                                                    <span className="badge bg-success">Paid & Activated</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="alert alert-success mb-4">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Your restaurant account is now active! You can login and start managing your restaurant.
                                        </div>

                                        <div className="d-grid gap-2">
                                            <Link to="/login" className="btn btn-primary btn-lg">
                                                <i className="fas fa-sign-in-alt me-2"></i>
                                                Login to Dashboard
                                            </Link>
                                            <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                                                <i className="fas fa-print me-2"></i>
                                                Print Receipt
                                            </button>
                                        </div>
                                    </>
                                )}

                                {(status === 'failed' || status === 'error') && (
                                    <>
                                        <div className="mb-4 text-danger">
                                            <i className="fas fa-times-circle" style={{ fontSize: '4rem' }}></i>
                                        </div>
                                        <h3 className="text-danger mb-4">Payment {status === 'failed' ? 'Failed' : 'Error'}</h3>
                                        <p className="lead mb-4">{message}</p>

                                        {searchParams.get('tx_ref') && (
                                            <div className="alert alert-warning mb-4">
                                                <strong>Transaction Reference:</strong><br />
                                                <code className="text-dark">{searchParams.get('tx_ref')}</code>
                                                <p className="mb-0 mt-2 small">
                                                    Please save this reference for support inquiries.
                                                </p>
                                            </div>
                                        )}

                                        <div className="d-grid gap-2">
                                            <button className="btn btn-primary btn-lg" onClick={handleRetryPayment}>
                                                <i className="fas fa-redo me-2"></i>
                                                Try Again
                                            </button>
                                            <Link to="/" className="btn btn-outline-secondary">
                                                <i className="fas fa-home me-2"></i>
                                                Go to Home
                                            </Link>
                                        </div>

                                        <div className="mt-4">
                                            <p className="small text-muted">
                                                Need help? Contact support at{' '}
                                                <a href="mailto:support@foodexpress.com">support@foodexpress.com</a>
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantPaymentResult;

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { orderService, cartService } from '../../services/databaseService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const PaymentResult = () => {
    const { currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const [orderData, setOrderData] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        const verify = async () => {
            const tx_ref = searchParams.get('tx_ref') || searchParams.get('trx_ref');

            if (!tx_ref) {
                setStatus('error');
                setMessage('No transaction reference found');
                return;
            }

            try {
                const result = await paymentService.verifyPayment(tx_ref);

                if (result.status === 'success') {
                    setStatus('success');
                    setMessage('Payment successful! Your order has been confirmed.');
                    setPaymentDetails(result.data);

                    // Here you might want to update the order status in Firestore if not already done via webhook
                    // But for this flow, we assume the initial creation set it to pending
                    toast.success('Payment verified successfully');

                    // Fetch the order ID using the transaction reference

                    const order = await orderService.getByTxRef(tx_ref);

                    if (order && order.id) {
                        setOrderData(order);
                        try {
                            // Update order status to 'placed' (confirmed)
                            if (order.status === 'pending' || order.status === 'unpaid') {
                                await orderService.updateStatus(order.id, 'placed', 'system', 'Payment confirmed via Chapa');
                            }

                            // Clear the user's cart
                            if (currentUser?.uid) {
                                await cartService.clearCart(currentUser.uid);
                            }
                        } catch (err) {
                            console.error("Error finalizing order:", err);
                        }

                        // No auto-redirect anymore - let user choose
                    } else {
                        // If order not found, maybe show error or just stay
                        setMessage('Payment verified, but order details not found immediately.');
                    }

                } else {
                    setStatus('failed');
                    setMessage('Payment failed or was cancelled.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('Error verifying payment. Please contact support.');
            }
        };

        verify();
    }, [searchParams, navigate]);

    return (
        <div className="container mt-5 text-center">
            <div className="card shadow-sm p-5 mx-auto" style={{ maxWidth: '500px' }}>
                {status === 'verifying' && (
                    <>
                        <div className="spinner-border text-primary mb-3" role="status"></div>
                        <h4>Verifying Payment...</h4>
                        <p className="text-muted">Please wait while we confirm your transaction.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mb-3 text-success d-print-none">
                            <i className="fas fa-check-circle fa-4x"></i>
                        </div>
                        <h4 className="text-success mb-4">Payment Successful!</h4>

                        <div className="receipt-details text-start bg-light p-3 rounded mb-4 border">
                            <h5 className="border-bottom pb-2 mb-3">Transaction Receipt</h5>
                            <p className="mb-1"><strong>Ref:</strong> {searchParams.get('tx_ref')}</p>
                            <p className="mb-1"><strong>Date:</strong> {new Date().toLocaleString()}</p>
                            {orderData && (
                                <>
                                    <p className="mb-1"><strong>Order #:</strong> {orderData.orderNumber || orderData.id?.slice(0, 8)}</p>
                                    <p className="mb-1"><strong>Amount:</strong> {orderData.total} ETB</p>
                                    <p className="mb-0"><strong>Status:</strong> Paid</p>
                                </>
                            )}

                            {paymentDetails?.receipt_url && (
                                <div className="mt-3 pt-3 border-top">
                                    <div className="d-grid">
                                        <a
                                            href={paymentDetails.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-success btn-sm"
                                        >
                                            <i className="fas fa-file-invoice me-2"></i>
                                            View Official Chapa Receipt
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="d-grid gap-2 d-md-block d-print-none">
                            <button className="btn btn-secondary me-md-2 mb-2 mb-md-0" onClick={() => window.print()}>
                                <i className="fas fa-print me-2"></i>
                                Print / Save Receipt
                            </button>

                            {orderData?.id && (
                                <a
                                    href={`/customer?view=tracking&orderId=${orderData.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                >
                                    <i className="fas fa-map-marker-alt me-2"></i>
                                    Track Order (New Tab)
                                </a>
                            )}
                        </div>

                        <div className="mt-3 d-print-none">
                            <button className="btn btn-link text-decoration-none" onClick={() => navigate('/')}>
                                Return to Home
                            </button>
                        </div>
                    </>
                )}

                {(status === 'failed' || status === 'error') && (
                    <>
                        <div className="mb-3 text-danger">
                            <i className="fas fa-times-circle fa-4x"></i>
                        </div>
                        <h4 className="text-danger">Payment Failed</h4>
                        <p>{message}</p>
                        <div className="d-flex gap-2 justify-content-center mt-3">
                            <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                Go Home
                            </button>
                            <button className="btn btn-outline-primary" onClick={() => navigate(-1)}>
                                Try Again
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentResult;

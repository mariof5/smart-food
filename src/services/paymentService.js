// paymentService.js - Updated for Production
const isProduction = process.env.NODE_ENV === 'production';

// Dynamic API URL based on environment
const API_URL = isProduction
    ? 'https://smart-ood-server.onrender.com/api'  // Replace with your actual Render URL
    : 'http://localhost:5000/api';

export const paymentService = {
    // Order payment methods
    initializePayment: async (orderData) => {
        try {
            console.log('Initializing payment with:', orderData);
            console.log('API URL:', `${API_URL}/pay`);

            const response = await fetch(`${API_URL}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();
            console.log('Payment response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Payment initialization failed');
            }

            return data;
        } catch (error) {
            console.error("Payment Init Error:", error);
            throw error;
        }
    },

    verifyPayment: async (tx_ref) => {
        try {
            const response = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transaction_id: tx_ref })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Payment verification failed');
            }

            return data;
        } catch (error) {
            console.error("Payment Verify Error:", error);
            throw error;
        }
    },

    // Restaurant signup payment methods
    initializeRestaurantSignup: async (restaurantData) => {
        try {
            console.log('Initializing restaurant signup payment:', restaurantData);
            console.log('API URL:', `${API_URL}/restaurant-signup/initialize`);

            const response = await fetch(`${API_URL}/restaurant-signup/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(restaurantData)
            });

            const data = await response.json();
            console.log('Restaurant signup payment response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Restaurant signup payment initialization failed');
            }

            return data;
        } catch (error) {
            console.error("Restaurant Signup Payment Init Error:", error);
            throw error;
        }
    },

    verifyRestaurantSignup: async (tx_ref, restaurantId) => {
        try {
            console.log('Verifying restaurant signup payment:', { tx_ref, restaurantId });

            const response = await fetch(`${API_URL}/restaurant-signup/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tx_ref, restaurantId })
            });

            const data = await response.json();
            console.log('Restaurant signup verification response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Restaurant signup payment verification failed');
            }

            return data;
        } catch (error) {
            console.error("Restaurant Signup Payment Verify Error:", error);
            throw error;
        }
    }
};
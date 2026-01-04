const API_URL = 'http://localhost:5000/api';

export const paymentService = {
    initializePayment: async (orderData) => {
        try {
            const response = await fetch(`${API_URL}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            return data;
        } catch (error) {
            console.error("Payment Init Error:", error);
            throw error;
        }
    },

    verifyPayment: async (tx_ref) => {
        try {
            const response = await fetch(`${API_URL}/verify/${tx_ref}`);
            const data = await response.json();

            if (!response.ok) {
                throw data;
            }

            return data;
        } catch (error) {
            console.error("Payment Verify Error:", error);
            throw error;
        }
    }
};

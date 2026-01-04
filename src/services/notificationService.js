import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Notification service for SMS, Email, and Push notifications
export const notificationService = {
  // Send SMS notification
  sendSMS: async (phoneNumber, message, type = 'order_update') => {
    try {
      // In production, this would call a Firebase Cloud Function
      // that integrates with SMS providers like Twilio, AWS SNS, etc.

      const sendSMSFunction = httpsCallable(functions, 'sendSMS');
      const result = await sendSMSFunction({
        phoneNumber: phoneNumber,
        message: message,
        type: type
      });

      return { success: true, messageId: result.data.messageId };
    } catch (error) {
      console.error('Error sending SMS:', error);

      // Fallback: Log to console for development
      console.log(`SMS to ${phoneNumber}: ${message}`);

      return { success: false, error: error.message };
    }
  },

  // Send email notification
  sendEmail: async (email, subject, htmlContent, type = 'order_update') => {
    try {
      const sendEmailFunction = httpsCallable(functions, 'sendEmail');
      const result = await sendEmailFunction({
        to: email,
        subject: subject,
        html: htmlContent,
        type: type
      });

      return { success: true, messageId: result.data.messageId };
    } catch (error) {
      console.error('Error sending email:', error);

      // Fallback: Log to console for development
      console.log(`Email to ${email}: ${subject}`);

      return { success: false, error: error.message };
    }
  },

  // Send push notification
  sendPushNotification: async (userId, title, body, data = {}) => {
    try {
      const sendPushFunction = httpsCallable(functions, 'sendPushNotification');
      const result = await sendPushFunction({
        userId: userId,
        title: title,
        body: body,
        data: data
      });

      return { success: true, messageId: result.data.messageId };
    } catch (error) {
      console.error('Error sending push notification:', error);

      // Fallback: Browser notification for development
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: body });
      }

      return { success: false, error: error.message };
    }
  },

  // Request notification permissions
  requestNotificationPermission: async () => {
    try {
      if (!('Notification' in window)) {
        return { success: false, error: 'Notifications not supported' };
      }

      if (Notification.permission === 'granted') {
        return { success: true, permission: 'granted' };
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return { success: permission === 'granted', permission };
      }

      return { success: false, permission: 'denied' };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { success: false, error: error.message };
    }
  },

  // Order-specific notifications
  orderNotifications: {
    // Notify customer of order status change
    notifyCustomer: async (order, newStatus) => {
      const messages = {
        'confirmed': {
          sms: `Your order ${order.orderNumber} has been confirmed! Estimated delivery: ${order.estimatedDelivery}`,
          email: {
            subject: `Order Confirmed - ${order.orderNumber}`,
            html: `
              <h2>Order Confirmed!</h2>
              <p>Your order ${order.orderNumber} has been confirmed by the restaurant.</p>
              <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>
              <p><strong>Items:</strong></p>
              <ul>
                ${order.items.map(item => `<li>${item.name} x${item.quantity}</li>`).join('')}
              </ul>
              <p><strong>Total:</strong> ${order.total} ETB</p>
            `
          },
          push: {
            title: 'Order Confirmed!',
            body: `Your order ${order.orderNumber} has been confirmed`
          }
        },
        'preparing': {
          sms: `Great news! Your order ${order.orderNumber} is now being prepared. We'll notify you when it's ready!`,
          email: {
            subject: `Order Being Prepared - ${order.orderNumber}`,
            html: `
              <h2>Your Order is Being Prepared!</h2>
              <p>The restaurant is now preparing your order ${order.orderNumber}.</p>
              <p>We'll notify you as soon as it's ready for delivery!</p>
            `
          },
          push: {
            title: 'Order Being Prepared!',
            body: `Your order ${order.orderNumber} is now being prepared`
          }
        },
        'ready': {
          sms: `Your order ${order.orderNumber} is ready! Our delivery partner will pick it up shortly.`,
          email: {
            subject: `Order Ready for Pickup - ${order.orderNumber}`,
            html: `
              <h2>Order Ready!</h2>
              <p>Your order ${order.orderNumber} is ready and waiting for pickup.</p>
              <p>Our delivery partner will collect it shortly and bring it to you!</p>
            `
          },
          push: {
            title: 'Order Ready!',
            body: `Your order ${order.orderNumber} is ready for pickup`
          }
        },
        'picked': {
          sms: `Your order ${order.orderNumber} is on the way! Track your delivery in the app.`,
          email: {
            subject: `Order Out for Delivery - ${order.orderNumber}`,
            html: `
              <h2>Order On The Way!</h2>
              <p>Your order ${order.orderNumber} has been picked up and is on the way to you!</p>
              <p>You can track your delivery in real-time through the app.</p>
            `
          },
          push: {
            title: 'Order On The Way!',
            body: `Your order ${order.orderNumber} is being delivered`
          }
        },
        'delivered': {
          sms: `Your order ${order.orderNumber} has been delivered! Enjoy your meal and thank you for choosing us!`,
          email: {
            subject: `Order Delivered - ${order.orderNumber}`,
            html: `
              <h2>Order Delivered!</h2>
              <p>Your order ${order.orderNumber} has been successfully delivered!</p>
              <p>We hope you enjoy your meal. Thank you for choosing Food Express!</p>
              <p>Please rate your experience in the app.</p>
            `
          },
          push: {
            title: 'Order Delivered!',
            body: `Your order ${order.orderNumber} has been delivered. Enjoy!`
          }
        }
      };

      const notification = messages[newStatus];
      if (!notification) return;

      try {
        // Send SMS
        if (order.phoneNumber) {
          await notificationService.sendSMS(order.phoneNumber, notification.sms, 'order_update');
        }

        // Send Email
        if (order.customerEmail) {
          await notificationService.sendEmail(
            order.customerEmail,
            notification.email.subject,
            notification.email.html,
            'order_update'
          );
        }

        // Send Push Notification
        if (order.customerId) {
          await notificationService.sendPushNotification(
            order.customerId,
            notification.push.title,
            notification.push.body,
            { orderId: order.id, orderNumber: order.orderNumber }
          );
        }

        return { success: true };
      } catch (error) {
        console.error('Error sending order notifications:', error);
        return { success: false, error: error.message };
      }
    },

    // Notify restaurant of new order
    notifyRestaurant: async (order) => {
      try {
        const message = `New order received! Order ${order.orderNumber} - ${order.items.length} items - ${order.total} ETB`;

        // SMS to restaurant
        if (order.restaurantPhone) {
          await notificationService.sendSMS(order.restaurantPhone, message, 'new_order');
        }

        // Push notification to restaurant owner
        if (order.restaurantOwnerId) {
          await notificationService.sendPushNotification(
            order.restaurantOwnerId,
            'New Order Received!',
            `Order ${order.orderNumber} - ${order.total} ETB`,
            { orderId: order.id, orderNumber: order.orderNumber }
          );
        }

        return { success: true };
      } catch (error) {
        console.error('Error notifying restaurant:', error);
        return { success: false, error: error.message };
      }
    },

    // Notify delivery personnel
    notifyDelivery: async (order, deliveryPersonId) => {
      try {
        const message = `New delivery assignment: Order ${order.orderNumber} from ${order.restaurantName} to ${order.deliveryAddress}`;

        // Push notification to delivery person
        await notificationService.sendPushNotification(
          deliveryPersonId,
          'New Delivery Assignment',
          message,
          { orderId: order.id, orderNumber: order.orderNumber }
        );

        return { success: true };
      } catch (error) {
        console.error('Error notifying delivery person:', error);
        return { success: false, error: error.message };
      }
    }
  }
};

export default notificationService;
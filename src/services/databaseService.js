import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import { getFriendlyErrorMessage } from '../utils/errorHandlers';

// Storage Service (Base64 Implementation)
export const storageService = {
  uploadImage: async (file, path) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress to JPEG at 0.7 quality to keep size low for Firestore
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ success: true, url: dataUrl });
        };
        img.onerror = (error) => reject({ success: false, error: 'Image load failed' });
      };
      reader.onerror = (error) => reject({ success: false, error: 'File reading failed' });
    });
  }
};

// Collections
const COLLECTIONS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  MENU_ITEMS: 'menu_items',
  ORDERS: 'orders',
  CARTS: 'carts',
  DELIVERY_PERSONNEL: 'delivery_personnel',
  REFUNDS: 'refunds',
  DISPUTES: 'disputes',
  REVIEWS: 'reviews'
};

// Restaurant Services
export const restaurantService = {
  // Get all restaurants
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.RESTAURANTS), where('isActive', '==', true))
      );
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting restaurants:', error);
      return [];
    }
  },

  // Get restaurant by ID
  getById: async (id) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.RESTAURANTS, id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return null;
    }
  },

  // Update restaurant
  update: async (id, data) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.RESTAURANTS, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  }
};

// Menu Services
export const menuService = {
  // Get menu items for restaurant
  getByRestaurant: async (restaurantId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.MENU_ITEMS),
          where('restaurantId', '==', restaurantId),
          where('isActive', '==', true)
        )
      );
      // Ensure available defaulting if missing
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          available: data.available !== undefined ? data.available : true
        };
      });
    } catch (error) {
      console.error('Error getting menu items:', error);
      return [];
    }
  },

  // Add menu item
  add: async (restaurantId, itemData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.MENU_ITEMS), {
        restaurantId,
        ...itemData,
        isActive: true,
        available: true,
        createdAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding menu item:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Update menu item
  update: async (id, data) => {
    try {
      // Ensure available is updated if passed
      await updateDoc(doc(db, COLLECTIONS.MENU_ITEMS, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating menu item:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Delete menu item
  delete: async (id) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.MENU_ITEMS, id), {
        isActive: false,
        deletedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  }
};

// Cart Services
export const cartService = {
  getCart: async (userId) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.CARTS, userId));
      return docSnap.exists() ? docSnap.data().items || [] : [];
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  },

  saveCart: async (userId, items) => {
    try {
      await setDoc(doc(db, COLLECTIONS.CARTS, userId), {
        items,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving cart:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  clearCart: async (userId) => {
    try {
      await setDoc(doc(db, COLLECTIONS.CARTS, userId), { items: [] });
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false };
    }
  }
};

// Enhanced Order Services
export const orderService = {
  // Create new order
  create: async (orderData) => {
    try {
      const orderNumber = '#' + Math.floor(Math.random() * 10000);
      const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
        orderNumber,
        ...orderData,
        status: 'placed',
        canCancel: true,
        canModify: true,
        cancellationDeadline: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        modificationDeadline: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: serverTimestamp(),
        statusHistory: [{
          status: 'placed',
          timestamp: new Date(),
          note: 'Order placed successfully'
        }]
      });
      return { success: true, id: docRef.id, orderNumber };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason, cancelledBy) => {
    try {
      const orderDoc = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
      if (!orderDoc.exists()) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderDoc.data();

      // Check if order can be cancelled
      if (!order.canCancel || order.status === 'delivered' || order.status === 'cancelled') {
        return { success: false, error: 'Order cannot be cancelled at this stage' };
      }

      // Check cancellation deadline
      const deadline = order.cancellationDeadline?.toDate() || new Date(0);
      if (new Date() > deadline && order.status !== 'placed') {
        return { success: false, error: 'Cancellation deadline has passed' };
      }

      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: cancelledBy,
        cancelledAt: serverTimestamp(),
        canCancel: false,
        statusHistory: arrayUnion({
          status: 'cancelled',
          timestamp: new Date(),
          note: `Order cancelled: ${reason} `,
          updatedBy: cancelledBy
        })
      });

      // If payment was made, initiate refund
      if (order.paymentMethod !== 'cash') {
        await refundService.initiateRefund(orderId, order.total, 'Order cancelled', cancelledBy);
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Modify order items and quantities
  modifyOrder: async (orderId, newItems, newSubtotal, newTotal, modifiedBy) => {
    try {
      const orderDoc = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
      if (!orderDoc.exists()) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderDoc.data();

      // Check if order can be modified
      if (!order.canModify || ['ready', 'picked', 'delivered', 'cancelled'].includes(order.status)) {
        return { success: false, error: 'Order cannot be modified at this stage' };
      }

      // Check modification deadline
      const deadline = order.modificationDeadline?.toDate() || new Date(0);
      if (new Date() > deadline && order.status !== 'placed') {
        return { success: false, error: 'Modification deadline has passed' };
      }

      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        items: newItems,
        subtotal: newSubtotal,
        total: newTotal,
        modifiedAt: serverTimestamp(),
        modifiedBy: modifiedBy,
        statusHistory: arrayUnion({
          status: order.status,
          timestamp: new Date(),
          note: 'Order items modified by customer',
          updatedBy: modifiedBy
        })
      });

      return { success: true };
    } catch (error) {
      console.error('Error modifying order:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },



  // Get orders by customer
  getByCustomer: async (customerId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.ORDERS),
          where('customerId', '==', customerId)
        )
      );
      const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return orders.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error getting customer orders:', error);
      return [];
    }
  },

  // Get orders by restaurant
  getByRestaurant: async (restaurantId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.ORDERS),
          where('restaurantId', '==', restaurantId)
        )
      );
      const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return orders.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error getting restaurant orders:', error);
      return [];
    }
  },

  // Update order status
  updateStatus: async (orderId, status, updatedBy, note = '') => {
    try {
      const updates = {
        status,
        updatedBy,
        updatedAt: serverTimestamp(),
        [`${status} At`]: serverTimestamp(),
        statusHistory: arrayUnion({
          status,
          timestamp: new Date(),
          note: note || `Order status updated to ${status} `,
          updatedBy
        })
      };

      // Update cancellation and modification permissions based on status
      if (['preparing', 'ready', 'picked'].includes(status)) {
        updates.canCancel = false;
      }
      
      if (['ready', 'picked', 'delivered'].includes(status)) {
        updates.canModify = false;
      }

      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Listen to order changes (real-time)
  listenToOrders: (restaurantId, callback) => {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('restaurantId', '==', restaurantId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      callback(orders);
    });
  },

  // Listen to customer orders (real-time)
  listenToCustomerOrders: (customerId, callback) => {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('customerId', '==', customerId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      callback(orders);
    });
  },

  // Listen to specific order (real-time tracking)
  listenToOrder: (orderId, callback) => {
    return onSnapshot(doc(db, COLLECTIONS.ORDERS, orderId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  // Get order by transaction reference
  getByTxRef: async (tx_ref) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('tx_ref', '==', tx_ref)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting order by tx_ref:', error);
      return null;
    }
  }
};

// Refund Service
export const refundService = {
  // Initiate refund
  initiateRefund: async (orderId, amount, reason, initiatedBy) => {
    try {
      const refundId = uuidv4();
      await addDoc(collection(db, COLLECTIONS.REFUNDS), {
        refundId,
        orderId,
        amount,
        reason,
        status: 'pending',
        initiatedBy,
        createdAt: serverTimestamp(),
        processedAt: null,
        processedBy: null
      });

      return { success: true, refundId };
    } catch (error) {
      console.error('Error initiating refund:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Process refund
  processRefund: async (refundId, status, processedBy, note = '') => {
    try {
      await updateDoc(doc(db, COLLECTIONS.REFUNDS, refundId), {
        status,
        processedBy,
        processedAt: serverTimestamp(),
        note
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Get refunds by customer
  getByCustomer: async (customerId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.REFUNDS),
          where('initiatedBy', '==', customerId)
        )
      );
      const refunds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return refunds.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error getting customer refunds:', error);
      return [];
    }
  }
};

// Dispute Service
export const disputeService = {
  // Create dispute
  create: async (orderId, type, description, evidence, createdBy) => {
    try {
      const disputeId = uuidv4();
      await addDoc(collection(db, COLLECTIONS.DISPUTES), {
        disputeId,
        orderId,
        type, // 'quality', 'delivery', 'billing', 'other'
        description,
        evidence, // Array of evidence (photos, etc.)
        status: 'open',
        priority: 'medium',
        createdBy,
        assignedTo: null,
        resolution: null,
        createdAt: serverTimestamp(),
        resolvedAt: null,
        messages: []
      });

      return { success: true, disputeId };
    } catch (error) {
      console.error('Error creating dispute:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Add message to dispute
  addMessage: async (disputeId, message, sender) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.DISPUTES, disputeId), {
        messages: arrayUnion({
          id: uuidv4(),
          message,
          sender,
          timestamp: serverTimestamp()
        }),
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding dispute message:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Resolve dispute
  resolve: async (disputeId, resolution, resolvedBy) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.DISPUTES, disputeId), {
        status: 'resolved',
        resolution,
        resolvedBy,
        resolvedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Get disputes by customer
  getByCustomer: async (customerId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.DISPUTES),
          where('createdBy', '==', customerId)
        )
      );
      const disputes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return disputes.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error getting customer disputes:', error);
      return [];
    }
  }
};

// Delivery Service
export const deliveryService = {
  // Get available orders for delivery (status: ready)
  getAvailableOrders: (callback) => {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('status', '==', 'ready')
    );

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      callback(orders);
    });
  },

  // Get active deliveries for specific driver
  getActiveDeliveries: (driverId, callback) => {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('driverId', '==', driverId),
      where('status', 'in', ['picked', 'delivering'])
    );

    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      callback(orders);
    });
  },

  // Accept delivery
  acceptDelivery: async (orderId, driverId, driverName) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        status: 'picked',
        driverId,
        driverName,
        pickedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'picked',
          timestamp: new Date(),
          note: `Order picked up by ${driverName}`,
          updatedBy: driverId
        })
      });
      return { success: true };
    } catch (error) {
      console.error('Error accepting delivery:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Start delivery (transition from picked to delivering)
  startDelivery: async (orderId, driverId, driverName) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        status: 'delivering',
        deliveringAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'delivering',
          timestamp: new Date(),
          note: `${driverName} is on the way`,
          updatedBy: driverId
        })
      });
      return { success: true };
    } catch (error) {
      console.error('Error starting delivery:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Complete delivery
  completeDelivery: async (orderId, driverId) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        canCancel: false,
        canModify: false,
        statusHistory: arrayUnion({
          status: 'delivered',
          timestamp: new Date(),
          note: 'Order delivered successfully',
          updatedBy: driverId
        })
      });
      return { success: true };
    } catch (error) {
      console.error('Error completing delivery:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Get driver stats
  getDriverStats: async (driverId) => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.ORDERS),
          where('driverId', '==', driverId),
          where('status', '==', 'delivered')
        )
      );

      const deliveredOrders = querySnapshot.docs.map(doc => doc.data());
      const totalDeliveries = deliveredOrders.length;

      // Calculate earnings (assuming 80% of delivery fee goes to driver)
      const earnings = deliveredOrders.reduce((sum, order) => sum + (order.deliveryFee * 0.8), 0);

      // Calculate today's deliveries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDeliveries = deliveredOrders.filter(order => {
        const orderDate = order.deliveredAt?.toDate() || new Date(0);
        return orderDate >= today;
      }).length;

      return {
        totalDeliveries,
        earnings,
        todayDeliveries
      };
    } catch (error) {
      console.error('Error getting driver stats:', error);
      return { totalDeliveries: 0, earnings: 0, todayDeliveries: 0 };
    }
  },

  // Update delivery personnel info
  update: async (driverId, data) => {
    try {
      // Update delivery personnel document if it exists
      const deliveryPersonnelRef = doc(db, COLLECTIONS.DELIVERY_PERSONNEL, driverId);
      const deliveryDoc = await getDoc(deliveryPersonnelRef);
      
      if (deliveryDoc.exists()) {
        await updateDoc(deliveryPersonnelRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create delivery personnel document if it doesn't exist
        await setDoc(deliveryPersonnelRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating delivery personnel:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Get delivery personnel info
  getById: async (driverId) => {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.DELIVERY_PERSONNEL, driverId));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error getting delivery personnel:', error);
      return null;
    }
  }
};

// Admin Services
export const adminService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Get all orders
  getAllOrders: async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  },

  // Update user status
  updateUserStatus: async (userId, isActive) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        isActive,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Add user programmatically
  addUser: async (userData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        ...userData,
        isActive: true,
        isDeleted: false,
        createdAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding user:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Get platform analytics
  getPlatformAnalytics: async () => {
    try {
      const [users, orders, restaurants] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.USERS)),
        getDocs(collection(db, COLLECTIONS.ORDERS)),
        getDocs(collection(db, COLLECTIONS.RESTAURANTS))
      ]);

      const usersData = users.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const ordersData = orders.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const restaurantsData = restaurants.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate popular items
      const itemCount = {};
      ordersData.forEach(order => {
        order.items?.forEach(item => {
          const itemKey = `${item.name} (${item.restaurantName || 'Unknown'})`;
          itemCount[itemKey] = (itemCount[itemKey] || 0) + item.quantity;
        });
      });

      const popularItems = Object.entries(itemCount)
        .map(([item, count]) => ({ item, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalUsers: usersData.filter(u => !u.isDeleted).length,
        activeUsers: usersData.filter(u => u.isActive && !u.isDeleted).length,
        totalOrders: ordersData.length,
        totalRevenue: ordersData.reduce((sum, order) => sum + (order.total || 0), 0),
        activeRestaurants: restaurantsData.filter(r => r.isActive).length,
        totalRestaurants: restaurantsData.length,
        popularItems,
        usersByRole: {
          customers: usersData.filter(u => u.role === 'customer' && !u.isDeleted).length,
          restaurants: usersData.filter(u => u.role === 'restaurant' && !u.isDeleted).length,
          delivery: usersData.filter(u => u.role === 'delivery' && !u.isDeleted).length,
          admin: usersData.filter(u => u.role === 'admin' && !u.isDeleted).length
        }
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeRestaurants: 0,
        totalRestaurants: 0,
        popularItems: [],
        usersByRole: { customers: 0, restaurants: 0, delivery: 0, admin: 0 }
      };
    }
  }
};

// Review & Rating Services
export const reviewService = {
  // Add a review for restaurant and delivery
  addReview: async (orderId, reviewData) => {
    try {
      const {
        customerId,
        restaurantId,
        driverId,
        restaurantRating,
        deliveryRating,
        comment
      } = reviewData;

      // 1. Save the review document
      await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        orderId,
        customerId,
        restaurantId,
        driverId,
        restaurantRating,
        deliveryRating,
        comment,
        createdAt: serverTimestamp()
      });

      // 2. Mark order as rated
      await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        isRated: true,
        ratedAt: serverTimestamp()
      });

      // 3. Update Restaurant Rating
      if (restaurantId) {
        const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
        const restaurantDoc = await getDoc(restaurantRef);
        if (restaurantDoc.exists()) {
          const data = restaurantDoc.data();
          const currentRating = data.rating || 0;
          const totalReviews = data.totalReviews || 0;
          const newTotalReviews = totalReviews + 1;
          const newRating = ((currentRating * totalReviews) + restaurantRating) / newTotalReviews;

          await updateDoc(restaurantRef, {
            rating: newRating,
            totalReviews: newTotalReviews
          });
        }
      }

      // 4. Update Driver Rating
      if (driverId) {
        // Find driver by ID (assuming driverId is the auth uid)
        // Note: You might need to adjust based on how delivery personnel are stored
        const driverQuery = query(collection(db, COLLECTIONS.USERS), where('uid', '==', driverId));
        const driverSnapshot = await getDocs(driverQuery);

        if (!driverSnapshot.empty) {
          const driverDocRef = driverSnapshot.docs[0].ref;
          const driverData = driverSnapshot.docs[0].data();
          const currentRating = driverData.rating || 0;
          const totalReviews = driverData.totalReviews || 0;
          const newTotalReviews = totalReviews + 1;
          const newRating = ((currentRating * totalReviews) + deliveryRating) / newTotalReviews;

          await updateDoc(driverDocRef, {
            rating: newRating,
            totalReviews: newTotalReviews
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding review:', error);
      return { success: false, error: getFriendlyErrorMessage(error) };
    }
  },

  // Get reviews for a restaurant
  getRestaurantReviews: async (restaurantId) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting restaurant reviews:', error);
      return [];
    }
  }
};

// Analytics Services
export const analyticsService = {
  // Get restaurant analytics
  getRestaurantStats: async (restaurantId) => {
    try {
      const orders = await orderService.getByRestaurant(restaurantId);
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pendingOrders = orders.filter(o => ['placed', 'preparing'].includes(o.status)).length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders: orders.filter(o => o.status === 'delivered').length,
        cancelledOrders,
        cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting restaurant stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        cancellationRate: 0
      };
    }
  }
};

export default {
  restaurantService,
  menuService,
  orderService,
  refundService,
  disputeService,
  analyticsService,
  deliveryService,
  adminService,
  reviewService
};
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant', 
  DELIVERY: 'delivery',
  ADMIN: 'admin'
};

// Register new user
export const registerUser = async (email, password, userData) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: userData.name
    });

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: userData.name,
      role: userData.role || USER_ROLES.CUSTOMER,
      phone: userData.phone || '',
      address: userData.address || '',
      createdAt: new Date().toISOString(),
      isActive: true
    });

    return { success: true, user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    return { 
      success: true, 
      user: {
        ...user,
        userData
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user data
export const getCurrentUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user has required role
export const hasRole = (userData, requiredRole) => {
  return userData && userData.role === requiredRole;
};

// Register restaurant owner
export const registerRestaurant = async (email, password, restaurantData) => {
  try {
    const result = await registerUser(email, password, {
      name: restaurantData.ownerName,
      role: USER_ROLES.RESTAURANT
    });

    if (result.success) {
      // Create restaurant document
      await setDoc(doc(db, 'restaurants', result.user.uid), {
        ownerId: result.user.uid,
        name: restaurantData.name,
        description: restaurantData.description,
        cuisine: restaurantData.cuisine,
        address: restaurantData.address,
        phone: restaurantData.phone,
        deliveryTime: restaurantData.deliveryTime || '30-45 min',
        rating: 0,
        reviews: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }

    return result;
  } catch (error) {
    console.error('Restaurant registration error:', error);
    return { success: false, error: error.message };
  }
};

// Register delivery personnel
export const registerDelivery = async (email, password, deliveryData) => {
  try {
    const result = await registerUser(email, password, {
      name: deliveryData.name,
      role: USER_ROLES.DELIVERY,
      phone: deliveryData.phone
    });

    if (result.success) {
      // Create delivery personnel document
      await setDoc(doc(db, 'delivery_personnel', result.user.uid), {
        userId: result.user.uid,
        name: deliveryData.name,
        phone: deliveryData.phone,
        vehicleType: deliveryData.vehicleType || 'motorcycle',
        licenseNumber: deliveryData.licenseNumber,
        isAvailable: true,
        totalDeliveries: 0,
        rating: 0,
        createdAt: new Date().toISOString()
      });
    }

    return result;
  } catch (error) {
    console.error('Delivery registration error:', error);
    return { success: false, error: error.message };
  }
};
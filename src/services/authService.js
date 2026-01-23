import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getFriendlyErrorMessage } from '../utils/errorHandlers';

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT: 'restaurant',
  DELIVERY: 'delivery',
  ADMIN: 'admin'
};

// Platform Constants
export const PLATFORM_SETTINGS = {
  RESTAURANT_SIGNUP_FEE: 5000,
  DRIVER_COMMISSION_PERCENT: 0.03 // 3%
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
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let userData = null;
    try {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      userData = userDoc.exists() ? userDoc.data() : null;
    } catch (fsError) {
      console.error('Firestore fetch error during login:', fsError);
      // If Firestore fails (e.g. permission denied) but Auth succeeded, 
      // we still return the user but with a warning or null userData
      if (fsError.code === 'permission-denied') {
        return {
          success: false,
          error: "Permission denied while fetching profile. Please check your Firestore Security Rules."
        };
      }
    }

    return {
      success: true,
      user: {
        ...user,
        userData
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: getFriendlyErrorMessage(error) };
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
    const SIGNUP_FEE = 5000; // ETB

    const result = await registerUser(email, password, {
      name: restaurantData.ownerName,
      role: USER_ROLES.RESTAURANT
    });

    if (result.success) {
      // Determine if account should be active based on payment status
      const isActive = restaurantData.signupFeeStatus === 'paid';
      const signupFeePaid = restaurantData.signupFeeStatus === 'paid' ? SIGNUP_FEE : 0;

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
        isActive: isActive,
        signupFeeStatus: restaurantData.signupFeeStatus || 'pending',
        signupFeePaid: signupFeePaid,
        paymentMethod: restaurantData.paymentMethod || 'cash',
        signupFeeDate: isActive ? new Date().toISOString() : null,
        approvalStatus: isActive ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      });
    }

    return result;
  } catch (error) {
    console.error('Restaurant registration error:', error);
    return { success: false, error: getFriendlyErrorMessage(error) };
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
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
};
// Password reset with enhanced error handling and validation
export const resetPassword = async (email) => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      return { success: false, error: 'Email address is required' };
    }

    if (!emailRegex.test(email.trim())) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Send password reset email
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: 'Password reset email sent successfully',
      email: email.trim()
    };
  } catch (error) {
    console.error('Password reset error:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        error: 'No account found with this email address. Please check your email or create a new account.'
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        error: 'The email address format is invalid. Please enter a valid email.'
      };
    } else if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        error: 'Too many password reset requests. Please wait a few minutes before trying again.'
      };
    } else if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }

    return { success: false, error: getFriendlyErrorMessage(error) };
  }
};

// Password strength validation
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteria = {
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  };

  const score = Object.values(criteria).filter(Boolean).length;

  let strength = 'weak';
  let color = '#dc3545'; // Red

  if (score >= 5) {
    strength = 'strong';
    color = '#198754'; // Green
  } else if (score >= 3) {
    strength = 'medium';
    color = '#ffc107'; // Yellow
  }

  return {
    score,
    strength,
    color,
    criteria,
    isValid: score >= 4 // Require at least 4 out of 5 criteria
  };
};

// Enhanced password validation for registration
export const validatePassword = (password) => {
  const validation = validatePasswordStrength(password);

  if (!validation.isValid) {
    const missingCriteria = [];
    if (!validation.criteria.minLength) missingCriteria.push('at least 8 characters');
    if (!validation.criteria.hasUpperCase) missingCriteria.push('one uppercase letter');
    if (!validation.criteria.hasLowerCase) missingCriteria.push('one lowercase letter');
    if (!validation.criteria.hasNumbers) missingCriteria.push('one number');
    if (!validation.criteria.hasSpecialChar) missingCriteria.push('one special character');

    return {
      isValid: false,
      error: `Password must contain ${missingCriteria.join(', ')}`
    };
  }

  return { isValid: true };
};

// Update user profile information
export const updateUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });

    // Also update Firebase Auth profile if name is being updated
    if (profileData.name && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.name
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
};

// Update user password
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user is currently logged in' };
    }

    if (!user.email) {
      return { success: false, error: 'User email not found' };
    }

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Check if current password is provided
    if (!currentPassword || currentPassword.trim() === '') {
      return { success: false, error: 'Current password is required' };
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return { success: false, error: 'New password must be different from current password' };
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    } catch (reauthError) {
      console.error('Reauthentication error:', reauthError);
      if (reauthError.code === 'auth/wrong-password') {
        return { success: false, error: 'Current password is incorrect' };
      } else if (reauthError.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed attempts. Please try again later' };
      } else if (reauthError.code === 'auth/network-request-failed') {
        return { success: false, error: 'Network error. Please check your connection' };
      }
      return { success: false, error: getFriendlyErrorMessage(reauthError) };
    }

    try {
      // Update password
      await updatePassword(user, newPassword);
      return { success: true, message: 'Password updated successfully' };
    } catch (updateError) {
      console.error('Password update error:', updateError);
      return { success: false, error: getFriendlyErrorMessage(updateError) };
    }
  } catch (error) {
    console.error('Password update error:', error);
    return { success: false, error: getFriendlyErrorMessage(error) };
  }
};
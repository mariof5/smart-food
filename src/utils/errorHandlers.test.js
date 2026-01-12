/**
 * Test file for Firebase Error Handlers
 * This file demonstrates how the friendly error messages work
 */

import { getFriendlyErrorMessage, handleFirebaseError, withErrorHandling } from './errorHandlers';

// Mock Firebase errors for testing
const mockErrors = {
  authUserNotFound: {
    code: 'auth/user-not-found',
    message: 'Firebase: There is no user record corresponding to this identifier. The user may have been deleted. (auth/user-not-found).'
  },
  authWrongPassword: {
    code: 'auth/wrong-password',
    message: 'Firebase: The password is invalid or the user does not have a password. (auth/wrong-password).'
  },
  authInvalidEmail: {
    code: 'auth/invalid-email',
    message: 'Firebase: The email address is badly formatted. (auth/invalid-email).'
  },
  authEmailInUse: {
    code: 'auth/email-already-in-use',
    message: 'Firebase: The email address is already in use by another account. (auth/email-already-in-use).'
  },
  authWeakPassword: {
    code: 'auth/weak-password',
    message: 'Firebase: Password should be at least 6 characters (auth/weak-password).'
  },
  authTooManyRequests: {
    code: 'auth/too-many-requests',
    message: 'Firebase: We have blocked all requests from this device due to unusual activity. Try again later. (auth/too-many-requests).'
  },
  authNetworkError: {
    code: 'auth/network-request-failed',
    message: 'Firebase: A network error (such as timeout, interrupted connection or unreachable host) has occurred. (auth/network-request-failed).'
  },
  firestorePermissionDenied: {
    code: 'permission-denied',
    message: 'Missing or insufficient permissions.'
  },
  firestoreUnauthenticated: {
    code: 'unauthenticated',
    message: 'The request was not authenticated. Expected OAuth 2 access token, login cookie or other valid authentication credential.'
  },
  genericError: {
    message: 'Firebase: Some generic error occurred'
  },
  unknownError: {
    code: 'unknown/error-code',
    message: 'Some unknown error'
  }
};

// Test function to demonstrate error handling
export const testErrorHandling = () => {
  console.log('=== Firebase Error Handler Tests ===\n');

  // Test authentication errors
  console.log('Authentication Errors:');
  console.log('User not found:', getFriendlyErrorMessage(mockErrors.authUserNotFound));
  console.log('Wrong password:', getFriendlyErrorMessage(mockErrors.authWrongPassword));
  console.log('Invalid email:', getFriendlyErrorMessage(mockErrors.authInvalidEmail));
  console.log('Email in use:', getFriendlyErrorMessage(mockErrors.authEmailInUse));
  console.log('Weak password:', getFriendlyErrorMessage(mockErrors.authWeakPassword));
  console.log('Too many requests:', getFriendlyErrorMessage(mockErrors.authTooManyRequests));
  console.log('Network error:', getFriendlyErrorMessage(mockErrors.authNetworkError));

  console.log('\nFirestore Errors:');
  console.log('Permission denied:', getFriendlyErrorMessage(mockErrors.firestorePermissionDenied));
  console.log('Unauthenticated:', getFriendlyErrorMessage(mockErrors.firestoreUnauthenticated));

  console.log('\nGeneric Errors:');
  console.log('Generic Firebase error:', getFriendlyErrorMessage(mockErrors.genericError));
  console.log('Unknown error:', getFriendlyErrorMessage(mockErrors.unknownError));
  console.log('Null error:', getFriendlyErrorMessage(null));

  console.log('\n=== Test Complete ===');
};

// Example usage in a React component
export const exampleUsage = {
  // In a login function
  loginExample: async (email, password) => {
    try {
      // Simulate Firebase auth call
      throw mockErrors.authUserNotFound;
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      // This would show: "No account found with this email address."
      console.log('User sees:', friendlyMessage);
      return { success: false, error: friendlyMessage };
    }
  },

  // Using the withErrorHandling wrapper
  registerExample: async (userData) => {
    return await withErrorHandling(async () => {
      // Simulate Firebase registration
      throw mockErrors.authEmailInUse;
    }, 'user registration');
  }
};

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testErrorHandling();
}
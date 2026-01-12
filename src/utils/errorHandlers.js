/**
 * Maps Firebase error codes to human-readable, user-friendly messages.
 * @param {Object} error - The error object from Firebase
 * @returns {string} - A friendly error message
 */
export const getFriendlyErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  const code = error.code || (error.message && error.message.match(/\((auth\/[^)]+)\)/)?.[1]);
  
  switch (code) {
    // Authentication Errors
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/email-already-in-use':
      return 'This email address is already in use.';
    case 'auth/weak-password':
      return 'The password is too weak. It must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completion.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    case 'auth/requires-recent-login':
      return 'Please log out and log back in before changing your password.';
    case 'auth/invalid-credential':
      return 'The provided credentials are invalid.';
    case 'auth/quota-exceeded':
      return 'Email quota exceeded. Please try again later.';
    case 'auth/email-change-needs-verification':
      return 'Email change requires verification.';
    
    // Firestore/Permission Errors
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unauthenticated':
      return 'Please log in to continue.';
    case 'not-found':
      return 'The requested resource was not found.';
    case 'already-exists':
      return 'The resource already exists.';
    case 'deadline-exceeded':
      return 'The operation timed out. Please try again.';
    
    default:
      // Remove 'Firebase:' prefix and any error codes in parentheses for a cleaner message
      if (error.message) {
        let msg = error.message.replace(/^Firebase:\s*/, '');
        msg = msg.replace(/\s*\(.*\)\s*/, '');
        return msg;
      }
      return 'An unexpected error occurred. Please try again.';
  }
};
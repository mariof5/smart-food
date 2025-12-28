import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES, hasRole } from '../services/authService';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, userData } = useAuth();

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If specific role required, check user role
  if (requiredRole && !hasRole(userData, requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Specific protected routes for different roles
export const CustomerRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.CUSTOMER}>
    {children}
  </ProtectedRoute>
);

export const RestaurantRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.RESTAURANT}>
    {children}
  </ProtectedRoute>
);

export const DeliveryRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.DELIVERY}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
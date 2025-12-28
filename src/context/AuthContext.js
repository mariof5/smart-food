import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getCurrentUserData, loginUser, logoutUser, registerUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        const data = await getCurrentUserData(user.uid);
        setCurrentUser(user);
        setUserData(data);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await loginUser(email, password);
    if (result.success) {
      setCurrentUser(result.user);
      setUserData(result.user.userData);
    }
    return result;
  };

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
      setUserData(null);
    }
    return result;
  };

  const register = async (email, password, data) => {
    return await registerUser(email, password, data);
  };

  const value = {
    currentUser,
    userData,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
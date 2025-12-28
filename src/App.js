import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { CustomerRoute, RestaurantRoute, DeliveryRoute, AdminRoute } from './components/ProtectedRoute';

// Components
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './components/HomePage';
import CustomerDashboard from './components/Customer/Dashboard';
import RestaurantDashboard from './components/Restaurant/Dashboard';
import DeliveryDashboard from './components/Delivery/Dashboard';
import AdminDashboard from './components/Admin/Dashboard';
import Unauthorized from './components/Unauthorized';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import './App.css';
import './styles/SmartFoodTheme.css';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route
              path="/customer/*"
              element={
                <CustomerRoute>
                  <CustomerDashboard />
                </CustomerRoute>
              }
            />

            <Route
              path="/restaurant/*"
              element={
                <RestaurantRoute>
                  <RestaurantDashboard />
                </RestaurantRoute>
              }
            />

            <Route
              path="/delivery/*"
              element={
                <DeliveryRoute>
                  <DeliveryDashboard />
                </DeliveryRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
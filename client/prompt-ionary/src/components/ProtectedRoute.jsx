import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useSelector((state) => state.user);
  const location = useLocation();

  // Check both Redux state and localStorage for authentication
  const hasValidToken = token || localStorage.getItem('access_token');

  if (!isAuthenticated && !hasValidToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

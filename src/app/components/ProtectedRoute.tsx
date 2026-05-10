import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAppContext } from '../context/AppContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  module?: string;
}

export default function ProtectedRoute({ children, roles, module }: ProtectedRouteProps) {
  const { isLoggedIn, currentUser } = useAppContext();
  const location = useLocation();

  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Role
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // Check Excluded Modules
  if (module && currentUser.excludedModules?.includes(module.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

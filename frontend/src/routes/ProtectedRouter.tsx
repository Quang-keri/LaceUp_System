import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRouter: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasPermission = user && allowedRoles.includes(user.role);

  if (!hasPermission) {
    let redirectPath = "/login";

    if (location.pathname.startsWith("/admin")) {
      redirectPath = "/admin/login";
    } else if (location.pathname.startsWith("/owner")) {
      redirectPath = "/owner/login";
    }

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

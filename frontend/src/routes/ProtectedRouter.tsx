import React from "react";
import { Navigate, useLocation } from "react-router-dom";
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

  // 1. Hiển thị Loading trong khi chờ AuthContext lấy dữ liệu user
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. Kiểm tra quyền truy cập (Dùng includes để check trong mảng allowedRoles)
  const hasPermission = user && allowedRoles.includes(user.role);

  if (!hasPermission) {
    // Tùy biến trang chuyển hướng dựa trên "Vùng" mà user đang cố truy cập
    let redirectPath = "/login"; // Mặc định cho Customer

    if (location.pathname.startsWith("/admin")) {
      redirectPath = "/admin/login";
    } else if (location.pathname.startsWith("/owner")) {
      redirectPath = "/owner/login";
    }

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedAdminRouteProps {
    children: React.ReactNode;
}

export const ProtectedRouter: React.FC<ProtectedAdminRouteProps> = ({
                                                                            children,
                                                                        }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    // 1. Nếu AuthProvider đang load -> Hiện Loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // 2. Kiểm tra Role
    // Lưu ý: Kiểm tra chính xác field trả về từ Backend (role hoặc roles)
    const isAdmin =
        user && (user.role === "ADMIN");

    if (!isAdmin) {
        // Nếu không phải Admin -> Đá về Login Admin
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    // 3. Nếu OK -> Render trang Admin
    return <>{children}</>;
};

import {createBrowserRouter} from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import LoginPage from "../page/customer/login-page/LoginPage.tsx";
import PostPage from "../page/customer/post/PostPage.tsx";
import LandingPage from "../page/customer/landing-page/LandingPage.tsx";
import LoginAdminPage from "../page/admin/login-page/LoginAdminPage.tsx";
import {ProtectedRouter} from "./ProtectedRouter.tsx";
import AdminDashboard from "../page/admin/dashboard/AdminDashboard.tsx";
import AdminLayout from "../layouts/AdminLayout/AdminLayout.tsx";
import UserManagement from "../page/admin/user-management/UserManagement.tsx";
import RoleManagement from "../page/admin/role-management/RoleManagement.tsx";
import PermissionManagement from "../page/admin/permission-management/PermissionManagement.tsx";
import OwnerLayout from "../layouts/OwnerLayout/OwnerLayout.tsx";
import ChatHome from "../page/customer/chat/ChatHome.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <DefaultLayout/>,
        handle: {breadcrumb: "Trang chủ"},
        children: [
            {
                path: "/login",
                element: <LoginPage/>,
                handle: {breadcrumb: "Đăng nhập"},
            },
            {
                path: "danh-sach-san",
                element: <PostPage/>,
            },
            {
                path: "/trang-chính",
                element: <LandingPage/>,
                handle: {breadcrumb: "Trang chính"},
            },
            {
                path: "danh-sach-san",
                element: <PostPage/>,
            },
            {
                path: "chat",
                element: <ChatHome />,
                handle: { breadcrumb: "Chat" },
            },
        ],
    },

    {
        path: "/admin/login",
        element: <LoginAdminPage/>,
    },
    {
        path: "/admin",
        element: (
            <ProtectedRouter>
                <AdminLayout/>
            </ProtectedRouter>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboard/>,
            },
            {
                path: "users",
                element: <UserManagement/>,
            },
            {
                path: "roles",
                element: <RoleManagement/>,
            },
            {
                path: "permissions",
                element: <PermissionManagement/>,
            },
        ],
    },
    {
        path: "/owner",
        element: <OwnerLayout/>,
        children: [],
    },
]);

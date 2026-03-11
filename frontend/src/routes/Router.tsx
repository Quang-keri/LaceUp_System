import {createBrowserRouter} from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import LoginPage from "../page/customer/login-page/LoginPage.tsx";
import LoginAdminPage from "../page/admin/login-page/LoginAdminPage.tsx";
import AdminPage from "../page/admin/AdminPage.tsx";
import AdminDashboard from "../page/admin/dashboard/AdminDashboard.tsx";
import {ProtectedRouter} from "./ProtectedRouter.tsx";
import LandingPage from "../page/customer/landing-page/LandingPage.tsx";

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
                path: "/trang-chính",
                element: <LandingPage/>,
                handle: {breadcrumb: "Trang chính"},
            }
        ]
    },

    {
        path: "/admin/login",
        element: <LoginAdminPage/>,
    },
    {
        path: "/admin",
        element: (
            <ProtectedRouter>
                <AdminPage/>
            </ProtectedRouter>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboard />,
            },
        ],
    }
]);

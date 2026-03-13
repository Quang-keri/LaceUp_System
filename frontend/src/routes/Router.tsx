import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import LoginPage from "../page/customer/login-page/LoginPage.tsx";
import PostPage from "../page/customer/post/PostPage.tsx";
import LandingPage from "../page/customer/landing-page/LandingPage.tsx";
import LoginAdminPage from "../page/admin/login-page/LoginAdminPage.tsx";
import { ProtectedRouter } from "./ProtectedRouter.tsx";
import AdminPage from "../page/admin/AdminPage.tsx";
import AdminDashboard from "../page/admin/dashboard/AdminDashboard.tsx";
import OwnerLayout from "../layouts/OwnerLayout/OwnerLayout.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    handle: { breadcrumb: "Trang chủ" },
    children: [
      {
        path: "/login",
        element: <LoginPage />,
        handle: { breadcrumb: "Đăng nhập" },
      },
      {
        path: "danh-sach-san",
        element: <PostPage />,
      },
      {
        path: "/trang-chính",
        element: <LandingPage />,
        handle: { breadcrumb: "Trang chính" },
      },
      {
        path: "danh-sach-san",
        element: <PostPage />,
      },
    ],
  },

  {
    path: "/admin/login",
    element: <LoginAdminPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRouter>
        <AdminPage />
      </ProtectedRouter>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
    ],
  },

  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [],
  },
]);

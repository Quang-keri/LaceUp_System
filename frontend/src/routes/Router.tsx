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
import NotFound from "../page/NotFoundPage.tsx";
import Forbidden from "../page/Forbidden.tsx";
import RentalAreaDetailPage from "../page/customer/rental/RentalAreaDetailPage.tsx";
import PaymentPage from "../page/customer/payment/PaymentPage.tsx";
import PaymentSuccessPage from "../page/customer/payment/PaymentSuccessPage.tsx";
import BuildingListPage from "../page/owner/building/BuildingListPage.tsx";
import BuildingFormPage from "../page/owner/building/BuildingFormPage.tsx";
import CourtManagementPage from "../page/owner/building/CourtManagementPage.tsx";

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
        path: "rental-area/:id",
        element: <RentalAreaDetailPage />,
      },
      {
        path: "payment/:bookingId",
        element: <PaymentPage />,
      },
      {
        path: "payment-success/:bookingId",
        element: <PaymentSuccessPage />,
      },
      {
        path: "danh-sach-san",
        element: <PostPage />,
      },
      {
        path: "/403",
        element: <Forbidden />,
      },
      {
        path: "*",
        element: <NotFound />,
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
    children: [
      {
        path: "buildings/list",
        element: <BuildingListPage />,
      },
      {
        path: "buildings/create",
        element: <BuildingFormPage />,
      },
      {
        path: "buildings/edit/:buildingId",
        element: <BuildingFormPage />,
      },
      {
        path: "buildings/:buildingId/courts",
        element: <CourtManagementPage />,
      },
    ],
  },
]);

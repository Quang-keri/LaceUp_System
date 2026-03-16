import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import LoginPage from "../page/customer/login-page/LoginPage.tsx";
import PostPage from "../page/customer/post/PostPage.tsx";
import LandingPage from "../page/customer/landing-page/LandingPage.tsx";
import LoginAdminPage from "../page/admin/login-page/LoginAdminPage.tsx";
import { ProtectedRouter } from "./ProtectedRouter.tsx";
import AdminDashboard from "../page/admin/dashboard/AdminDashboard.tsx";
import AdminLayout from "../layouts/AdminLayout/AdminLayout.tsx";
import UserManagement from "../page/admin/user-management/UserManagement.tsx";
import RoleManagement from "../page/admin/role-management/RoleManagement.tsx";
import PermissionManagement from "../page/admin/permission-management/PermissionManagement.tsx";
import OwnerLayout from "../layouts/OwnerLayout/OwnerLayout.tsx";
import ChatHome from "../page/customer/chat/ChatHome.tsx";
import BuildingListPage from "../page/owner/building/BuildingListPage.tsx";
import BuildingFormPage from "../page/owner/building/BuildingFormPage.tsx";
import CourtManagementPage from "../page/owner/court/CourtManagementPage.tsx";
import BookingManagementPage from "../page/owner/booking/BookingManagementPage.tsx";
import CourtDetailPage from "../page/owner/court/CourtDetailPage.tsx";
import CourtCopyPage from "../page/owner/court/CourtCopyPage.tsx";
import RentalAreaDetailPage from "../page/customer/rental/RentalAreaDetailPage.tsx";
import ManageSchedulePage from "../page/owner/booking/ManageSchedule/ManageSchedulePage.tsx";
import PostManagementPage from "../page/owner/post/PostManagementPage";

import OwnerProfilePage from "../page/owner/profile/OwnerProfilePage.tsx";
import NotFound from "../page/NotFoundPage.tsx";
import PaymentPage from "../page/customer/payment/PaymentPage.tsx";
import PaymentSuccessPage from "../page/customer/payment/PaymentSuccessPage.tsx";
import ProfilePage from "../page/customer/profile-page/ProfilePage.tsx";
import OwnerDashboard from "../page/owner/dashboard/OwnerDashboard.tsx";
import LoginOwnerPage from "../page/owner/login-page/LoginOwnerPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <LandingPage /> },

      { path: "login", element: <LoginPage /> },

      { path: "danh-sach-san", element: <PostPage /> },

      { path: "rental-area/:id", element: <RentalAreaDetailPage /> },

      { path: "payment/:bookingId", element: <PaymentPage /> },

      { path: "payment-success/:bookingId", element: <PaymentSuccessPage /> },

      { path: "chat", element: <ChatHome /> },

      { path: "profile", element: <ProfilePage /> },
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
        <AdminLayout />
      </ProtectedRouter>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "roles", element: <RoleManagement /> },
      { path: "permissions", element: <PermissionManagement /> },
    ],
  },

  {
    path: "/owner/login",
    element: <LoginOwnerPage />,
  },
  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [
      { index: true, element: <OwnerDashboard /> },

      { path: "buildings/list", element: <BuildingListPage /> },

      { path: "buildings/edit/:buildingId", element: <BuildingFormPage /> },

      {
        path: "buildings/:buildingId/courts",
        element: <CourtManagementPage />,
      },

      { path: "bookings/management", element: <BookingManagementPage /> },

      { path: "bookings/calendar", element: <ManageSchedulePage /> },

      { path: "posts", element: <PostManagementPage /> },

      {
        path: "courts/:courtId",
        element: <CourtDetailPage />,
      },
      {
        path: "courts/:courtId/copies",
        element: <CourtCopyPage />,
      },

      {
        path: "profile",
        element: <OwnerProfilePage />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

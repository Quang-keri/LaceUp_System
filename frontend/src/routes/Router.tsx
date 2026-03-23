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
import OwnerDashboard from "../page/owner/dashboard/OwnerDashboard.tsx";
import LoginOwnerPage from "../page/owner/login-page/LoginOwnerPage.tsx";
import RegisterPage from "../page/customer/login-page/RegisterPage.tsx";
import ConfirmRegister from "../page/customer/login-page/ConfirmRegister.tsx";
import MatchPage from "../page/customer/match/MatchPage.tsx";
import MatchManagement from "../page/owner/match/MatchManagement.tsx";
import CourtPricePage from "../page/owner/court-price/CourtPricePage.tsx";
import BookingManagement from "../page/admin/booking-management/BookingManagement.tsx";
import NotificationPage from "../page/customer/notification/NotificationPage.tsx";
import MyMatchPage from "../page/customer/profile-page/MyMatchPage.tsx";
import BookingPaymentResultPage from "../page/customer/payment/BookingPaymentResultPage.tsx";
import CategoryManagement from "../page/admin/court-type/CategoryManagement.tsx";
import BookingHistoryPage from "../page/customer/bookings/BookingHistoryPage.tsx";
import ProfilePage from "../page/customer/profile-page/ProfilePage.tsx";
import SettlementManagement from "../page/admin/finance/SettlementManagement.tsx";
import PayoutHistory from "../page/admin/finance/PayoutHistory.tsx";
import CommissionConfigManagement from "../page/admin/comission/CommissionConfigManagement.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "register/confirm", element: <ConfirmRegister /> },
      { path: "danh-sach-san", element: <PostPage /> },
      { path: "cong-dong", element: <MatchPage /> },
      { path: "rental-area/:id", element: <RentalAreaDetailPage /> },
      {
        path: "payment/booking-result",
        element: <BookingPaymentResultPage />,
        handle: { breadcrumb: "Kết quả thanh toán booking" },
      },
      // {
      //   element: <ProtectedRouter allowedRoles={["RENTER"]} />,
      //   children: [
      { path: "profile", element: <ProfilePage /> },
      { path: "my-matches", element: <MyMatchPage /> },
      { path: "chat", element: <ChatHome /> },
      { path: "payment/:bookingId", element: <PaymentPage /> },
      {
        path: "payment-success/:bookingId",
        element: <PaymentSuccessPage />,
      },
      { path: "booking-history", element: <BookingHistoryPage /> },
      {
        path: "notifications",
        element: <NotificationPage />,
        handle: { breadcrumb: "Thông báo mới" },
      },
      //   ],
      // },
    ],
  },
  { path: "/admin/login", element: <LoginAdminPage /> },
  {
    path: "/admin",
    element: (
      <ProtectedRouter allowedRoles={["ADMIN"]}>
        <AdminLayout />
      </ProtectedRouter>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "roles", element: <RoleManagement /> },
      { path: "permissions", element: <PermissionManagement /> },
      { path: "court-types", element: <CategoryManagement /> },
      { path: "bookings/list", element: <BookingManagement /> },
      { path: "settlements", element: <SettlementManagement /> },
      {
        path: "settlements/:rentalAreaId/history",
        element: <PayoutHistory />,
      },
      { path: "commissions", element: <CommissionConfigManagement /> },
    ],
  },
  { path: "/owner/login", element: <LoginOwnerPage /> },
  {
    path: "/owner",
    element: (
      <ProtectedRouter allowedRoles={["OWNER"]}>
        <OwnerLayout />
      </ProtectedRouter>
    ),
    children: [
      { index: true, element: <OwnerDashboard /> },
      { path: "buildings/list", element: <BuildingListPage /> },
      { path: "buildings/edit/:buildingId", element: <BuildingFormPage /> },
      {
        path: "buildings/:buildingId/courts",
        element: <CourtManagementPage />,
      },
      { path: "/owner/courts/:courtId/prices", element: <CourtPricePage /> },
      { path: "bookings/management", element: <BookingManagementPage /> },
      { path: "bookings/calendar", element: <ManageSchedulePage /> },
      { path: "posts", element: <PostManagementPage /> },
      { path: "matches", element: <MatchManagement /> },
      { path: "courts/:courtId", element: <CourtDetailPage /> },
      { path: "courts/:courtId/copies", element: <CourtCopyPage /> },
      { path: "profile", element: <OwnerProfilePage /> },
      {
        path: "notifications",
        element: <NotificationPage />,
        handle: { breadcrumb: "Thông báo mới" },
      },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

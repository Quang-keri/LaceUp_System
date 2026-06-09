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
import BuildingListPage from "../page/owner/building/BuildingListPage.tsx";
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
import ServiceItemManagementPage from "../page/owner/service/ServiceItemManagementPage.tsx";
import BookingManagement from "../page/admin/booking-management/BookingManagement.tsx";
import ReviewsManagement from "../page/admin/reviews/ReviewsManagement.tsx";
import NotificationPage from "../page/customer/notification/NotificationPage.tsx";
import MyMatchPage from "../page/customer/profile-page/MyMatchPage.tsx";
import BookingPaymentResultPage from "../page/customer/payment/BookingPaymentResultPage.tsx";
import CategoryManagement from "../page/admin/court-type/CategoryManagement.tsx";
import BookingHistoryPage from "../page/customer/bookings/BookingHistoryPage.tsx";
import ProfilePage from "../page/customer/profile-page/ProfilePage.tsx";
import SettlementManagement from "../page/admin/finance/SettlementManagement.tsx";
import PayoutHistory from "../page/admin/finance/PayoutHistory.tsx";
import CommissionConfigManagement from "../page/admin/comission/CommissionConfigManagement.tsx";
import PlayerDashboard from "../page/customer/profile-page/MyDashboard.tsx";
import {useAuth} from "../context/AuthContext.tsx";
import {Spin} from "antd";
import MyAchievements from "../page/customer/profile-page/MyAchievements.tsx";
import PlayerPublicPage from "../page/customer/profile-page/PlayerPublicPage.tsx";
import SportsBookingLanding from "../page/customer/landing-page/SportsBookingLanding.tsx";
import CreateRentalAreaPage from "../components/rental/CreateRentalArea.tsx";
import VnPayReturnPage from "../page/customer/payment/VnPayReturnPage.tsx";
import MyRanks from "../page/customer/profile-page/MyRankPage.tsx";
import RentalAreaManagement from "../page/admin/owner-management/RentalAreaManagement.tsx";
import NewsPage from "../page/admin/news/NewsPage.tsx";
import UserNewsPage from "../page/customer/news/UserNewsPage.tsx";
import UserNewsDetail from "../page/customer/news/UserNewsDetail.tsx";
import AmenityManagement from "../page/admin/amenities/AmenityManagement.tsx";
import TransactionManager from "../page/owner/transaction/TransactionManager.tsx";
import OwnerSettlementHistory from "../page/owner/settlement/OwnerSettlementHistory.tsx";
import OwnerBankAccount from "../page/owner/settlement/OwnerBankAccount.tsx";
import AdminTransactionManager from "../page/admin/transaction/AdminTransactionManager.tsx";
import EndOfDayReport from "../page/owner/report/endOfDayReport.tsx";
import AdminCustomerManagementPage from "../page/owner/customer-management/AdminCustomerManagementPage.tsx";
import CustomerManagementPage from "../page/admin/customer-management/CustomerManagementPage.tsx";
import UserLayout from "../layouts/UserLayout.tsx";
import AreaMapGoong from "../page/customer/area-map/AreaMapGoong.tsx";
import PendingTransferBookingPage from "../page/owner/booking/ConfirmBookingApp/PendingTransferBookingPage.tsx";
import MatchPaymentPage from "../page/customer/profile-page/my-match/MatchPaymentPage.tsx";
import RefundManagement from "../page/admin/refund-page/RefundManagement.tsx";
import MatchPaymentApprovalPage from "../page/owner/match/MatchPaymentApprovalPage.tsx";
import ResetPassword from "../page/customer/login-page/ResetPassword.tsx";
import ForgotPassword from "../page/customer/login-page/ForgotPassword.tsx";
import PoliciesAndTermsPage from "../components/Footer/PoliciesAndTermsPage.tsx";
import TicketPaymentPage from "../page/customer/payment/TicketPaymentPage.tsx";

const MyDashboardWrapper = () => {
    const {user, isLoading} = useAuth();

    if (isLoading)
        return (
            <div className="p-10 text-center">
                <Spin size="large"/>
            </div>
        );
    if (!user?.userId) return <NotFound/>;

    return <PlayerDashboard userId={user.userId}/>;
};

export const router = createBrowserRouter([
    {
        path: "/",
        element: <DefaultLayout/>,
        children: [
            {index: true, element: <LandingPage/>},
            {
                path: "/create-rental-area",
                element: <CreateRentalAreaPage/>,
            },
            {path: "home", element: <SportsBookingLanding/>},
            {path: "login", element: <LoginPage/>},
            {path: "forgot-password", element: <ForgotPassword/>},
            {path: "reset-password", element: <ResetPassword/>},
            {path: "news", element: <UserNewsPage/>},
            {path: "news/:id", element: <UserNewsDetail/>},
            {path: "/register", element: <RegisterPage/>},
            {path: "register/confirm", element: <ConfirmRegister/>},
            {path: "courts", element: <PostPage/>},
            {path: "comunity", element: <MatchPage/>},
            {path: "rental-area/:id", element: <RentalAreaDetailPage/>},
            // { path: "map", element: <AreaMap /> },
            {path: "map", element: <AreaMapGoong/>},
            {
                path: "payment/booking-result",
                element: <BookingPaymentResultPage/>,
                handle: {breadcrumb: "Kết quả thanh toán booking"},
            },
            {
                path: "payment/vnpay-return",
                element: <VnPayReturnPage/>,
                handle: {breadcrumb: "Kết quả thanh toán VNPay"},
            },
            {path: "payment-ticket/:participantId", element: <TicketPaymentPage/>},
            {path: "payment/ticket-result", element: <BookingPaymentResultPage/>},
            {path: "player/:id", element: <PlayerPublicPage/>},

            {
                element: (
                    <ProtectedRouter
                        allowedRoles={["RENTER", "ADMIN", "OWNER", "STAFF"]}
                    />
                ),
                children: [
                    {
                        element: <UserLayout/>,
                        children: [
                            {path: "dashboard", element: <MyDashboardWrapper/>},
                            {path: "profile", element: <ProfilePage/>},
                            {path: "my-matches", element: <MyMatchPage/>},
                            {path: "achievements", element: <MyAchievements/>},
                            {path: "my-ranks", element: <MyRanks/>},
                            {path: "booking-history", element: <BookingHistoryPage/>},
                            {
                                path: "bank-account",
                                element: <OwnerBankAccount/>,
                            },
                        ],
                    },

                    {path: "chat", element: <ChatHome/>},
                    {path: "payment/:bookingId", element: <PaymentPage/>},
                    {path: "payment/match/:matchId", element: <MatchPaymentPage/>},
                    {
                        path: "payment-success/:bookingId",
                        element: <PaymentSuccessPage/>,
                    },
                    {path: "booking-history", element: <BookingHistoryPage/>},
                    {
                        path: "notifications",
                        element: <NotificationPage/>,
                        handle: {breadcrumb: "Thông báo mới"},
                    },
                ],
            },
        ],
    },

    {path: "/admin/login", element: <LoginAdminPage/>},
    {
        path: "/admin",
        element: (
            <ProtectedRouter allowedRoles={["ADMIN"]}>
                <AdminLayout/>
            </ProtectedRouter>
        ),
        children: [
            {index: true, element: <AdminDashboard/>},
            {path: "users", element: <UserManagement/>},
            {path: "roles", element: <RoleManagement/>},
            {path: "owners", element: <RentalAreaManagement/>},
            {path: "permissions", element: <PermissionManagement/>},
            {path: "court-types", element: <CategoryManagement/>},
            {path: "bookings/list", element: <BookingManagement/>},
            {path: "customers", element: <AdminCustomerManagementPage/>},
            {path: "news", element: <NewsPage/>},
            {path: "reviews", element: <ReviewsManagement/>},
            {path: "amenities", element: <AmenityManagement/>},
            {path: "transactions", element: <AdminTransactionManager/>},
            {
                path: "settlements",
                element: <SettlementManagement/>,
            },
            {
                path: "settlements/:rentalAreaId/history",
                element: <PayoutHistory/>,
            },
            {path: "commissions", element: <CommissionConfigManagement/>},
            {path: "refunds", element: <RefundManagement/>},
            {path: "*", element: <NotFound/>},
        ],
    },

    {path: "/owner/login", element: <LoginOwnerPage/>},
    {
        path: "/owner",
        element: (
            <ProtectedRouter allowedRoles={["OWNER"]}>
                <OwnerLayout/>
            </ProtectedRouter>
        ),
        children: [
            {index: true, element: <OwnerDashboard/>},
            {path: "dashboard", element: <OwnerDashboard/>},
            {path: "buildings/list", element: <BuildingListPage/>},

            {
                path: "buildings/:buildingId/courts",
                element: <CourtManagementPage/>,
            },
            {
                path: "courts",
                element: <CourtManagementPage/>,
            },

            {path: "/owner/courts/:courtId/prices", element: <CourtPricePage/>},
            {path: "bookings/management", element: <BookingManagementPage/>},
            {path: "bookings/calendar", element: <ManageSchedulePage/>},
            {
                path: "/owner/bookings/pending-payment",
                element: <PendingTransferBookingPage/>,
            },
            {path: "posts", element: <PostManagementPage/>},
            {path: "matches", element: <MatchManagement/>},
            {
                path: "match-payment-approvals",
                element: <MatchPaymentApprovalPage/>,
            },
            {path: "service-items", element: <ServiceItemManagementPage/>},
            {path: "courts/:courtId", element: <CourtDetailPage/>},
            {path: "courts/:courtId/copies", element: <CourtCopyPage/>},
            {path: "profile", element: <OwnerProfilePage/>},
            {path: "users/customers", element: <CustomerManagementPage/>},
            {path: "reports", element: <EndOfDayReport/>},
            {
                path: "/owner/transactions",
                element: <TransactionManager/>,
            },
            {
                path: "/owner/transactions/:rentalAreaId",
                element: <TransactionManager/>,
            },
            {
                path: "notifications",
                element: <NotificationPage/>,
                handle: {breadcrumb: "Thông báo mới"},
            },
            {
                path: "/owner/settlements",
                element: <OwnerSettlementHistory/>,
            },
            {
                path: "/owner/settlements/:rentalAreaId",
                element: <OwnerSettlementHistory/>,
            },

            {
                path: "/owner/buildings",
                element: <BuildingListPage/>,
            },

            {path: "*", element: <NotFound/>},
        ],
    },
    {
        path: "*",
        element: <NotFound/>,
    },
    {
        path: "/legal/terms-and-privacy",
        element: <PoliciesAndTermsPage/>,
    },
]);

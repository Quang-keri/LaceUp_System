import React, {useState, useEffect} from "react";
import {Layout, Menu, type MenuProps} from "antd";
import {Link, useLocation} from "react-router-dom";
import {
    AppstoreOutlined,
    CalendarOutlined,
    ShopOutlined,
    DollarOutlined,
    SettingOutlined,
    LogoutOutlined,
    StarOutlined, UserOutlined,
    PercentageOutlined
} from "@ant-design/icons";
import type {UserResponse} from "../../types/user.ts";

const {Sider} = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

interface SidebarProps {
    collapsed: boolean;
    toggleCollapsed: () => void;
    isDark: boolean;
    adminUser: UserResponse | null;
    handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({collapsed, isDark, handleLogout}) => {
    const location = useLocation();
    const [activeKey, setActiveKey] = useState<string>(location.pathname);
    const [openKeys, setOpenKeys] = useState<string[]>([]);

    useEffect(() => {
        setActiveKey(location.pathname);
    }, [location.pathname]);

    const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
        setOpenKeys(keys);
    };

    const items: MenuItem[] = [
        getItem(<Link to="/admin">Bảng điều khiển</Link>, "/admin", <AppstoreOutlined/>),

        // 1. Gộp Quản lý Người dùng (User, Role, Permission)
        getItem("Quản lý người dùng", "sub_users", <UserOutlined/>, [
            getItem(<Link to="/admin/users">Danh sách người dùng</Link>, "/admin/users"),
            getItem(<Link to="/admin/roles">Vai trò</Link>, "/admin/roles"),
            getItem(<Link to="/admin/permissions">Quyền hạn</Link>, "/admin/permissions"),
            getItem(<Link to="/admin/customers">Khách hàng (Thành viên)</Link>, "/admin/customers"),
        ]),

        // 2. Quản lý Sân & Cơ sở (Thay cho Rooms)
        getItem("Quản lý sân bãi", "sub_courts", <ShopOutlined/>, [
            getItem(<Link to="/admin/courts">Danh sách sân</Link>, "/admin/courts"),
            getItem(<Link to="/admin/court-types">Loại sân (5-7-9, Cầu lông...)</Link>, "/admin/court-types"),
            getItem(<Link to="/admin/amenities">Dịch vụ đi kèm (Nước, Áo pitch)</Link>, "/admin/amenities"),
        ]),

        // 3. Quản lý Đặt sân (Sửa tên cho đúng chuyên môn)
        getItem("Lịch đặt sân", "sub_booking", <CalendarOutlined/>, [
            getItem(<Link to="/admin/bookings/calendar">Bản đồ lịch sân</Link>, "/admin/bookings/calendar"),
            getItem(<Link to="/admin/bookings/list">Danh sách đơn đặt</Link>, "/admin/bookings/list"),
            getItem(<Link to="/admin/bookings/check-in">Nhận sân/Trả sân</Link>, "/admin/bookings/check-in"),
        ]),

        // 4. Marketing & Khuyến mãi
        getItem(<Link to="/admin/vouchers">Mã giảm giá</Link>, "/admin/vouchers", <PercentageOutlined/>),

        // 5. Tài chính & Hợp tác
        getItem("Tài chính & Đối tác", "sub_finance", <DollarOutlined/>, [
            getItem(<Link to="/admin/invoices">Hóa đơn</Link>, "/admin/invoices"),
            getItem(<Link to="/admin/payouts">Thanh toán cho chủ sân</Link>, "/admin/payouts"),
            getItem(<Link to="/admin/transactions">Lịch sử giao dịch</Link>, "/admin/transactions"),
        ]),

        getItem(<Link to="/admin/reviews">Đánh giá & Phản hồi</Link>, "/admin/reviews", <StarOutlined/>),

        getItem("Cài đặt hệ thống", "sub_settings", <SettingOutlined/>, [
            getItem(<Link to="/admin/settings">Cài đặt chung</Link>, "/admin/settings"),
            getItem(<Link to="/admin/banners">Quản lý Banner/Quảng cáo</Link>, "/admin/banners"),
        ]),

        getItem("Đăng xuất", "logout", <LogoutOutlined/>),
    ];

    const handleMenuClick: MenuProps["onClick"] = (e) => {
        if (e.key === "logout") handleLogout();
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            theme={isDark ? "dark" : "light"}
            className="shadow-md z-20"
            style={{
                borderRight: isDark ? "1px solid #303030" : "1px solid #f0f0f0",
            }}
        >
            {/* Logo Section */}
            <div
                className={`h-16 flex items-center justify-center border-b transition-colors ${
                    isDark ? "border-gray-700 bg-[#001529]" : "border-gray-200 bg-white"
                }`}
            >
                <div className="flex items-center gap-2 overflow-hidden px-4">
                    <div
                        className="min-w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        E
                    </div>
                    {!collapsed && (
                        <div
                            className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${
                                isDark ? "text-white" : "text-gray-800"
                            }`}
                        >
                            EduRoom
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar py-2">
                <Menu
                    mode="inline"
                    selectedKeys={[activeKey]}
                    openKeys={openKeys}
                    onOpenChange={onOpenChange}
                    items={items}
                    onClick={handleMenuClick}
                    theme={isDark ? "dark" : "light"}
                    style={{border: "none", background: "transparent"}}
                />
            </div>
        </Sider>
    );
};

export default Sidebar;

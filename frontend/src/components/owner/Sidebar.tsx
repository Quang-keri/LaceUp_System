import React, { useState, useEffect } from "react";
import { Layout, Menu, type MenuProps } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ShopOutlined,
  DollarOutlined,
  LogoutOutlined,
  StarOutlined,
  PercentageOutlined,
  TeamOutlined
} from "@ant-design/icons";
import type { UserResponse } from "../../types/user.ts";

const { Sider } = Layout;

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
  user: UserResponse | null;
  handleLogout: () => void;
}

const OwnerSidebar: React.FC<SidebarProps> = ({ collapsed, isDark, handleLogout }) => {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState<string>(location.pathname);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    setActiveKey(location.pathname);
  }, [location.pathname]);

  const onOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys);
  };

  // --- MENU DÀNH RIÊNG CHO CHỦ SÂN (OWNER) ---
  const items: MenuItem[] = [
    getItem(<Link to="/owner">Bảng điều khiển</Link>, "/owner", <AppstoreOutlined />),

    // 1. Quản lý sân của tôi
    getItem("Sân của tôi", "sub_my_courts", <ShopOutlined />, [
      getItem(<Link to="/owner/courts">Danh sách sân bãi</Link>, "/owner/courts"),
      getItem(<Link to="/owner/court-prices">Cấu hình giá (Theo giờ/ngày)</Link>, "/owner/court-prices"),
      getItem(<Link to="/owner/amenities">Dịch vụ tại sân</Link>, "/owner/amenities"),
    ]),

    // 2. Quản lý lịch trình
    getItem("Lịch đặt & Vận hành", "sub_operation", <CalendarOutlined />, [
      getItem(<Link to="/owner/calendar">Bản đồ lịch sân</Link>, "/owner/calendar"),
      getItem(<Link to="/owner/bookings">Danh sách đặt chỗ</Link>, "/owner/bookings"),
      getItem(<Link to="/owner/check-in">Check-in khách hàng</Link>, "/owner/check-in"),
    ]),

    // 3. Khuyến mãi tại sân
    getItem(<Link to="/owner/vouchers">Chương trình giảm giá</Link>, "/owner/vouchers", <PercentageOutlined />),

    // 4. Doanh thu & Báo cáo
    getItem("Doanh thu", "sub_finance", <DollarOutlined />, [
      getItem(<Link to="/owner/invoices">Hóa đơn bán hàng</Link>, "/owner/invoices"),
      getItem(<Link to="/owner/revenue-report">Báo cáo doanh thu</Link>, "/owner/revenue-report"),
    ]),

    // 5. Khách hàng
    getItem(<Link to="/owner/reviews">Phản hồi khách hàng</Link>, "/owner/reviews", <StarOutlined />),

    // 6. Nhân viên (Nếu chủ sân có thuê nhân viên trực)
    getItem(<Link to="/owner/staff">Quản lý nhân viên</Link>, "/owner/staff", <TeamOutlined />),

    { type: 'divider' },
    getItem("Đăng xuất", "logout", <LogoutOutlined />),
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
                className="min-w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              L
            </div>
            {!collapsed && (
                <div
                    className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${
                        isDark ? "text-white" : "text-gray-800"
                    }`}
                >
                  LaceUp Owner
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
              style={{ border: "none", background: "transparent" }}
          />
        </div>
      </Sider>
  );
};

export default OwnerSidebar;
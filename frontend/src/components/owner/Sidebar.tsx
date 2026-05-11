import React, { useState, useEffect } from "react";
import { Layout, Menu, type MenuProps } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ShopOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  StarOutlined,
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

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  isDark,
  handleLogout,
}) => {
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
    getItem(
      <Link to="/owner">Báo cáo và thống kê</Link>,
      "/owner",
      <AppstoreOutlined />,
    ),

    getItem("Quản lý đặt lịch", "sub_booking", <CalendarOutlined />, [
      getItem(
        <Link to="/owner/bookings/management">Danh sách đơn đặt</Link>,
        "/owner/bookings/list",
      ),
      getItem(
        <Link to="/owner/bookings/calendar">Lịch hẹn </Link>,
        "/owner/bookings/calendar",
      ),
    ]),

    getItem("Quản lý Cơ sở", "sub_area", <CalendarOutlined />, [
      getItem(
        <Link to="/owner/buildings/list">Chi nhánh</Link>,
        "/owner/area/list",
      ),
      getItem(
        <Link to="/owner/service-items">Thiết bị và tiện ích </Link>,
        "/owner/service-items",
      ),
    ]),

    getItem("Quản lý nội dung", "sub_content", <ShopOutlined />, [
      getItem(<Link to="/owner/posts">Quản lý bài đăng</Link>, "/owner/posts"),
      getItem(
        <Link to="/owner/matches">Trận đấu vãng lai</Link>,
        "/owner/matches",
      ),
    ]),

    getItem("Quản lý người dùng", "sub_users", <CalendarOutlined />, [
      getItem(
        <Link to="/owner/users/customers">Khách hàng </Link>,
        "/owner/users/customers",
      ),
      getItem(
        <Link to="/owner/users/staffs">Nhân viên </Link>,
        "/owner/users/staffs",
      ),
    ]),

    getItem("Tài chính & Hóa đơn", "sub_finance", <DollarOutlined />, [
      getItem(
        <Link to="/owner/invoices">Hóa đơn dịch vụ</Link>,
        "/owner/invoices",
      ),
      getItem(
        <Link to="/owner/transactions">Lịch sử giao dịch</Link>,
        "/owner/transactions",
      ),
      getItem(
        <Link to="/owner/wallet-overview">Tổng quan ví hệ thống</Link>,
        "/owner/wallet-overview",
      ),
      getItem(
        <Link to="/owner/commission-config">Cấu hình Commission</Link>,
        "/owner/commission-config",
      ),
      getItem(
        <Link to="/owner/wallet-freeze">Khóa/Mở khóa ví</Link>,
        "/owner/wallet-freeze",
      ),
    ]),

    getItem(
      <Link to="/owner/reviews">Đánh giá từ khách</Link>,
      "/owner/reviews",
      <StarOutlined />,
    ),

    getItem("Cài đặt hệ thống", "sub_settings", <SettingOutlined />, [
      getItem(
        <Link to="/owner/settings">Cài đặt chung</Link>,
        "/owner/settings",
      ),
    ]),

    getItem(
      <Link to="/owner/reports">Bao cao</Link>,
      "/owner/reports",
      <AppstoreOutlined />,
    ),

    getItem("Đăng xuất", "logout", <LogoutOutlined />),
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "logout") {
      handleLogout();
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      collapsedWidth={80} // Thêm để width khi thu gọn chuẩn
      theme={isDark ? "dark" : "light"}
      className="shadow-md z-20"
      style={{
        overflow: "hidden",
        height: "100vh",
        position: "fixed", // GHIM CỐ ĐỊNH SIDEBAR
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: isDark ? "1px solid #303030" : "1px solid #f0f0f0",
        background: isDark ? "#001529" : "#ffffff",
      }}
    >
      {/* BỌC TOÀN BỘ VÀO KHUNG FLEX ĐỂ GIAO DIỆN KHÔNG BỊ VỠ KHI FIXED */}
      <div className="flex flex-col h-full w-full">
        <Link to="/trang-chu" className="block flex-none">
          <div
            className={`h-16 flex items-center justify-center border-b transition-colors ${
              isDark
                ? "border-gray-700 bg-[#001529]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden px-4">
              <img
                rel="icon"
                src="/logo.png"
                alt="Logo"
                className="w-12 h-12"
              />
              {!collapsed && (
                <div
                  className={`font-bold text-xl tracking-tight whitespace-nowrap transition-opacity duration-300 ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                >
                  Lace Up
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* THAY CHIỀU CAO CỨNG BẰNG flex-1 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
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
      </div>
    </Sider>
  );
};

export default Sidebar;

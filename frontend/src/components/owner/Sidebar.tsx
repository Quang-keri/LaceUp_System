import React, { useState, useEffect } from "react";
import { Layout, Menu, type MenuProps } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  AppstoreOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShopOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  StarOutlined,
} from "@ant-design/icons";
// import type { UserResponse } from "../../services/usersService";

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
  adminUser: UserResponse | null;
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  isDark,
  //   adminUser,
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
        "/owner/bookings/management",
      ),
      getItem(
        <Link to="/owner/bookings/calendar">Lịch hẹn </Link>,
        "/owner/bookings/calendar",
      ),

      getItem(
        <Link to="/owner/bookings/check-in">Nhận/Trả</Link>,
        "/owner/bookings/check-in",
      ),
    ]),

    //
    getItem("Quản lý Cơ sở", "sub_area", <ShopOutlined />, [
      getItem(
        <Link to="/owner/buildings/list">Danh sách tòa nhà</Link>,
        "/owner/buildings/list",
      ),
      getItem(<Link to="/owner/area/list">Chi nhánh</Link>, "/owner/area/list"),
      getItem(
        <Link to="/owner/area/devices">Thiết bị và tiện ích </Link>,
        "/owner/area/list",
      ),
    ]),
    getItem(
      <Link to="/owner/posts">Quản lý bài đăng</Link>,
      "/owner/posts",
      <ShopOutlined />,
    ),

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
      theme={isDark ? "dark" : "light"}
      className="shadow-md z-20"
      style={{
        borderRight: isDark ? "1px solid #303030" : "1px solid #f0f0f0",
      }}
    >
      <div
        className={`h-16 flex items-center justify-center border-b transition-colors ${
          isDark ? "border-gray-700 bg-[#001529]" : "border-gray-200 bg-white"
        }`}
      >
        <Link to={"/"}>
         <div className="flex items-center gap-2 overflow-hidden px-4">
          <div className="min-w-[32px] h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            L
          </div>
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
        </Link>
       
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

export default Sidebar;

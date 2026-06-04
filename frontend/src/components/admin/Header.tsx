import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Avatar,
  Dropdown,
  Menu,
  type MenuProps,
  ConfigProvider,
} from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  BulbOutlined,
  BulbFilled,
  UserOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ShopOutlined,
  DollarOutlined,
  SettingOutlined,
  StarOutlined,
  PercentageOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import type { UserResponse } from "../../types/user.ts";
import { useAuth } from "../../context/AuthContext";

const { Header } = Layout;

interface AdminHeaderProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  adminUser: UserResponse | null;
  isDark: boolean;
  onThemeToggle: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminUser,
  isDark,
  onThemeToggle,
}) => {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState<string>(location.pathname);
  const { logout } = useAuth();

  useEffect(() => {
    setActiveKey(location.pathname);
  }, [location.pathname]);

  const displayName = adminUser?.userName || "Admin";

  const userMenu: MenuProps["items"] = [
    { key: "1", label: "Hồ sơ cá nhân" },
    { key: "2", label: "Cài đặt" },
    { type: "divider" },
    { key: "logout", label: "Đăng xuất", danger: true, onClick: logout },
  ];

  const menuItems: MenuProps["items"] = [
    {
      key: "/admin",
      icon: <AppstoreOutlined />,
      label: <Link to="/admin">Bảng điều khiển</Link>,
    },
    {
      key: "sub_users",
      icon: <UserOutlined />,
      label: "Người dùng",
      children: [
        {
          key: "/admin/users",
          label: <Link to="/admin/users">Danh sách người dùng</Link>,
        },
        { key: "/admin/roles", label: <Link to="/admin/roles">Vai trò</Link> },
        {
          key: "/admin/permissions",
          label: <Link to="/admin/permissions">Quyền hạn</Link>,
        },
        {
          key: "/admin/customers",
          label: <Link to="/admin/customers">Khách hàng</Link>,
        },
      ],
    },
    {
      key: "sub_courts",
      icon: <ShopOutlined />,
      label: "Sân bãi",
      children: [
        {
          key: "/admin/owners",
          label: <Link to="/admin/owners">Quản lí các cơ sở</Link>,
        },
        {
          key: "/admin/courts",
          label: <Link to="/admin/courts">Danh sách sân</Link>,
        },
        {
          key: "/admin/court-types",
          label: <Link to="/admin/court-types">Loại sân</Link>,
        },
        {
          key: "/admin/amenities",
          label: <Link to="/admin/amenities">Tiện ích</Link>,
        },
      ],
    },
    {
      key: "sub_booking",
      icon: <CalendarOutlined />,
      label: "Lịch đặt",
      children: [
        {
          key: "/admin/bookings/calendar",
          label: <Link to="/admin/bookings/calendar">Lịch sân</Link>,
        },
        {
          key: "/admin/bookings/list",
          label: <Link to="/admin/bookings/list">Danh sách đơn</Link>,
        },
      ],
    },
    {
      key: "/admin/vouchers",
      icon: <PercentageOutlined />,
      label: <Link to="/admin/vouchers">Mã giảm giá</Link>,
    },
    {
      key: "sub_finance",
      icon: <DollarOutlined />,
      label: "Tài chính",
      children: [
        {
          key: "/admin/settlements",
          label: <Link to="/admin/settlements">Đối soát & Thanh toán</Link>,
        },
        {
          key: "/admin/commissions",
          label: <Link to="/admin/commissions">Cấu hình hoa hồng</Link>,
        },
        {
           key: "/admin/transactions",
          label: <Link to="/admin/transactions">Giao dịch</Link>,
        },
        {
          key: "/admin/refunds",
          label: <Link to="/admin/refunds">Yêu cầu hoàn tiền</Link>,
        },
      ],
    },
    {
      key: "/admin/reviews",
      icon: <StarOutlined />,
      label: <Link to="/admin/reviews">Đánh giá</Link>,
    },
    {
      key: "/admin/news",
      icon: <ReadOutlined />,
      label: <Link to="/admin/news">Tin tức</Link>,
    },
    {
      key: "sub_settings",
      icon: <SettingOutlined />,
      label: "Hệ thống",
      children: [
        {
          key: "/admin/settings",
          label: <Link to="/admin/settings">Cài đặt chung</Link>,
        },
        {
          key: "/admin/banners",
          label: <Link to="/admin/banners">Quản lý Banner</Link>,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full z-10 shadow-md">
      <Header
        className={`px-4 flex items-center justify-between transition-all duration-300 border-b ${
          isDark ? "border-[#303030]" : "border-gray-200"
        }`}
        style={{
          height: 50,
          lineHeight: "50px",
          paddingInline: 16,
          backgroundColor: isDark ? "#141414" : "#ffffff",
        }}
      >
        <Link to={"/home"}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            <span
              className={`font-bold text-lg tracking-tight transition-colors duration-300 ${
                isDark ? "text-white" : "text-[#007acc]"
              }`}
            >
              Lace Up | Quản trị viên
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            shape="circle"
            type="text"
            onClick={onThemeToggle}
            className={`flex items-center justify-center hover:bg-opacity-20 ${
              isDark
                ? "text-yellow-400 hover:bg-gray-600"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            icon={isDark ? <BulbFilled /> : <BulbOutlined />}
          />

          <Dropdown
            menu={{ items: userMenu }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <span
                className={`font-medium text-sm hidden sm:block ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {displayName}
              </span>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                className={isDark ? "bg-gray-600" : "bg-[#007acc]"}
              />
            </div>
          </Dropdown>
        </div>
      </Header>

      <div
        className={`transition-colors duration-300 ${
          isDark ? "bg-[#1f1f1f] border-b border-[#303030]" : "bg-[#007acc]"
        }`}
      >
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                darkItemBg: "transparent",
                darkSubMenuItemBg: isDark ? "#1f1f1f" : "#007acc",

                // Thêm darkPopupBg để đổi màu nền của các menu xổ xuống (Dropdown Submenu)
                darkPopupBg: isDark ? "#1f1f1f" : "#007acc",
                popupBg: isDark ? "#1f1f1f" : "#007acc",

                darkItemSelectedBg: isDark ? "#1677ff" : "#005a9e",
                darkItemHoverBg: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.15)",
                horizontalLineHeight: "46px",
              },
            },
          }}
        >
          <Menu
            mode="horizontal"
            theme="dark"
            selectedKeys={[activeKey]}
            items={menuItems}
            className="container mx-auto font-medium text-[15px]"
            style={{
              background: "transparent",
              borderBottom: "none",
              lineHeight: "46px",
            }}
          />
        </ConfigProvider>
      </div>
    </div>
  );
};

export default AdminHeader;

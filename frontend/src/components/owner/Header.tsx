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
  EyeOutlined,
  AppstoreOutlined,
  InboxOutlined,
  SwapOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { UserResponse } from "../../types/user.ts";

const { Header } = Layout;

interface AdminHeaderProps {
  adminUser: UserResponse | null;
  isDark: boolean;
  onThemeToggle: () => void;
  onLogout: () => void;
}

const OwnerHeader: React.FC<AdminHeaderProps> = ({
  adminUser,
  isDark,
  onThemeToggle,
  onLogout,
}) => {
  const location = useLocation();
  const [activeKey, setActiveKey] = useState<string>(location.pathname);

  useEffect(() => {
    setActiveKey(location.pathname);
  }, [location.pathname]);

  const displayName = adminUser?.userName || "Admin Sân Cầu Lông";

  const userMenu: MenuProps["items"] = [
    { key: "1", label: "Hồ sơ cá nhân" },
    { key: "2", label: "Cài đặt cơ sở" },
    { type: "divider" },
    { key: "logout", label: "Đăng xuất", danger: true, onClick: onLogout },
  ];

  const menuItems: MenuProps["items"] = [
    {
      key: "/owner/dashboard",
      icon: <EyeOutlined />,
      label: <Link to="/owner/dashboard">Tổng quan</Link>,
    },
    {
      key: "submenu-bookings",
      icon: <AppstoreOutlined />,
      label: "Lịch đặt sân",
      children: [
        {
          key: "/owner/bookings/management",
          label: <Link to="/owner/bookings/management">Đơn đặt</Link>,
        },
        {
          key: "/owner/bookings/calendar",
          label: <Link to="/owner/bookings/calendar">Lịch hẹn</Link>,
        },
      ],
    },

    {
      key: "sub_area",
      icon: <InboxOutlined />,
      label: <Link to="/owner/courts">Sân</Link>,
    },
    {
      key: "/owner/service-items",
      icon: <InboxOutlined />,
      label: <Link to="/owner/service-items">Hàng hóa & Dịch vụ</Link>,
    },
    {
      key: "submenu-transactions",
      icon: <SwapOutlined />,
      label: "Giao dịch",
      children: [
        {
          key: "/owner/transactions",
          label: <Link to="/owner/transactions">Giao dịch</Link>,
        },
        {
          ///owner/settlements/:rentalAreaId
          key: "/owner/users/customers",
          label: <Link to="/owner/settlements">Lịch sử tiền nhận</Link>,
        },
      ],
    },
    {
      key: "submenu-users",
      icon: <TeamOutlined />,
      label: "Đối tác & Nhân viên",
      children: [
        {
          key: "/owner/users/customers",
          label: <Link to="/owner/users/customers">Khách hàng</Link>,
        },
        {
          key: "/owner/users/staffs",
          label: <Link to="/owner/users/staffs">Nhân viên</Link>,
        },
      ],
    },
    {
      key: "submenu-reports",
      icon: <BarChartOutlined />,
      label: "Báo cáo",
      children: [
        {
          key: "/owner/invoices",
          label: <Link to="/owner/invoices">Hóa đơn</Link>,
        },
        {
          key: "/owner/wallet-overview",
          label: <Link to="/owner/wallet-overview">Tổng quan tài chính</Link>,
        },
      ],
    },
    {
      key: "/owner/settings",
      icon: <SettingOutlined />,
      label: <Link to="/owner/settings">Thiết lập</Link>,
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
              Lace Up | Quản lí sân
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

export default OwnerHeader;

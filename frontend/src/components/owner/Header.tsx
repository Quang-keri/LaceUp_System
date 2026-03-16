import React from "react";
import { Layout, Button, Avatar, Dropdown, type MenuProps } from "antd";
import {
  BulbOutlined,
  BulbFilled,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from "@ant-design/icons";
import type { UserResponse } from "../../types/user.ts";

const { Header } = Layout;

interface AdminHeaderProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  adminUser: UserResponse | null;
  isDark: boolean;
  onThemeToggle: () => void;
}

const OwnerHeader: React.FC<AdminHeaderProps> = ({
  collapsed,
  toggleCollapsed,
  adminUser,
  isDark,
  onThemeToggle,
}) => {
  const displayName = adminUser?.userName || "Admin";

  const userMenu: MenuProps["items"] = [
    { key: "1", label: "Hồ sơ cá nhân" },
    { key: "2", label: "Cài đặt" },
  ];

  return (
    <Header
      className={`px-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md transition-all duration-200 border-b ${
        isDark
          ? "bg-[#001529]/90 border-gray-700 text-white"
          : "bg-white/90 border-gray-200 text-gray-800"
      }`}
      style={{
        paddingInline: 16,
        height: 64,
        lineHeight: "64px",
        background: isDark ? undefined : "rgba(255, 255, 255, 0.9)",
      }}
    >
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          className="flex items-center justify-center"
          style={{
            fontSize: "16px",
            width: 40,
            height: 40,
            color: isDark ? "#fff" : "rgba(0, 0, 0, 0.85)",
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          shape="circle"
          onClick={onThemeToggle}
          icon={
            isDark ? (
              <BulbFilled className="text-yellow-400" />
            ) : (
              <BulbOutlined className="text-gray-600" />
            )
          }
          className={
            isDark
              ? "bg-gray-700 border-gray-600 text-white"
              : "border-gray-300"
          }
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        />

        <Dropdown menu={{ items: userMenu }} placement="bottomRight">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div
              className={`text-right hidden sm:block leading-tight ${
                isDark ? "text-gray-200" : "text-gray-800"
              }`}
            >
              <div className="font-semibold text-sm">{displayName}</div>
              <div
                className={`text-xs ${isDark ? "opacity-60" : "text-gray-500"}`}
              >
                {adminUser?.role || "User"}
              </div>
            </div>
            <Avatar
              size="large"
              icon={<UserOutlined />}
              className="bg-blue-600 flex items-center justify-center"
            />
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default OwnerHeader;

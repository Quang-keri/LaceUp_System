import React, { useState } from "react";
import { Layout } from "antd";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/admin/Sidebar.tsx";
import AdminHeader from "../../components/admin/Header.tsx";
import { Outlet } from "react-router-dom";

const { Content } = Layout;
const THEME_KEY = "adminTheme";

const AdminLayout: React.FC<{}> = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem(THEME_KEY) === "dark";
  });

  const handleLogoutClick = async () => {
    await logout();
  };

  const handleThemeToggle = () => setIsDark((prev) => !prev);

  return (
    // ĐỔI 1: Thay min-h-screen bằng h-screen và thêm overflow-hidden để chống cuộn toàn trang
    <Layout className="h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        toggleCollapsed={() => setCollapsed(!collapsed)}
        isDark={isDark}
        adminUser={user}
        handleLogout={handleLogoutClick}
      />

      <Layout
        // ĐỔI 2: Thay min-h-screen bằng h-screen
        className="transition-all duration-200 flex flex-col h-screen"
        style={{ marginLeft: collapsed ? 80 : 260 }}
      >
        <AdminHeader
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
          adminUser={user}
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
        />

        <Content
          // ĐỔI 3: Thêm overflow-y-auto để nội dung bên trong Outlet có thể cuộn độc lập
          className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${
            isDark ? "bg-[#141414]" : "bg-[#f0f2f5]"
          }`}
        >
          <Outlet context={{ isDark }} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

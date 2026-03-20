import { useState, useEffect } from "react";
import { Layout, ConfigProvider, theme as antTheme } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/owner/Sidebar";
import OwnerHeader from "../../components/owner/Header";
import { useAuth } from "../../context/AuthContext";
import ChatBubble from "../../page/customer/chat/ChatBubble";

const { Content } = Layout;
const THEME_KEY = "adminTheme";

export default function OwnerLayout() {
  // 1. Lấy cả user và logout từ context
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem(THEME_KEY) === "dark";
  });

  useEffect(() => {
    const themeValue = isDark ? "dark" : "light";
    localStorage.setItem(THEME_KEY, themeValue);
    document.body.setAttribute("data-theme", themeValue);
  }, [isDark]);

  // 2. Tạo hàm handleLogoutClick giống bên Admin
  const handleLogoutClick = async () => {
    await logout();
  };

  const handleThemeToggle = () => setIsDark((prev) => !prev);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
        },
      }}
    >
      <Layout className="h-screen overflow-hidden flex flex-row">
        <Sidebar
          collapsed={collapsed}
          toggleCollapsed={() => setCollapsed(!collapsed)}
          isDark={isDark}
          user={user}
          handleLogout={handleLogoutClick}
        />

        <Layout className="flex flex-col flex-1 min-w-0 transition-all duration-200">
          <OwnerHeader
            collapsed={collapsed}
            toggleCollapsed={() => setCollapsed(!collapsed)}
            adminUser={user}
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
          />

          <Content
            className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${
              isDark ? "bg-[#141414]" : "bg-[#ffff]"
            }`}
          >
            <Outlet context={{ isDark }} />
          </Content>
        </Layout>
      </Layout>

      <ChatBubble />
    </ConfigProvider>
  );
}

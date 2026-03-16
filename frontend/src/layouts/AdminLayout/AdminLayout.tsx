import React, {useState} from 'react';
import {Layout, } from 'antd';
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/admin/Sidebar.tsx";
import AdminHeader from "../../components/admin/Header.tsx";
import {Outlet} from "react-router-dom";

const {Content} = Layout;
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
        <Layout className="h-screen overflow-hidden flex flex-row">
            <Sidebar
                collapsed={collapsed}
                toggleCollapsed={() => setCollapsed(!collapsed)}
                isDark={isDark}
                adminUser={user}
                handleLogout={handleLogoutClick}
            />

            <Layout className="flex flex-col flex-1 min-w-0 transition-all duration-200">
                <AdminHeader
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
                    <Outlet context={{isDark}}/>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
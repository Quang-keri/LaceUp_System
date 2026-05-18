import React from "react";
import { Row, Col } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import UserSidebar from "../components/sidebar/UserSidebar";

const UserLayout: React.FC = () => {
  const location = useLocation();

  const getSelectedMenuKey = (path: string) => {
    if (path.includes("/dashboard")) return "0";
    if (path.includes("/profile")) return "1";
    if (path.includes("/my-matches")) return "2";
    if (path.includes("/booking-history")) return "3";
    if (path.includes("/achievements")) return "7";
    if (path.includes("/my-ranks")) return "8";
    return "0";
  };

  const selectedKey = getSelectedMenuKey(location.pathname);

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} md={8} lg={6}>
          <UserSidebar selectedKey={selectedKey} />
        </Col>

        <Col xs={24} md={16} lg={18}>
          <Outlet />
        </Col>
      </Row>
    </div>
  );
};

export default UserLayout;

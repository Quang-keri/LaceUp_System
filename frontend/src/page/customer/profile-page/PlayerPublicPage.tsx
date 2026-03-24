import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Row, Col, Spin, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import PublicSidebar from "../../../components/sidebar/PublicSidebar";
import PlayerMatchHistory from "./PlayerMatchHistory";
import userService from "../../../service/userService";
import PlayerDashboardContent from "./PlayerDashboardContent";

const PlayerPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  const [activeMenu, setActiveMenu] = useState<string>("dashboard");

  useEffect(() => {
    if (!id) return;
    const fetchUserProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await userService.getUserById(id);
        setTargetUser(response.result);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người chơi:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  if (!id) {
    return (
      <div className="p-10 text-center text-gray-500">
        Không tìm thấy mã người chơi!
      </div>
    );
  }

  const handleMenuChange = (key: string) => {
    setActiveMenu(key);
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "calc(100vh - 70px)",
      }}
    >
      <div className="max-w-7xl mx-auto mb-4">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-blue-600 font-semibold px-0"
        >
          Quay lại
        </Button>
      </div>

      <Row gutter={[24, 24]} justify="center" className="max-w-7xl mx-auto">
        <Col xs={24} md={8} lg={6}>
          {loadingProfile ? (
            <Card
              style={{
                borderRadius: "12px",
                textAlign: "center",
                padding: "40px 0",
              }}
              bordered={false}
            >
              <Spin size="large" />
            </Card>
          ) : (
            <PublicSidebar
              targetUser={targetUser}
              selectedKey={activeMenu}
              onMenuClick={handleMenuChange}
            />
          )}
        </Col>

        <Col xs={24} md={16} lg={18}>
          {activeMenu === "dashboard" && <PlayerDashboardContent userId={id} />}
          {activeMenu === "history" && (
            <Card
              bordered={false}
              style={{ borderRadius: "12px", minHeight: "500px" }}
            >
              <div className="text-xl font-bold mb-4">Lịch sử đấu</div>
              <PlayerMatchHistory userId={id} />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default PlayerPublicPage;

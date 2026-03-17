import {
  Card,
  Button,
  Row,
  Col,
  Space,
  Tag,
  Empty,
  Popconfirm,
  Skeleton,
} from "antd";
import {
  EditOutlined,
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { CourtResponse } from "../../../types/court";
import { useNavigate } from "react-router-dom";
interface Props {
  courts: CourtResponse[];
  loading: boolean;
  onEdit: (court: CourtResponse) => void;
  onManage: (court: CourtResponse) => void;
  onView: (court: CourtResponse) => void;
  onDelete?: (courtId: string) => void;
  onUpdatePrice: (court: CourtResponse) => void;
}

export default function CourtCardList({
  courts,
  loading,
  onEdit,
  onManage,
  onView,
  onDelete,
  onUpdatePrice,
}: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3].map((i) => (
          <Col span={8} key={i}>
            <Card>
              <Skeleton />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (courts.length === 0) {
    return <Empty description="Chưa có sân nào" />;
  }

  return (
    <Row gutter={[16, 16]}>
      {courts.map((court) => (
        <Col span={8} key={court.courtId}>
          <Card
            cover={
              <div
                style={{
                  height: 200,
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {court.images && court.images.length > 0 ? (
                  <img
                    src={
                      court.images.find((i: any) => i.isCover)?.imageUrl ||
                      court.images[0]?.imageUrl
                    }
                    alt={court.courtName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e: any) => {
                      e.target.src =
                        "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                  />
                ) : (
                  <div style={{ textAlign: "center", color: "#999" }}>
                    <p>Chưa có ảnh</p>
                  </div>
                )}
              </div>
            }
            hoverable
          >
            <h3 style={{ marginBottom: 8, marginTop: 0 }}>{court.courtName}</h3>

            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#1890ff" }}>
                {court.pricePerHour?.toLocaleString() || 0} VND
              </span>
              <span style={{ fontSize: 12, color: "#999" }}> / giờ</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Tag color={court.status === "ACTIVE" ? "green" : "red"}>
                {court.status || "UNKNOWN"}
              </Tag>
              <Tag color="blue">{court.courtCopies?.length || 0} sân con</Tag>
            </div>

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                block
                icon={<SettingOutlined />}
                onClick={() => onManage(court)}
              >
                Quản lý sân con
              </Button>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  flex={1}
                  icon={<EditOutlined />}
                  type="primary"
                  onClick={() => onEdit(court)}
                >
                  Sửa
                </Button>

                <Button
                  onClick={() =>
                    navigate(`/owner/courts/${court.courtId}/prices`)
                  }
                >
                  Quản lý giá
                </Button>
                <Popconfirm
                  title="Xóa sân"
                  description="Bạn chắc chắn muốn xóa sân này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete?.(court.courtId)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

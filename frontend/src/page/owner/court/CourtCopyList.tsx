import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Popconfirm,
  Empty,
  Skeleton,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { CourtCopyResponse } from "../../../types/court";

interface Props {
  courtCopies?: CourtCopyResponse[];
  loading?: boolean;
  onEdit?: (copy: CourtCopyResponse) => void;
  onDelete?: (copyId: string) => void;
  onViewSlots?: (copy: CourtCopyResponse) => void;
}

export default function CourtCopyList({
  courtCopies = [],
  loading = false,
  onEdit,
  onDelete,
  onViewSlots,
}: Props) {
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

  if (courtCopies.length === 0) {
    return <Empty description="Chưa có sân con nào" />;
  }

  return (
    <Row gutter={[16, 16]}>
      {courtCopies.map((copy) => (
        <Col span={8} key={copy.courtCopyId}>
          <Card hoverable>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ marginBottom: 8, marginTop: 0 }}>
                {copy.courtCode}
              </h3>
              <Tag color={copy.status === "ACTIVE" ? "green" : "red"}>
                {copy.status}
              </Tag>
            </div>

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                block
                icon={<UnorderedListOutlined />}
                onClick={() => onViewSlots?.(copy)}
              >
                Xem lịch đặt
              </Button>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  flex={1}
                  icon={<EditOutlined />}
                  type="primary"
                  onClick={() => onEdit?.(copy)}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa sân con"
                  description="Bạn chắc chắn muốn xóa sân con này?"
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete?.(copy.courtCopyId)}
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

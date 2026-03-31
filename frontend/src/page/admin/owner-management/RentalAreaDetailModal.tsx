import React from "react";
import {
  Modal,
  Tabs,
  Descriptions,
  Tag,
  Image,
  Typography,
  Table,
  Button,
  Empty,
  Space,
} from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  FileProtectOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  selectedArea: any;
  onCancel: () => void;
  onApprove: (id: string) => void;
}

const RentalAreaDetailModal: React.FC<Props> = ({
  open,
  selectedArea,
  onCancel,
  onApprove,
}) => {
  if (!selectedArea) return null;

  const courtColumns = [
    {
      title: "Hình ảnh",
      dataIndex: "images",
      key: "images",
      width: 100,
      render: (imgs: string[]) => (
        <Image
          src={imgs[0]}
          width={80}
          height={60}
          style={{ objectFit: "cover", borderRadius: 4 }}
          fallback="https://via.placeholder.com/80x60?text=No+Img"
        />
      ),
    },
    {
      title: "Tên loại sân",
      dataIndex: "courtName",
      key: "courtName",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Số lượng sân thực tế",
      dataIndex: "courtCopiesCount",
      key: "courtCopiesCount",
      align: "center" as const,
      render: (count: number) => <Tag color="blue">{count} sân</Tag>,
    },
    {
      title: "Khoảng giá",
      dataIndex: "priceRange",
      key: "priceRange",
      render: (price: string) => <Text type="danger">{price}</Text>,
    },
    {
      title: "Tiện ích",
      dataIndex: "amenities",
      key: "amenities",
      render: (amenities: string[]) => (
        <Space wrap size={[0, 4]}>
          {amenities.map((a) => (
            <Tag key={a} color="cyan" style={{ fontSize: "11px" }}>
              {a}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Chi tiết phê duyệt cơ sở
        </Title>
      }
      open={open}
      onCancel={onCancel}
      width={1000}
      centered
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        selectedArea?.verificationStatus === "PENDING" && (
          <Button
            key="approve"
            type="primary"
            style={{ background: "#52c41a", borderColor: "#52c41a" }}
            onClick={() => onApprove(selectedArea.id)}
          >
            {" "}
            Phê duyệt cơ sở{" "}
          </Button>
        ),
      ]}
    >
      <Tabs defaultActiveKey="1">
        {/* TAB 1: THÔNG TIN CHUNG */}
        <Tabs.TabPane
          tab={
            <span>
              <HomeOutlined /> Thông tin chung
            </span>
          }
          key="1"
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Tên cơ sở" span={2}>
              <Text strong style={{ fontSize: 16 }}>
                {selectedArea.name}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  <HomeOutlined /> Chủ sở hữu
                </span>
              }
            >
              {selectedArea.ownerName}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  <PhoneOutlined /> Liên hệ
                </span>
              }
            >
              {selectedArea.ownerPhone}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  <EnvironmentOutlined /> Địa chỉ
                </span>
              }
              span={2}
            >
              {selectedArea.address}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24 }}>
            <Title level={5}>Hình ảnh không gian</Title>
            {selectedArea.images?.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {selectedArea.images.map((url: string, index: number) => (
                    <Image
                      key={index}
                      src={url}
                      width={160}
                      height={110}
                      style={{
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                      }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <Empty
                description="Chưa có hình ảnh không gian"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Tabs.TabPane>

        {/* TAB 2: DANH SÁCH SÂN CON */}
        <Tabs.TabPane
          tab={
            <span>
              <AppstoreOutlined /> Loại sân & Giá (
              {selectedArea.courts?.length || 0})
            </span>
          }
          key="2"
        >
          <Table
            dataSource={selectedArea.courts}
            columns={courtColumns}
            rowKey="courtId"
            pagination={false}
            bordered
            size="middle"
            locale={{ emptyText: "Cơ sở này chưa cấu hình loại sân" }}
          />
        </Tabs.TabPane>

        {/* TAB 3: PHÁP LÝ */}
        <Tabs.TabPane
          tab={
            <span>
              <FileProtectOutlined /> Hồ sơ pháp lý
            </span>
          }
          key="3"
        >
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Mã số thuế">
              {selectedArea.legalInfo?.taxId}
            </Descriptions.Item>
            <Descriptions.Item label="Giấy phép KD">
              {selectedArea.legalInfo?.license}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {selectedArea.legalInfo?.note}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 20 }}>
            <Text strong>Ảnh chụp chứng từ/Giấy phép:</Text>
            <div style={{ marginTop: 12 }}>
              {/* Giả định ảnh pháp lý nằm trong mảng images của cơ sở hoặc riêng */}
              <Image.PreviewGroup>
                {selectedArea.images?.slice(0, 2).map((url: any, i: number) => (
                  <Image
                    key={i}
                    src={url}
                    width={200}
                    style={{ marginRight: 10, borderRadius: 4 }}
                  />
                ))}
              </Image.PreviewGroup>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default RentalAreaDetailModal;

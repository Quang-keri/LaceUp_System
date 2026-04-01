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

// Hàm format tiền tệ VNĐ
const formatVND = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

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
      render: (imgs: any[]) => (
        <Image
          src={imgs?.[0]?.imageUrl} // FIX: Lấy field imageUrl từ object
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
      title: "Số lượng sân",
      key: "courtCopiesCount",
      align: "center" as const,
      // FIX: Đếm số lượng object trong mảng courtCopies
      render: (_: any, record: any) => (
        <Tag color="blue">{record.courtCopies?.length || 0} sân</Tag>
      ),
    },
    {
      title: "Khoảng giá",
      key: "priceRange",
      // FIX: Lấy minPrice và maxPrice từ JSON
      render: (_: any, record: any) => {
        if (!record.minPrice && !record.maxPrice)
          return <Text type="secondary">Chưa cập nhật</Text>;
        if (record.minPrice === record.maxPrice) {
          return <Text type="danger">{formatVND(record.minPrice)}</Text>;
        }
        return (
          <Text type="danger">
            {formatVND(record.minPrice)} - {formatVND(record.maxPrice)}
          </Text>
        );
      },
    },
    {
      title: "Tiện ích sân",
      dataIndex: "amenities",
      key: "amenities",
      // FIX: Map amenityName từ object
      render: (amenities: any[]) => (
        <Space wrap size={[0, 4]}>
          {amenities?.map((a) => (
            <Tag key={a.amenityId} color="cyan" style={{ fontSize: "11px" }}>
              {a.amenityName}
            </Tag>
          ))}
          {(!amenities || amenities.length === 0) && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Không có
            </Text>
          )}
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
            Phê duyệt cơ sở
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
                  <HomeOutlined /> Liên hệ
                </span>
              }
            >
              {selectedArea.ownerName}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  <PhoneOutlined /> Số điện thoại
                </span>
              }
            >
              <Text strong>{selectedArea.ownerPhone}</Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  <EnvironmentOutlined /> Địa chỉ
                </span>
              }
              span={2}
            >
              {selectedArea.addressString || selectedArea.address}
            </Descriptions.Item>

            {/* HIỂN THỊ DỊCH VỤ TIỆN ÍCH CÓ GIÁ TIỀN & SỐ LƯỢNG */}
            <Descriptions.Item label="Dịch vụ tại cơ sở" span={2}>
              {selectedArea.serviceItems &&
              selectedArea.serviceItems.length > 0 ? (
                <Space wrap size={[0, 8]}>
                  {selectedArea.serviceItems.map((service: any) => (
                    <Tag
                      key={service.id}
                      color="purple"
                      style={{ padding: "4px 8px", fontSize: 13 }}
                    >
                      <b>{service.serviceName}</b>
                      <Text
                        type="secondary"
                        style={{ marginLeft: 4, fontSize: 12 }}
                      >
                        (Kho: {service.quantity} |{" "}
                        {formatVND(service.priceSell)}/{service.rentalDuration})
                      </Text>
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">Chưa cập nhật dịch vụ</Text>
              )}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 24 }}>
            <Title level={5}>Hình ảnh không gian</Title>
            {selectedArea.images?.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap size={[12, 12]}>
                  {selectedArea.images.map((img: any, index: number) => {
                    const maxVisible = 4; // Số lượng ảnh tối đa hiển thị trên Modal
                    const isHidden = index >= maxVisible;
                    const isLastVisible = index === maxVisible - 1;
                    const remainingCount =
                      selectedArea.images.length - maxVisible;

                    return (
                      <div
                        key={index}
                        style={{
                          display: isHidden ? "none" : "block", // Ẩn các ảnh vượt quá giới hạn
                          position: "relative",
                          cursor: "pointer",
                        }}
                      >
                        <Image
                          src={img.imageUrl}
                          width={160}
                          height={110}
                          style={{
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                          }}
                          fallback="https://via.placeholder.com/160x110?text=Lỗi+Ảnh"
                        />

                        {/* Lớp phủ đen "+N" hiển thị đè lên ảnh cuối cùng */}
                        {isLastVisible && remainingCount > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(0, 0, 0, 0.5)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "20px",
                              fontWeight: "bold",
                              borderRadius: 8,
                              pointerEvents: "none", // Bỏ qua click để Image vẫn nhận được thao tác mở lightbox
                            }}
                          >
                            +{remainingCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              <Image.PreviewGroup>
                {/* FIX: Map imageUrl */}
                {selectedArea.images?.slice(0, 2).map((img: any, i: number) => (
                  <Image
                    key={i}
                    src={img.imageUrl}
                    width={200}
                    style={{ marginRight: 10, borderRadius: 4 }}
                    fallback="https://via.placeholder.com/200x150?text=Lỗi+Ảnh"
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

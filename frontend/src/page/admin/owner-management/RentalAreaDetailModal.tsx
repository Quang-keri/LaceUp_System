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
  message,
} from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  FileProtectOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  BankOutlined,
  CopyOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
const rentalStatusMap: any = {
  ACTIVE: { color: "green", label: "Đang kinh doanh" },
  INACTIVE: { color: "orange", label: "Ngừng kinh doanh" },
  SUSPENDED: { color: "red", label: "Bị khóa" },
};
interface Props {
  open: boolean;
  selectedArea: any;
  onCancel: () => void;
  onApprove: (id: string) => void;
}

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

  const bankAccount =
    selectedArea.bankAccount ||
    selectedArea.bankAccountResponse ||
    selectedArea.owner?.bankAccount ||
    selectedArea.owner?.bankAccountResponse;

  const copyText = async (text?: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      message.success("Đã copy số tài khoản");
    } catch {
      message.error("Không thể copy");
    }
  };

  const courtColumns = [
    {
      title: "Hình ảnh",
      key: "images",
      width: 220,
      render: (_: any, record: any) => {
        const courtImages =
          record.images?.length > 0
            ? record.images
            : record.coverImage
            ? [{ imageUrl: record.coverImage }]
            : [];

        const visibleImages = courtImages.slice(0, 3);

        if (visibleImages.length === 0) {
          return <Text type="secondary">Chưa có ảnh</Text>;
        }

        return (
          <Image.PreviewGroup>
            <Space size={6}>
              {visibleImages.map((img: any, index: number) => (
                <Image
                  key={img.courtImageId || img.imageUrl || index}
                  src={img.imageUrl}
                  width={60}
                  height={50}
                  style={{
                    objectFit: "cover",
                    borderRadius: 6,
                    border: "1px solid #f0f0f0",
                  }}
                  fallback="https://via.placeholder.com/60x50?text=No+Img"
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        );
      },
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
      render: (_: any, record: any) => (
        <Tag color="blue">{record.courtCopies?.length || 0} sân</Tag>
      ),
    },
    {
      title: "Khoảng giá",
      key: "priceRange",
      render: (_: any, record: any) => {
        if (!record.minPrice && !record.maxPrice) {
          return <Text type="secondary">Chưa cập nhật</Text>;
        }

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
      width={1050}
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
                {selectedArea.name || selectedArea.rentalAreaName}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <HomeOutlined /> Liên hệ
                </span>
              }
            >
              {selectedArea.ownerName || selectedArea.contactName || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <span>
                  <PhoneOutlined /> Số điện thoại
                </span>
              }
            >
              <Text strong>
                {selectedArea.ownerPhone || selectedArea.contactPhone || "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái tòa nhà">
              <Tag
                color={rentalStatusMap[selectedArea.status]?.color || "default"}
              >
                {rentalStatusMap[selectedArea.status]?.label || "Chưa cập nhật"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  <EnvironmentOutlined /> Địa chỉ
                </span>
              }
              span={2}
            >
              {selectedArea.addressString || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Dịch vụ tại cơ sở" span={2}>
              {selectedArea.serviceItems?.length > 0 ? (
                <Space wrap size={[0, 8]}>
                  {selectedArea.serviceItems.map((service: any) => (
                    <Tag
                      key={service.id || service.serviceItemId}
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
                    const maxVisible = 4;
                    const isHidden = index >= maxVisible;
                    const isLastVisible = index === maxVisible - 1;
                    const remainingCount =
                      selectedArea.images.length - maxVisible;

                    return (
                      <div
                        key={img.rentalAreaImageId || index}
                        style={{
                          display: isHidden ? "none" : "block",
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
                              pointerEvents: "none",
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
            dataSource={selectedArea.courts || []}
            columns={courtColumns}
            rowKey={(record: any) => record.courtId || record.id}
            pagination={false}
            bordered
            size="middle"
            locale={{ emptyText: "Cơ sở này chưa cấu hình loại sân" }}
          />
        </Tabs.TabPane>

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
              {selectedArea.legalProfileResponse?.taxId || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Giấy phép KD">
              {selectedArea.legalProfileResponse?.businessLicenseNumber ||
                "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Tên doanh nghiệp">
              {selectedArea.legalProfileResponse?.companyName ||
                "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Người đại diện pháp lý">
              {selectedArea.legalProfileResponse?.responsiblePersonName ||
                "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Địa chỉ kinh doanh">
              {selectedArea.legalProfileResponse?.address || "Chưa cập nhật"}
            </Descriptions.Item>

            <Descriptions.Item label="Ghi chú">
              {selectedArea.legalProfileResponse?.legalNote || "Không có"}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 20 }}>
            <Text strong>Ảnh chụp chứng từ/Giấy phép:</Text>

            <div style={{ marginTop: 12 }}>
              {selectedArea.legalProfileResponse?.images?.length > 0 ? (
                <Image.PreviewGroup>
                  {selectedArea.legalProfileResponse.images.map(
                    (img: any, i: number) => (
                      <Image
                        key={img.imageUrl || i}
                        src={img.imageUrl}
                        width={200}
                        style={{ marginRight: 10, borderRadius: 4 }}
                        fallback="https://via.placeholder.com/200x150?text=Lỗi+Ảnh"
                      />
                    ),
                  )}
                </Image.PreviewGroup>
              ) : (
                <Text type="secondary">Chưa cập nhật ảnh pháp lý</Text>
              )}
            </div>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={
            <span>
              <BankOutlined /> Tài khoản ngân hàng
            </span>
          }
          key="4"
        >
          {bankAccount ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Ngân hàng">
                <Text strong>{bankAccount.bankName || "Chưa cập nhật"}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Số tài khoản">
                <Space>
                  <Text strong copyable>
                    {bankAccount.accountNumber || "Chưa cập nhật"}
                  </Text>

                  {bankAccount.accountNumber && (
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyText(bankAccount.accountNumber)}
                    >
                      Copy
                    </Button>
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Chủ tài khoản">
                <Text strong>
                  {bankAccount.accountHolderName || "Chưa cập nhật"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Chi nhánh">
                {bankAccount.branchName || "Không có"}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái xác minh">
                {bankAccount.isVerified ? (
                  <Tag color="green">Đã xác minh</Tag>
                ) : (
                  <Tag color="orange">Chưa xác minh</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty
              description="Owner chưa cập nhật tài khoản ngân hàng"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  );
};

export default RentalAreaDetailModal;

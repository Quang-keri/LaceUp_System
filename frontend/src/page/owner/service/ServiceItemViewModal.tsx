import React from "react";
import { Modal, Descriptions, Tag, Image, Typography, Divider } from "antd";

const { Title, Text } = Typography;

interface ServiceItemViewModalProps {
  visible: boolean;
  record: any | null;
  onCancel: () => void;
}

const ServiceItemViewModal: React.FC<ServiceItemViewModalProps> = ({
  visible,
  record,
  onCancel,
}) => {
  if (!record) return null;

  return (
    <Modal
      open={visible}
      title={
        <Title level={4} style={{ margin: 0 }}>
          Chi tiết Dịch vụ / Thiết bị
        </Title>
      }
      footer={null}
      onCancel={onCancel}
      width={700}
    >
      <Descriptions bordered column={2} size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="Tên dịch vụ" span={2}>
          <Text strong>{record.serviceName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Nhóm thiết bị">
          <Tag color="blue">{record.itemGroupName}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Đơn vị tính">
          {record.rentalDuration || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Số lượng kho">
          {record.quantity}
        </Descriptions.Item>
        <Descriptions.Item label="Tòa nhà">
          <Text copyable>{record.rentalAreaId}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Giá bán">
          <Text type="success" strong>
            {record.priceSell?.toLocaleString()} VND
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Giá gốc">
          <Text type="secondary">
            {record.priceOriginal?.toLocaleString()} VND
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Nhà cung cấp" span={2}>
          {record.manufacturer || (
            <Text type="secondary">Không có thông tin</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Ghi chú" span={2}>
          {record.serviceNote || <Text type="secondary">Không có ghi chú</Text>}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation={"left" as any}>Hình ảnh Dịch vụ</Divider>
      {record.images && record.images.length > 0 ? (
        <Image.PreviewGroup>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {record.images.map((img: string, index: number) => (
              <Image
                key={index}
                width={120}
                height={120}
                src={img}
                style={{ objectFit: "cover", borderRadius: 8 }}
                alt={`service-img-${index}`}
              />
            ))}
          </div>
        </Image.PreviewGroup>
      ) : (
        <Text type="secondary">Chưa có hình ảnh nào.</Text>
      )}
    </Modal>
  );
};

export default ServiceItemViewModal;

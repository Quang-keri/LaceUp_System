import React from "react";
import { Table, Button } from "antd";

interface ServiceItemTableProps {
  items: any[];
  loading: boolean;
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
}

const ServiceItemTable: React.FC<ServiceItemTableProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "images",
      key: "images",
      render: (imgs: string[]) =>
        imgs && imgs.length > 0 ? (
          <img
            src={imgs[0]}
            alt="service"
            style={{
              width: 80,
              height: 60,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 60,
              background: "#f0f0f0",
              borderRadius: 4,
            }}
          />
        ),
    },
    { title: "Tên dịch vụ", dataIndex: "serviceName", key: "serviceName" },
    { title: "Giá bán", dataIndex: "priceSell", key: "priceSell" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    { title: "Thời gian", dataIndex: "rentalDuration", key: "rentalDuration" },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="default" onClick={() => onEdit(record)}>
            Sửa
          </Button>
          <Button danger onClick={() => onDelete(record.id)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      rowKey={(r) => r.id}
      dataSource={items}
      columns={columns}
      loading={loading}
    />
  );
};

export default ServiceItemTable;

import React from "react";
import { Table, Button } from "antd";

interface ServiceItemTableProps {
  items: any[];
  loading: boolean;
  pagination: any;
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
  onView: (record: any) => void;
}
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};
const ServiceItemTable: React.FC<ServiceItemTableProps> = ({
  items,
  loading,
  onEdit,
  onDelete,
  onView,
  pagination,
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
    {
      title: "Giá bán",
      dataIndex: "priceSell",
      key: "priceSell",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Giá vốn",
      dataIndex: "priceOriginal",
      key: "priceOriginal",
      render: (value: number) => formatCurrency(value),
    },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },

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
          <Button onClick={() => onView(record)}>Xem</Button>
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
      pagination={pagination}
    />
  );
};

export default ServiceItemTable;

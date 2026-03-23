import React from "react";
import { Table, Button, Space, Tag } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { CategoryResponse } from "../../../types/category";
import dayjs from "dayjs";

interface CategoryTableProps {
  data: CategoryResponse[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onTableChange: (pagination: TablePaginationConfig) => void;
  onDetail: (category: CategoryResponse) => void;
  onEdit: (category: CategoryResponse) => void;
  onDelete: (categoryId: string) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  data,
  loading,
  pagination,
  onTableChange,
  onDetail,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<CategoryResponse> = [
    {
      title: "Mã loại sân",
      dataIndex: "categoryId",
      key: "categoryId",
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Tên loại sân",
      dataIndex: "categoryName",
      key: "categoryName",
      width: 200,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) =>
        text || <span className="text-gray-400">-</span>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Ops",
      key: "operations",
      width: 150,
      fixed: "right",
      render: (_: any, record: CategoryResponse) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onDetail(record)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Chỉnh sửa"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record.categoryId)}
            title="Xóa"
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={(newPagination) => onTableChange(newPagination)}
      rowKey="categoryId"
      scroll={{ x: 800 }}
      locale={{
        emptyText: "Không có dữ liệu",
      }}
    />
  );
};

export default CategoryTable;

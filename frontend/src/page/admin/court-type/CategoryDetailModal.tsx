import React from "react";
import { Modal, Descriptions, Tag, Divider } from "antd";
import type { CategoryResponse } from "../../../types/category";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  category: CategoryResponse | null;
  onCancel: () => void;
}

const CategoryDetailModal: React.FC<Props> = ({ open, category, onCancel }) => {
  if (!category) return null;

  return (
    <Modal
      title="Chi tiết loại sân"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Divider />
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Mã loại sân">
          <Tag color="blue">{category.categoryId}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tên loại sân">
          <span className="text-base font-semibold">
            {category.categoryName}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">
          {category.description ? (
            <span>{category.description}</span>
          ) : (
            <span className="text-gray-400">Không có mô tả</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {category.createdAt
            ? dayjs(category.createdAt).format("DD/MM/YYYY HH:mm:ss")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật lần cuối">
          {category.updatedAt
            ? dayjs(category.updatedAt).format("DD/MM/YYYY HH:mm:ss")
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default CategoryDetailModal;

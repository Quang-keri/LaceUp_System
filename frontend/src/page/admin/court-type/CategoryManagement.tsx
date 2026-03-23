import React, { useEffect, useState } from "react";
import { Card, Button, message, Modal, Space } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import type { CategoryResponse } from "../../../types/category";

import CategoryFilter from "./CategoryFilter";
import CategoryTable from "./CategoryTable";
import CategoryDetailModal from "./CategoryDetailModal";
import CategoryEditModal from "./CategoryEditModal";
import CategoryAddModal from "./CategoryAddModal";
import categoryService from "../../../service/categoryService";

const CategoryManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<CategoryResponse[]>([]);

  // --- STATE ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryResponse | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryResponse | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState({
    keyword: "" as string,
    from: undefined as string | undefined,
    to: undefined as string | undefined,
  });

  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "50"],
  });

  // --- API CALLS ---
  const fetchCategories = async (
    page: number,
    size: number,
    currentFilters = filters,
  ) => {
    setLoading(true);
    try {
      const response: any = await categoryService.getAllCategories(
        page,
        size,
        currentFilters.keyword || undefined,
        currentFilters.from,
        currentFilters.to,
      );

      const actualResponse = response.data ? response.data : response;

      if (actualResponse && actualResponse.code === 200) {
        const pageData = actualResponse.result;
        setData(pageData.data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          total: pageData.totalElements,
          pageSize: size,
        }));
      } else {
        message.error(actualResponse?.message || "Lấy danh sách thất bại");
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
      message.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(
      pagination.current || 1,
      pagination.pageSize || 10,
      filters,
    );
  }, []);

  // --- HANDLERS LOGIC ---

  const handleCreateSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response: any = await categoryService.createCategory(values);

      const actualResponse = response.data ? response.data : response;
      if (actualResponse.code === 201) {
        message.success("Thêm loại sân thành công");
        setIsCreateModalOpen(false);
        fetchCategories(
          pagination.current || 1,
          pagination.pageSize || 10,
          filters,
        );
      } else {
        message.error(actualResponse?.message || "Thêm thất bại");
      }
    } catch (error) {
      console.error("Create category error:", error);
      message.error("Đã xảy ra lỗi khi thêm loại sân");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingCategory) return;

    setLoading(true);
    try {
      const response: any = await categoryService.updateCategory(
        editingCategory.categoryId,
        values,
      );

      const actualResponse = response.data ? response.data : response;
      if (actualResponse.code === 200) {
        message.success("Cập nhật loại sân thành công");
        setIsEditModalOpen(false);
        fetchCategories(
          pagination.current || 1,
          pagination.pageSize || 10,
          filters,
        );
      } else {
        message.error(actualResponse?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Edit category error:", error);
      message.error("Đã xảy ra lỗi khi cập nhật loại sân");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (categoryId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa loại sân này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        setLoading(true);
        try {
          const response: any = await categoryService.deleteCategory(
            categoryId,
          );

          const actualResponse = response.data ? response.data : response;
          if (actualResponse.code === 200) {
            message.success("Xóa loại sân thành công");
            fetchCategories(
              pagination.current || 1,
              pagination.pageSize || 10,
              filters,
            );
          } else {
            message.error(actualResponse?.message || "Xóa thất bại");
          }
        } catch (error) {
          console.error("Delete category error:", error);
          message.error("Đã xảy ra lỗi khi xóa loại sân");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // --- OPEN MODALS ---
  const handleOpenDetail = (category: CategoryResponse) => {
    setSelectedCategory(category);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryResponse) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
  };

  // --- FILTER HANDLERS ---
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }));
    fetchCategories(1, pagination.pageSize || 10, newFilters);
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchCategories(
      newPagination.current || 1,
      newPagination.pageSize || 10,
      filters,
    );
  };

  const handleRefresh = () => {
    fetchCategories(
      pagination.current || 1,
      pagination.pageSize || 10,
      filters,
    );
  };

  // --- RENDER ---
  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý loại sân</h1>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            size="large"
          >
            Thêm loại sân
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          />
        </Space>
      </div>

      {/* Filter Card */}
      <CategoryFilter onFilterChange={handleFilterChange} />

      {/* Table Card */}
      <Card>
        <CategoryTable
          data={data}
          loading={loading}
          pagination={pagination}
          onTableChange={handleTableChange}
          onDetail={handleOpenDetail}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      </Card>

      {/* Modals */}
      <CategoryAddModal
        open={isCreateModalOpen}
        loading={loading}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {selectedCategory && (
        <CategoryDetailModal
          open={isDetailModalOpen}
          category={selectedCategory}
          onCancel={() => setIsDetailModalOpen(false)}
        />
      )}

      {editingCategory && (
        <CategoryEditModal
          open={isEditModalOpen}
          loading={loading}
          category={editingCategory}
          onCancel={() => setIsEditModalOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default CategoryManagement;

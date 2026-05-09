import React, { useEffect, useState } from "react";
import { Button, message, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import serviceItemService from "../../../service/serviceItemService";
import ServiceItemTable from "./ServiceItemTable";
import ServiceItemCreateModal from "./ServiceItemCreateModal";
import ServiceItemUpdateModal from "./ServiceItemUpdateModal";
import ServiceItemViewModal from "./ServiceItemViewModal";

const ServiceItemManagementPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Pagination & Search States
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals States
  const [createVisible, setCreateVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const loadData = async (
    searchKeyword = keyword,
    currentPage = page,
    pageSize = size,
  ) => {
    setLoading(true);
    try {
      // Gọi API phân trang thay vì lấy tất cả
      const res = await serviceItemService.searchOwnerServiceItems(
        searchKeyword,
        currentPage,
        pageSize,
      );
  
      setItems(res.result?.content || []);
      setTotal(res.result?.totalElements || 0);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(keyword, page, size);
  }, [page, size]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
    loadData(value, 1, size);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await serviceItemService.deleteServiceItem(id);
      message.success("Đã xóa dịch vụ");
      loadData();
    } catch (e) {
      message.error("Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4" style={{ backgroundColor: "#fff", borderRadius: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 className="font-bold">Quản lý dịch vụ & Thiết bị</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <Input.Search
            placeholder="Tìm theo tên dịch vụ..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Button type="primary" onClick={() => setCreateVisible(true)}>
            + Thêm dịch vụ
          </Button>
        </div>
      </div>

      <ServiceItemTable
        items={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize: size,
          total: total,
          showSizeChanger: true,
          onChange: (newPage: number, newSize: number) => {
            setPage(newPage);
            setSize(newSize);
          },
        }}
        onEdit={(record) => {
          setSelectedRecord(record);
          setUpdateVisible(true);
        }}
        onDelete={handleDelete}
        onView={(record) => {
          setSelectedRecord(record);
          setViewVisible(true);
        }}
      />

      <ServiceItemCreateModal
        visible={createVisible}
        onCancel={() => setCreateVisible(false)}
        onSuccess={() => {
          setCreateVisible(false);
          loadData();
        }}
      />

      {updateVisible && (
        <ServiceItemUpdateModal
          visible={updateVisible}
          editingRecord={selectedRecord}
          onCancel={() => setUpdateVisible(false)}
          onSuccess={() => {
            setUpdateVisible(false);
            loadData();
          }}
        />
      )}

      <ServiceItemViewModal
        visible={viewVisible}
        record={selectedRecord}
        onCancel={() => setViewVisible(false)}
      />
    </div>
  );
};

export default ServiceItemManagementPage;

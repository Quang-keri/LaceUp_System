import React, { useEffect, useState } from "react";
import { Button, message } from "antd";
import serviceItemService from "../../../service/serviceItemService";
import ServiceItemTable from "./ServiceItemTable"; 
import ServiceItemFormModal from "./ServiceItemFormModal";

const ServiceItemManagementPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await serviceItemService.getOwnerServiceItems();
      setItems(res.result || res || []);
    } catch (e) {
      console.error(e);
      message.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await serviceItemService.deleteServiceItem(id);
      message.success("Đã xóa dịch vụ");
      await load();
    } catch (e) {
      console.error(e);
      message.error("Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    load(); // Load lại data bảng sau khi lưu thành công
  };

  return (
    <div className="p-4" style={{ backgroundColor: "#fff", borderRadius: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>Quản lý dịch vụ & Thiết bị</h2>
        <Button type="primary" onClick={handleOpenCreate}>
          + Thêm dịch vụ
        </Button>
      </div>

      <ServiceItemTable
        items={items}
        loading={loading}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
      />

      <ServiceItemFormModal
        visible={modalVisible}
        editingRecord={editingRecord}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default ServiceItemManagementPage;

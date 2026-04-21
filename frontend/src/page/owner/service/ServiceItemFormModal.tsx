import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  Button,
  Select,
  message,
} from "antd";
import serviceItemService from "../../../service/serviceItemService";
import rentalService from "../../../service/rental/rentalService";

import type { ServiceItemRequest } from "../../../service/serviceItemService";
import itemGroupService from "../../../service/itemGroupService";

const { TextArea } = Input;
const { Option } = Select;

interface ServiceItemFormModalProps {
  visible: boolean;
  editingRecord: any | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const toFileList = (images: string[] = []) =>
  images.map((url, idx) => ({
    uid: `${idx}`,
    name: `img-${idx}`,
    status: "done",
    url,
  }));

const normFile = (e: any) => {
  if (Array.isArray(e)) return e;
  return e && e.fileList;
};

const ServiceItemFormModal: React.FC<ServiceItemFormModalProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [itemGroups, setItemGroups] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      fetchDropdownData();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && editingRecord) {
      form.setFieldsValue({
        ...editingRecord,
        images: toFileList(editingRecord.images),
      });
    } else if (visible && !editingRecord) {
      form.resetFields();
    }
  }, [editingRecord, visible, form]);

  const fetchDropdownData = async () => {
    try {
      // 1. Fetch danh sách Tòa nhà (Rental Areas)
      const rentalRes = await rentalService.getMyRentalAreas(1, 100);

      // Dựa vào JSON trả về, list data nằm ở rentalRes.result.data
      const areasData = rentalRes?.result?.data || [];
      setRentalAreas(areasData);

      const groupRes = await itemGroupService.getAll();
      const groupsData = groupRes?.result || groupRes || [];
      setItemGroups(groupsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu dropdown", error);
      message.error("Không thể tải danh sách tòa nhà/nhóm thiết bị");
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const files = (values.images || []).map((f: any) => f.originFileObj || f);

      const payload: ServiceItemRequest = {
        rentalAreaId: values.rentalAreaId,
        itemGroupId: values.itemGroupId,
        serviceName: values.serviceName,
        quantity: values.quantity,
        rentalDuration: values.rentalDuration,
        priceSell: values.priceSell,
        priceOriginal: values.priceOriginal,
        serviceNote: values.serviceNote,
        images: files,
      };

      setLoading(true);
      if (editingRecord) {
        await serviceItemService.updateServiceItem(editingRecord.id, payload);
        message.success("Cập nhật thành công");
      } else {
        await serviceItemService.createServiceItem(payload);
        message.success("Tạo dịch vụ thành công");
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.errorFields) return;
      message.error(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={
        editingRecord
          ? "Cập nhật dịch vụ / thiết bị"
          : "Thêm dịch vụ / thiết bị mới"
      }
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Lưu thông tin"
      cancelText="Hủy"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="rentalAreaId"
            label="Chọn Tòa nhà (Rental Area)"
            rules={[{ required: true, message: "Vui lòng chọn tòa nhà" }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="-- Chọn tòa nhà --"
              showSearch
              optionFilterProp="children"
            >
              {rentalAreas.map((area) => (
                // Hiển thị name (rentalAreaName), submit giá trị id (rentalAreaId)
                <Option key={area.rentalAreaId} value={area.rentalAreaId}>
                  {area.rentalAreaName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="itemGroupId"
            label="Nhóm thiết bị"
            rules={[{ required: true, message: "Vui lòng chọn nhóm" }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="-- Chọn nhóm --"
              showSearch
              optionFilterProp="children"
            >
              {itemGroups.map((group) => (
                <Option key={group.itemGroupId} value={group.itemGroupId}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="serviceName"
          label="Tên dịch vụ / thiết bị"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input placeholder="Ví dụ: Thuê máy chiếu" />
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="rentalDuration"
            label="Đơn vị tính (Thời gian/Gói)"
            style={{ flex: 1 }}
          >
            <Input placeholder="Ví dụ: Theo giờ, Theo ngày..." />
          </Form.Item>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="priceSell"
            label="Giá bán"
            rules={[{ required: true, message: "Vui lòng nhập giá bán" }]}
            style={{ flex: 1 }}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>

          <Form.Item name="priceOriginal" label="Giá gốc" style={{ flex: 1 }}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </div>

        <Form.Item name="serviceNote" label="Ghi chú thêm">
          <TextArea rows={3} placeholder="Mô tả chi tiết về dịch vụ..." />
        </Form.Item>

        <Form.Item
          name="images"
          label="Hình ảnh"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload listType="picture-card" beforeUpload={() => false} multiple>
            <div>
              <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceItemFormModal;

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Upload, Select, message } from "antd";
import serviceItemService from "../../../service/serviceItemService";
import rentalService from "../../../service/rental/rentalService";
import itemGroupService from "../../../service/itemGroupService";

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList);

const ServiceItemCreateModal: React.FC<Props> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [itemGroups, setItemGroups] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      fetchData();
    }
  }, [visible]);

  const fetchData = async () => {
    try {
      const rentalRes = await rentalService.getMyRentalAreas(1, 100);
      setRentalAreas(rentalRes?.result?.data || []);
      const groupRes = await itemGroupService.getAll();
      setItemGroups(groupRes?.result || groupRes || []);
    } catch (e) {
      message.error("Lỗi tải dropdown");
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const files = (values.images || []).map((f: any) => f.originFileObj || f);

      const payload = { ...values, images: files };
      setLoading(true);
      await serviceItemService.createServiceItem(payload);
      message.success("Tạo dịch vụ thành công");
      onSuccess();
    } catch (err: any) {
      if (!err.errorFields) message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title="Thêm dịch vụ / thiết bị mới"
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={600}
    >
      <Form form={form} layout="vertical">
        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="rentalAreaId"
            label="Tòa nhà"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select showSearch>
              <Option value="">Chọn...</Option>
              {rentalAreas.map((a) => (
                <Option key={a.rentalAreaId} value={a.rentalAreaId}>
                  {a.rentalAreaName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="itemGroupId"
            label="Nhóm thiết bị"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select showSearch>
              {itemGroups.map((g) => (
                <Option key={g.itemGroupId} value={g.itemGroupId}>
                  {g.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <Form.Item
          name="serviceName"
          label="Tên dịch vụ"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="rentalDuration"
            label="Đơn vị tính"
            style={{ flex: 1 }}
          >
            <Input />
          </Form.Item>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="priceSell"
            label="Giá bán"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="priceOriginal" label="Giá gốc" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item name="manufacturer" label="Nhà cung cấp">
          <Input />
        </Form.Item>
        <Form.Item name="serviceNote" label="Ghi chú">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="images"
          label="Hình ảnh"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload listType="picture-card" beforeUpload={() => false} multiple>
            <div>Tải ảnh lên</div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default ServiceItemCreateModal;

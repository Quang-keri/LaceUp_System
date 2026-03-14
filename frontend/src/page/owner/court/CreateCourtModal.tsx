import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import CourtService from "../../../service/courtService";

export default function CreateCourtModal({
  open,
  onClose,
  categories,
  buildingId,
  onSuccess,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const handleSubmit = async (values: any) => {
    try {
      if (fileList.length < 2) {
        message.error("Phải upload ít nhất 2 ảnh");
        return;
      }

      const courtCodes = values.courtCodes
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c);

      const images = fileList.map((f) => f.originFileObj);

      await CourtService.createCourt(
        {
          courtName: values.courtName,
          categoryId: values.categoryId,
          price: values.price,
          rentalAreaId: buildingId,
          courtCodes,
        },
        images
      );

      message.success("Tạo sân thành công");

      form.resetFields();
      setFileList([]);
      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi khi tạo sân");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo sân"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item
          label="Tên sân"
          name="courtName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại sân"
          name="categoryId"
          rules={[{ required: true }]}
        >
          <Select
            options={categories.map((c: any) => ({
              label: c.categoryName,
              value: c.categoryId,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Giá / giờ"
          name="price"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item
          label="Mã sân"
          name="courtCodes"
          tooltip="Ví dụ: A,B,C (mỗi mã là 1 CourtCopy)"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Ảnh sân (2-3 ảnh)">
          <Upload
            listType="picture-card"
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            maxCount={3}
          >
            {fileList.length >= 3 ? null : <PlusOutlined />}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}
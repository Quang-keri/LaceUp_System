import { Modal, Form, Input, InputNumber, Select, Upload, message } from "antd";
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

  const categoriesList = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.result)
    ? categories.result
    : Array.isArray(categories?.data)
    ? categories.data
    : [];

  const handleSubmit = async (values: any) => {
    try {
      if (fileList.length < 1) {
        message.error("Phải upload ít nhất 1 ảnh");
        return;
      }

      // 1. Lấy location từ form values thay vì fix cứng "Khu vực chung"
      const courtCopyRequests = values.courtCodes
        .split(",")
        .map((c: string) => ({
          courtCode: c.trim(),
          location: values.location?.trim(), // <-- Gán giá trị người dùng nhập vào đây
        }))
        .filter((c: any) => c.courtCode);

      const images = fileList.map((f) => f.originFileObj);

      await CourtService.createCourt(
        {
          courtName: values.courtName,
          categoryId: values.categoryId,
          pricePerHour: values.price,
          rentalAreaId: buildingId,
          courtCopyRequests,
        },
        images,
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
          rules={[{ required: true, message: "Vui lòng nhập tên sân" }]}
        >
          <Input placeholder="Ví dụ: Sân Pickleball 123..." />
        </Form.Item>

        <Form.Item
          label="Loại sân"
          name="categoryId"
          rules={[{ required: true, message: "Vui lòng chọn loại sân" }]}
        >
          <Select
            placeholder="Chọn loại sân"
            options={categoriesList.map((c: any) => ({
              label: c.categoryName,
              value: c.categoryId,
            }))}
          />
        </Form.Item>

        {/* <Form.Item
          label="Giá / giờ (tạo sân xong "
          name="price"
         
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Ví dụ: 100000"
          />
        </Form.Item> */}

        <Form.Item
          label="Vị trí / Khu vực"
          name="location"
          tooltip="Ví dụ: Trong nhà, Ngoài trời, Khu A, Tầng 2..."
          rules={[{ required: true, message: "Vui lòng nhập vị trí sân" }]}
        >
          <Input placeholder="Nhập vị trí (VD: Trong nhà, Khu A...)" />
        </Form.Item>

        <Form.Item
          label="Mã sân"
          name="courtCodes"
          tooltip="Ví dụ: A,B,C (mỗi mã là 1 sân con). Tất cả sân con này sẽ dùng chung Vị trí đã nhập ở trên."
          rules={[{ required: true, message: "Vui lòng nhập mã sân" }]}
        >
          <Input placeholder="Ví dụ: Sân số 1, Sân số 2..." />
        </Form.Item>

        <Form.Item label="Ảnh sân (1-2 ảnh)">
          <Upload
            listType="picture-card"
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            maxCount={2}
          >
            {fileList.length >= 2 ? null : <PlusOutlined />}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}

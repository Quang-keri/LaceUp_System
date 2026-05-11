import React, { useState } from "react";
import { Form, Input, Upload, Modal, Button, message, Select } from "antd"; // Thêm Select
import { PlusOutlined } from "@ant-design/icons";
import newsService from "../../../service/newsService";

export default function CreateNewsModal({ isOpen, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  const handleFinish = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("visibility", values.visibility); // Thêm visibility vào form data

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images", file.originFileObj);
        }
      });

      await newsService.create(formData);
      message.success("Tạo tin tức thành công!");
      handleCancel();
      onSuccess();
    } catch (error) {
      console.error("Lỗi tạo tin tức:", error);
      message.error("Có lỗi xảy ra khi tạo tin tức!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold">Tạo Tin Tức Mới</span>}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        className="mt-4"
        initialValues={{ visibility: "PUBLIC" }}
      >
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
        >
          <Input placeholder="Nhập tiêu đề tin tức..." size="large" />
        </Form.Item>

        <Form.Item
          label="Phạm vi hiển thị"
          name="visibility"
          rules={[{ required: true, message: "Vui lòng chọn phạm vi!" }]}
        >
          <Select size="large">
            <Select.Option value="PUBLIC">Công khai</Select.Option>
            <Select.Option value="MEMBER">Thành viên</Select.Option>
            <Select.Option value="PRIVATE">Riêng tư (Chỉ Admin)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Nội dung"
          name="content"
          rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
        >
          <Input.TextArea
            rows={5}
            placeholder="Nhập nội dung chi tiết..."
            size="large"
          />
        </Form.Item>

        <Form.Item label="Ảnh đính kèm (Tối đa 3 ảnh)">
          <Upload
            listType="picture-card"
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            maxCount={3}
            accept="image/*"
          >
            {fileList.length >= 3 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Thêm ảnh</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-blue-600"
          >
            Tạo mới
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

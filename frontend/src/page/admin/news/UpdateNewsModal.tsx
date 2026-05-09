import React, { useState, useEffect } from "react";
import { Form, Input, Upload, Modal, Button, message, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import newsService from "../../../service/newsService";

export default function UpdateNewsModal({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      form.setFieldsValue({
        title: initialData.title,
        content: initialData.content,
        visibility: initialData.visibility || "PUBLIC",
      });

      
      if (initialData.images && initialData.images.length > 0) {
        const existingImages = initialData.images.map((img) => {
          // Lấy đúng ID (đề phòng API trả về 'imageId' thay vì 'id')
          const imageId = img.id || img.imageId;

          return {
            uid: String(imageId), // BẮT BUỘC ép kiểu về String
            name: `image-${imageId}.png`,
            status: "done", // BẮT BUỘC là 'done' thì AntD mới hiện ảnh
            url: img.imageUrl,
            thumbUrl: img.imageUrl, // THÊM thumbUrl để hỗ trợ preview cho picture-card
          };
        });
        setFileList(existingImages);
      } else {
        setFileList([]);
      }
    }
  }, [initialData, isOpen, form]);

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
      formData.append("visibility", values.visibility);

      // Lọc và phân loại ảnh trong form
      fileList.forEach((file) => {
        if (file.originFileObj) {
          // 1. Nếu có originFileObj -> Đây là ảnh MỚI upload từ máy tính
          formData.append("images", file.originFileObj);
        } else {
          // 2. Nếu không có originFileObj -> Đây là ảnh CŨ được giữ lại
          formData.append("retainedImageIds", file.uid);
        }
      });

      await newsService.update(initialData.id, formData);
      message.success("Cập nhật tin tức thành công!");
      handleCancel();
      onSuccess();
    } catch (error) {
      console.error("Lỗi cập nhật tin tức:", error);
      message.error("Có lỗi xảy ra khi cập nhật!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold">Cập Nhật Tin Tức</span>}
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
            Lưu cập nhật
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

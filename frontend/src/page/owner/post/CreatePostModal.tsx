import { Modal, Form, Input, Select, message } from "antd";
import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import courtService from "../../../service/courtService";

export default function CreatePostModal({ open, onClose, onSuccess }: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      loadMyCourts();
    }
  }, [open]);

  const loadMyCourts = async () => {
    try {
      const res = await courtService.getMyCourts(1, 200);
      setCourts(res.result.data || []);
    } catch (err) {}
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await PostService.createPost(values);
      message.success("Tạo bài đăng thành công");
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error("Lỗi khi tạo bài đăng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo bài đăng mới"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Chọn sân"
          name="courtId"
          rules={[{ required: true, message: "Vui lòng chọn sân" }]}
        >
          <Select
            placeholder="Chọn sân đã tạo trong hệ thống của bạn"
            options={courts.map((c) => ({
              label: c.courtName,
              value: c.courtId,
            }))}
          />
        </Form.Item>
        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
          <Input placeholder="Ví dụ: Sân cầu lông Hòa Bình..." />
        </Form.Item>
        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: " Mô tả không bỏ trống" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ : sân mới thoáng mát , đầy đủ trang thiết bị"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

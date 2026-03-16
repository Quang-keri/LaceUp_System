import { Modal, Form, Input, Select, message } from "antd";
import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import { toast } from "react-toastify";
export default function UpdatePostModal({
  open,
  onClose,
  onSuccess,
  post,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && post) {
      form.setFieldsValue({
        title: post.title,
        description: post.description,
        postStatus: post.postStatus,
      });
    }
  }, [open, post]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await PostService.updatePost(post.postId, values);
      toast.success("Cập nhật thành công");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Lỗi khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa bài đăng"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Trạng thái" name="postStatus">
          <Select
            options={[
              { label: "Công khai (PUBLISHED)", value: "PUBLISHED" },
              { label: "Bản nháp (DRAFT)", value: "DRAFT" },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

import { Modal, Form, Input, Select, message } from "antd";
import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import courtService from "../../../service/courtService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  post?: any | null; // PostSummaryResponse or PostDetail
}

export default function PostModal({ open, onClose, onSuccess, post }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);

  useEffect(() => {
    if (open) loadMyCourts();
    if (post) {
      form.setFieldsValue({
        title: post.title,
        description: post.description,
        courtId: post.courtId,
      });
    } else {
      form.resetFields();
    }
  }, [open, post]);

  const loadMyCourts = async () => {
    try {
      const res = await courtService.getMyCourts(1, 200);
      setCourts(res.result.data || []);
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (post) {
        await PostService.updatePost(post.postId, {
          title: values.title,
          description: values.description,
          postStatus: values.postStatus,
        });
        message.success("Cập nhật bài đăng thành công");
      } else {
        await PostService.createPost({
          title: values.title,
          description: values.description,
          courtId: values.courtId,
        });
        message.success("Tạo bài đăng thành công");
      }
      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi thao tác bài đăng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={post ? "Chỉnh sửa bài đăng" : "Tạo bài đăng"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề bài đăng" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập mô tả về bài đăng",
            },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        {!post && (
          <>
            <Form.Item
              label="Chọn sân"
              name="courtId"
              rules={[{ required: true, message: "Vui lòng chọn sân" }]}
            >
              <Select
                options={courts.map((c) => ({
                  label: c.courtName,
                  value: c.courtId,
                }))}
              />
            </Form.Item>
          </>
        )}

        {post && (
          <Form.Item label="Trạng thái" name="postStatus">
            <Select
              options={[
                { label: "PUBLISHED", value: "PUBLISHED" },
                { label: "DRAFT", value: "DRAFT" },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

import { Modal, Form, Input, InputNumber, Select, message } from "antd";
import { useEffect, useState } from "react";
import CourtService from "../../../service/courtService";

export default function UpdateCourtModal({
  open,
  onClose,
  categories,
  court,
  onSuccess,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (court) {
      form.setFieldsValue({
        courtName: court.courtName,
        categoryId: court.categoryId,
        price: court.price,
      });
    }
  }, [court]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      await CourtService.updateCourt(
        court.courtId,
        {
          courtName: values.courtName,
          categoryId: values.categoryId,
          price: values.price,
        },
        []
      );

      message.success("Cập nhật sân thành công");

      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa sân"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Tên sân" name="courtName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Loại sân" name="categoryId" rules={[{ required: true }]}>
          <Select
            options={categories.map((c: any) => ({
              label: c.categoryName,
              value: c.categoryId,
            }))}
          />
        </Form.Item>

        <Form.Item label="Giá" name="price" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
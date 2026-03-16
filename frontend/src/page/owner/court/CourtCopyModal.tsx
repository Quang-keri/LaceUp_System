import { Modal, Form, Input, Select, message } from "antd";
import { useEffect, useState } from "react";
import CourtService from "../../../service/courtService";
import type { CourtCopyResponse, CourtCopyStatus } from "../../../types/court";

interface Props {
  open: boolean;
  onClose: () => void;
  copy?: CourtCopyResponse | null;
  courtId: string;
  onSuccess: () => void;
}

export default function CourtCopyModal({
  open,
  onClose,
  copy,
  courtId,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && copy) {
      form.setFieldsValue({
        courtCode: copy.courtCode,
        status: copy.status,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, copy, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      if (copy) {
        // Update
        await CourtService.updateCourtCopy(copy.courtCopyId, {
          courtId,
          courtCode: values.courtCode,
          status: values.status,
        });
        message.success("Cập nhật sân con thành công");
      } else {
        // Create
        await CourtService.createCourtCopy({
          courtId,
          courtCode: values.courtCode,
        });
        message.success("Tạo sân con thành công");
      }

      form.resetFields();
      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi thao tác sân con");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={copy ? "Chỉnh sửa sân con" : "Tạo sân con"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Form.Item
          label="Mã sân con"
          name="courtCode"
          rules={[{ required: true, message: "Mã sân con không bỏ trống" }]}
        >
          <Input placeholder="Ví dụ: A1, A2, ..." disabled={!!copy} />
        </Form.Item>

        {copy && (
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "Hoạt động", value: "ACTIVE" },
                { label: "Không hoạt động", value: "INACTIVE" },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

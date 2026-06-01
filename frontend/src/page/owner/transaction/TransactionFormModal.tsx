import React, { useEffect } from "react";
import { Form, Input, InputNumber, Modal, Select } from "antd";
import type {
  TransactionRequest,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
  PaymentMethod,
} from "../../../types/transaction";

type Props = {
  open: boolean;
  editingId: string | null;
  formData: TransactionRequest;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TransactionRequest) => void;
  rentalAreaId?: string;
  role?: "OWNER" | "ADMIN";
};

const ownerTypeOptions = [
  { value: "INCOME", label: "Khoản thu" },
  { value: "EXPENSE", label: "Khoản chi" },
];

const adminTypeOptions = [
  { value: "INCOME", label: "Khoản thu" },
  { value: "EXPENSE", label: "Khoản chi" },
  { value: "PAYOUT", label: "Chuyển tiền owner" },
  { value: "REFUND", label: "Hoàn tiền" },
  { value: "COMMISSION", label: "Hoa hồng" },
];

const ownerCategoryOptions = [
  { value: "EXTRA_SERVICE_PAYMENT", label: "Dịch vụ tại sân" },
];

const adminCategoryOptions = [
  { value: "BOOKING_DEPOSIT", label: "Tiền cọc booking" },
  { value: "BOOKING_FULL_PAYMENT", label: "Thanh toán đủ booking" },
  { value: "BOOKING_REMAINING_PAYMENT", label: "Tiền còn lại booking" },
  { value: "EXTRA_SERVICE_PAYMENT", label: "Dịch vụ tại sân" },
  { value: "OWNER_PAYOUT", label: "Admin chuyển tiền owner" },
  { value: "REFUND", label: "Hoàn tiền" },
];

const TransactionFormModal: React.FC<Props> = ({
  open,
  editingId,
  formData,
  isSubmitting,
  onClose,
  onSubmit,
  rentalAreaId,
  role = "OWNER",
}) => {
  const [form] = Form.useForm<TransactionRequest>();

  const isOwner = role === "OWNER";

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        ...formData,
        rentalAreaId: formData.rentalAreaId || rentalAreaId,
        type: formData.type || "INCOME",
        category: formData.category || "EXTRA_SERVICE_PAYMENT",
        status: formData.status || "SUCCESS",
        paymentMethod: formData.paymentMethod || "CASH",
      });
    }
  }, [open, formData, rentalAreaId, form]);

  const handleOk = async () => {
    const values = await form.validateFields();

    onSubmit({
      ...formData,
      ...values,
      rentalAreaId: values.rentalAreaId || rentalAreaId,
    });
  };

  return (
    <Modal
      title={editingId ? "Cập nhật giao dịch" : "Thêm giao dịch mới"}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={isSubmitting}
      okText={editingId ? "Cập nhật" : "Tạo giao dịch"}
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label="Loại giao dịch"
          rules={[{ required: true, message: "Vui lòng chọn loại giao dịch" }]}
        >
          <Select<TransactionType>
            options={isOwner ? ownerTypeOptions : adminTypeOptions}
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="Danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select<TransactionCategory>
            options={isOwner ? ownerCategoryOptions : adminCategoryOptions}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Số tiền"
          rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
        >
          <InputNumber<number>
            min={0}
            step={1000}
            style={{ width: "100%" }}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0)}
            addonAfter="đ"
          />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Phương thức thanh toán"
          rules={[
            { required: true, message: "Vui lòng chọn phương thức thanh toán" },
          ]}
        >
          <Select<PaymentMethod>
            options={[
              { value: "CASH", label: "Tiền mặt" },
              { value: "BANK_TRANSFER", label: "Chuyển khoản" },
              { value: "VN_PAY", label: "VNPay" },
                { value: "PAY_OS", label: "PAY_ OS" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select<TransactionStatus>
            options={[
              { value: "SUCCESS", label: "Thành công" },
              { value: "PENDING", label: "Đang xử lý" },
              { value: "FAILED", label: "Thất bại" },
            ]}
          />
        </Form.Item>

        <Form.Item name="referenceId" label="Mã tham chiếu">
          <Input placeholder="Booking ID / Settlement ID nếu có" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả / Lý do"
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <Input.TextArea rows={3} placeholder="Nhập mô tả giao dịch..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransactionFormModal;

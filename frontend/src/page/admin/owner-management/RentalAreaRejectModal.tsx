import React from "react";
import { Modal, Input, Typography } from "antd";

const { Text } = Typography;

interface Props {
  open: boolean;
  reason: string;
  setReason: (val: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const RentalAreaRejectModal: React.FC<Props> = ({
  open,
  reason,
  setReason,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      title="Từ chối cơ sở"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <div>
        <Text>Nhập lý do từ chối (không bắt buộc):</Text>
        <Input.TextArea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Lý do từ chối"
          style={{ marginTop: 8 }}
        />
      </div>
    </Modal>
  );
};

export default RentalAreaRejectModal;

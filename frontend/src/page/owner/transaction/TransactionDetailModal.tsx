import React from "react";
import { Modal, Descriptions, Tag, Typography } from "antd";
import type { TransactionResponse } from "../../../types/transaction";

const { Text } = Typography;

const getPaymentMethodLabel = (method?: string): string => {
  const labels: Record<string, string> = {
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    CASH: "Tiền mặt",
    CARD: "Thẻ tín dụng",
    E_WALLET: "Ví điện tử",
  };
  return labels[method || ""] || "Không có";
};

type Props = {
  transaction: TransactionResponse | null;
  onClose: () => void;
};

const TransactionDetailModal: React.FC<Props> = ({ transaction, onClose }) => {
  const isIncome = transaction?.type === "INCOME";

  return (
    <Modal
      title="Chi tiết giao dịch"
      open={!!transaction}
      onCancel={onClose}
      footer={null}
      centered
      width={650}
    >
      {transaction && (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Mã giao dịch">
            <Text copyable>{transaction.id}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày giao dịch">
            {new Date(transaction.transactionDate).toLocaleString("vi-VN")}
          </Descriptions.Item>

          <Descriptions.Item label="Loại">
            <Tag color={isIncome ? "green" : "red"}>
              {isIncome ? "Khoản thu" : "Khoản chi"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Số tiền">
            <Text strong type={isIncome ? "success" : "danger"}>
              {isIncome ? "+" : "-"}
              {transaction.amount.toLocaleString()} ₫
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Mô tả">
            {transaction.description || "Không có mô tả"}
          </Descriptions.Item>

          <Descriptions.Item label="Phương thức thanh toán">
            {getPaymentMethodLabel(transaction.paymentMethod)}
          </Descriptions.Item>

          <Descriptions.Item label="Mã tham chiếu">
            {transaction.referenceId || "Không có"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};

export default TransactionDetailModal;

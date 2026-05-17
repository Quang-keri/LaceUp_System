import React from "react";
import { Button, Card, Pagination, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
  PageResponse,
  TransactionResponse,
} from "../../../types/transaction";

const { Text } = Typography;

type Props = {
  data: PageResponse<TransactionResponse> | null;
  loading: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  onEdit: (tx: TransactionResponse) => void;
  onView: (tx: TransactionResponse) => void;
};

const typeConfig: Record<
  TransactionResponse["type"],
  {
    color: string;
    label: string;
    sign: "+" | "-" | "";
    textType?: "success" | "danger" | "secondary";
  }
> = {
  INCOME: {
    color: "green",
    label: "THU",
    sign: "+",
    textType: "success",
  },
  EXPENSE: {
    color: "red",
    label: "CHI",
    sign: "-",
    textType: "danger",
  },
  PAYOUT: {
    color: "blue",
    label: "HỆ THỐNG CHUYỂN OWNER",
    sign: "+",
    textType: "success",
  },
  REFUND: {
    color: "orange",
    label: "HOÀN TIỀN",
    sign: "-",
    textType: "danger",
  },
  COMMISSION: {
    color: "purple",
    label: "HOA HỒNG",
    sign: "-",
    textType: "danger",
  },
};

const categoryConfig: Record<string, { color: string; label: string }> = {
  BOOKING_DEPOSIT: {
    color: "green",
    label: "Tiền cọc",
  },
  BOOKING_FULL_PAYMENT: {
    color: "green",
    label: "Thanh toán đủ",
  },
  BOOKING_REMAINING_PAYMENT: {
    color: "cyan",
    label: "Tiền còn lại",
  },
  EXTRA_SERVICE_PAYMENT: {
    color: "gold",
    label: "Dịch vụ tại sân",
  },
  OWNER_PAYOUT: {
    color: "blue",
    label: "Admin chuyển tiền",
  },
  REFUND: {
    color: "orange",
    label: "Hoàn tiền",
  },
};

const TransactionTable: React.FC<Props> = ({
  data,
  loading,
  page,
  setPage,
  onEdit,
  onView,
}) => {
  const columns: ColumnsType<TransactionResponse> = [
    {
      title: "Ngày",
      dataIndex: "transactionDate",
      key: "transactionDate",
      render: (value?: string) =>
        value ? new Date(value).toLocaleString("vi-VN") : "-",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: TransactionResponse["type"]) => {
        const item = typeConfig[type];

        return (
          <Tag color={item?.color || "default"}>{item?.label || type}</Tag>
        );
      },
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (category?: string) => {
        if (!category) return "-";

        const item = categoryConfig[category];

        return (
          <Tag color={item?.color || "default"}>{item?.label || category}</Tag>
        );
      },
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (paymentMethod?: string) => {
        const labelMap: Record<string, string> = {
          CASH: "Tiền mặt",
          BANK_TRANSFER: "Chuyển khoản",
          CARD: "Thẻ",
          E_WALLET: "Ví điện tử",
          VN_PAY: "VNPay",
        };

        return paymentMethod ? labelMap[paymentMethod] || paymentMethod : "-";
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description?: string) => description || "Không có mô tả",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (amount: number = 0, record) => {
        const item = typeConfig[record.type];

        return (
          <Text strong type={item?.textType}>
            {item?.sign || ""}
            {Number(amount || 0).toLocaleString("vi-VN")} ₫
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status?: string) => {
        const statusMap: Record<string, { color: string; label: string }> = {
          SUCCESS: {
            color: "success",
            label: "Thành công",
          },
          PENDING: {
            color: "warning",
            label: "Đang xử lý",
          },
          FAILED: {
            color: "error",
            label: "Thất bại",
          },
        };

        if (!status) return "-";

        const item = statusMap[status];

        return (
          <Tag color={item?.color || "default"}>{item?.label || status}</Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button onClick={() => onView(record)}>Xem</Button>

          <Button type="primary" onClick={() => onEdit(record)}>
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data || []}
        loading={loading}
        pagination={false}
        size="small"
      />

      {data && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Tổng: <strong>{data.totalElements}</strong> bản ghi
          </span>

          <Pagination
            current={page}
            total={data.totalElements}
            pageSize={data.pageSize || 10}
            onChange={(newPage) => setPage(newPage)}
            showSizeChanger={false}
          />
        </div>
      )}
    </Card>
  );
};

export default TransactionTable;

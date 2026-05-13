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
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type: TransactionResponse["type"]) => {
        const isIncome = type === "INCOME";

        return (
          <Tag color={isIncome ? "green" : "red"}>
            {isIncome ? "THU" : "CHI"}
          </Tag>
        );
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
      render: (amount: number, record) => {
        const isIncome = record.type === "INCOME";

        return (
          <Text strong type={isIncome ? "success" : "danger"}>
            {isIncome ? "+" : "-"}
            {amount.toLocaleString()} ₫
          </Text>
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
        locale={{
          emptyText: "Không có giao dịch nào để hiển thị",
        }}
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

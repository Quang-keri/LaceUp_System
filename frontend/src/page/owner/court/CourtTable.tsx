import { Table, Button, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { CourtResponse } from "../../../types/court";

interface Props {
  courts: CourtResponse[];
  loading: boolean;
  onEdit: (court: CourtResponse) => void;
  onDelete: (id: string) => void;
}

export default function CourtTable({ courts, loading, onEdit, onDelete }: Props) {

  const columns = [
    {
      title: "Tên sân",
      dataIndex: "courtName",
    },
    {
      title: "Loại sân",
      dataIndex: "categoryName",
    },
    {
      title: "Giá / giờ",
      dataIndex: "price",
      render: (price: number) =>
        price?.toLocaleString("vi-VN") + " VND",
    },
    {
      title: "Tổng sân",
      dataIndex: "totalCourts",
    },
    {
      title: "Thao tác",
      render: (_: any, record: CourtResponse) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa sân?"
            onConfirm={() => onDelete(record.courtId)}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="courtId"
      columns={columns}
      dataSource={courts}
      loading={loading}
      pagination={false}

      expandable={{
        expandedRowRender: (record: CourtResponse) => (
          <div style={{ paddingLeft: 20 }}>
            <b>Danh sách sân con:</b>

            {record.courtCopies?.map((copy) => (
              <div key={copy.courtCopyId}>
                • {copy.courtCode} ({copy.status})
              </div>
            ))}
          </div>
        ),
      }}
    />
  );
}
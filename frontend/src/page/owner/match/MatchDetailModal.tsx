import React from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Avatar,
  Typography,
  Divider,
  Space,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { MatchResponse } from "../../../types/match";
import dayjs from "dayjs";
import { Users } from "lucide-react";

const { Text } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  match: MatchResponse | null;
}

const MatchDetailModal: React.FC<Props> = ({ visible, onCancel, match }) => {
  if (!match) return null;

  const participantColumns = [
    {
      title: "Người chơi",
      key: "user",
      render: (_: any, record: any) => (
        <Space>
          {/* Sử dụng avatarUrl nếu có, không thì dùng icon mặc định */}
          <Avatar
            src={record.avatarUrl}
            icon={!record.avatarUrl && <UserOutlined />}
            className="bg-blue-500"
          />
          <div className="flex flex-col">
            <Text strong>{record.userName}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) =>
        phone || <Text type="secondary">Chưa cập nhật</Text>,
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      render: (gender: string) => (
        <Tag color={gender === "MALE" ? "blue" : "magenta"}>
          {gender === "MALE" ? "Nam" : "Nữ"}
        </Tag>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span className="text-lg font-bold">Chi tiết trận:</span>
          <Text type="danger">{match.title || "Trận vãng lai"}</Text>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
    >
      <Descriptions bordered column={2} size="middle" className="bg-gray-50">
        <Descriptions.Item label="Sân thi đấu" span={2}>
          <Text strong className="text-blue-600">
            {match.courtName}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Môn thi đấu">
          <Tag color="cyan" className="font-medium">
            {match.categoryName}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Trình độ">
          <Tag color="orange">{match.level || "Tất cả"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Thời gian">
          <Text strong>
            {dayjs(match.startTime).format("HH:mm")} -{" "}
            {dayjs(match.endTime).format("HH:mm")}
          </Text>
          <div className="text-xs text-gray-500">
            Ngày {dayjs(match.startTime).format("DD/MM/YYYY")}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag
            color={
              match.status === "CONFIRMED"
                ? "green"
                : match.status === "FULL"
                ? "volcano"
                : "blue"
            }
          >
            {match.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Chi phí">
          <Text type="success" strong>
            {match.courtPrice?.toLocaleString("vi-VN")} đ
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Người tổ chức">
          <Space>
            <Text strong>{match.hostName}</Text>
            <Tag color="gold">⭐ {match.hostRating || 5.0}</Tag>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">
        <Space>
          <Users size={18} />
          <span>
            Danh sách đã đăng ký ({match.currentPlayers}/{match.maxPlayers})
          </span>
        </Space>
      </Divider>

      <Table
        dataSource={match.participants || []}
        columns={participantColumns}
        rowKey="userId"
        pagination={false}
        size="middle"
        locale={{ emptyText: "Chưa có người tham gia" }}
        scroll={{ y: 300 }}
      />
    </Modal>
  );
};

export default MatchDetailModal;

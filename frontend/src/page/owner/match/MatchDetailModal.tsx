import React, { useState } from "react";
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Avatar,
  Typography,
  Divider,
  Space,
  Alert,
  Button,
  Popconfirm,
  message,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { MatchResponse } from "../../../types/match";
import dayjs from "dayjs";
import { Users, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import matchService from "../../../service/match/matchService.ts";

const { Text } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  match: MatchResponse | null;
  onSuccess: () => void;
}

const MatchDetailModal: React.FC<Props> = ({
  visible,
  onCancel,
  match,
  onSuccess,
}) => {
  const [resolving, setResolving] = useState(false);

  if (!match) return null;

  const pendingReport = match.reports?.find((r: any) => r.status === "PENDING");

  const handleResolveReport = async (reportId: string, isAccepted: boolean) => {
    setResolving(true);
    try {
      await matchService.resolveMatchReport(reportId, isAccepted);
      message.success(
        isAccepted
          ? "Đã duyệt hủy trận và làm trống sân thành công!"
          : "Đã từ chối báo cáo!",
      );
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Đã xảy ra lỗi khi xử lý báo cáo",
      );
    } finally {
      setResolving(false);
    }
  };

  const participantColumns = [
    {
      title: "Người chơi",
      key: "user",
      render: (_: any, record: any) => (
        <Space>
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
      <div className="flex flex-col gap-5">
        {pendingReport && (
          <Alert
            type={
              pendingReport.reasonType === "EARLY_ABSENT" ? "error" : "warning"
            }
            showIcon
            icon={<ShieldAlert className="mt-1" />}
            message={
              <span className="font-bold text-base">
                {pendingReport.reasonType === "EARLY_ABSENT"
                  ? "YÊU CẦU HỦY TRẬN KHẨN CẤP (Do thiếu người)"
                  : "CÓ BÁO CÁO VI PHẠM TỪ NGƯỜI CHƠI"}
              </span>
            }
            description={
              <div className="mt-2 space-y-3 text-sm text-gray-700">
                <div className="bg-white/50 p-3 rounded-lg border border-black/5">
                  <p className="m-0 mb-1">
                    <b>Người báo cáo:</b>{" "}
                    {pendingReport.reporterName || "Người chơi"}
                  </p>
                  <p className="m-0 mb-1">
                    <b>Lý do:</b>{" "}
                    <Tag color="red">{pendingReport.reasonType}</Tag>
                  </p>
                  <p className="m-0">
                    <b>Chi tiết mô tả:</b> <i>"{pendingReport.description}"</i>
                  </p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Popconfirm
                    title={
                      pendingReport.reasonType === "EARLY_ABSENT"
                        ? "Bạn chắc chắn muốn hủy trận này để trống sân?"
                        : "Bạn xác nhận báo cáo này đúng?"
                    }
                    onConfirm={() =>
                      handleResolveReport(pendingReport.reportId, true)
                    }
                    okText="Đồng ý"
                    cancelText="Hủy"
                  >
                    <Button
                      type="primary"
                      danger
                      loading={resolving}
                      className="flex items-center gap-2 font-semibold"
                    >
                      <CheckCircle2 size={16} />
                      {pendingReport.reasonType === "EARLY_ABSENT"
                        ? "Duyệt Yêu Cầu (Hủy Trận & Giải Phóng Sân)"
                        : "Xác nhận vi phạm"}
                    </Button>
                  </Popconfirm>

                  <Popconfirm
                    title="Bạn muốn từ chối yêu cầu này?"
                    onConfirm={() =>
                      handleResolveReport(pendingReport.reportId, false)
                    }
                    okText="Từ chối"
                    cancelText="Hủy"
                  >
                    <Button
                      loading={resolving}
                      className="flex items-center gap-2"
                    >
                      <XCircle size={16} /> Từ chối
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            }
            className="border-2 shadow-sm rounded-xl"
          />
        )}

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
                  : match.status === "CANCELLED"
                  ? "red"
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

        <Divider orientation={"left" as any} className="m-0 mt-2">
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
      </div>
    </Modal>
  );
};

export default MatchDetailModal;

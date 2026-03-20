import React from "react";
import { Modal, Descriptions, Tag, Divider, Table, Typography, Button } from "antd";
import dayjs from "dayjs";
import { BookingStatus, type BookingResponse } from "../../../types/booking.ts";

const { Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  data: BookingResponse | null;
}

const BookingDetailModal: React.FC<Props> = ({ visible, onClose, data }) => {
  if (!data) return null;

  const statusConfig = {
    [BookingStatus.BOOKED]: { color: "blue", text: "Đã đặt" },
    [BookingStatus.COMPLETED]: { color: "green", text: "Hoàn thành" },
    [BookingStatus.CANCELLED]: { color: "red", text: "Đã hủy" },
  };

  const config = statusConfig[data.bookingStatus] || { color: "default", text: data.bookingStatus };

  return (
    <Modal
      title={`Chi tiết đơn hàng: #${data.bookingId?.slice(-6).toUpperCase()}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      <Descriptions title="Thông tin khách hàng" bordered column={2} size="small">
        <Descriptions.Item label="Tên khách">{data.userName || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{data.phoneNumber || "N/A"}</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Descriptions title="Thông tin đặt sân" bordered column={2} size="small">
        <Descriptions.Item label="Khu vực" span={2}>
          <Tag color="geekblue">{data.rentalArea?.rentalAreaName}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày chơi">
          {dayjs(data.bookingDate).format("DD/MM/YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="Khung giờ">
          {data.startTime} - {data.endTime}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={config.color}>{config.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tổng tiền">
          <b style={{ color: "#f5222d" }}>{data.totalPrice?.toLocaleString()} VND</b>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>Danh sách sân chi tiết</Title>
      <Table
        dataSource={data.slots}
        pagination={false}
        rowKey={(record) => record.courtId + record.startTime} // Tránh trùng key
        size="small"
        columns={[
          { title: "Mã sân", dataIndex: "courtCode", key: "courtCode" },
          { title: "Bắt đầu", dataIndex: "startTime", key: "startTime" },
          { title: "Kết thúc", dataIndex: "endTime", key: "endTime" },
          { 
            title: "Giá", 
            dataIndex: "price", 
            key: "price", 
            render: (p) => `${p?.toLocaleString()}đ` 
          },
        ]}
      />
    </Modal>
  );
};

export default BookingDetailModal;
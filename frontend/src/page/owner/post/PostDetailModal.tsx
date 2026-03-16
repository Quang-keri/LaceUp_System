import { Modal, Descriptions, Badge, Typography } from "antd";

export default function PostDetailModal({ open, onClose, post }: any) {
  return (
    <Modal
      title="Chi tiết bài đăng"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 10 }}
    >
      <div className="mb-4">
        <img
          src={post.courtCoverImageUrl}
          alt="court"
          style={{
            width: 100,
            height: 100,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      </div>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tiêu đề">{post.title}</Descriptions.Item>
        <Descriptions.Item label="Tên sân">{post.courtName}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ">{post.address}</Descriptions.Item>
        <Descriptions.Item label="Giá thuê">
          <Typography.Text type="danger" strong>
            {post.price?.toLocaleString()} VND
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Badge
            status={post.postStatus === "PUBLISHED" ? "success" : "default"}
            text={post.postStatus}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {new Date(post.createdAt).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">{post.description}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

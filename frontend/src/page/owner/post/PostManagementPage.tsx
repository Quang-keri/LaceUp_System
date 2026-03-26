import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Space,
  Tag,
  message,
  Modal,
  Empty,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import PostService from "../../../service/post/postService";
import CreatePostModal from "./CreatePostModal";
import UpdatePostModal from "./UpdatePostModal";
import PostDetailModal from "./PostDetailModal";
import { toast } from "react-toastify";
const { Text, Title } = Typography;

export default function PostManagementPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State quản lý các Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await PostService.getMyPosts();
      setPosts(res.result || []);
    } catch (err: any) {
      message.error("Không tải được bài đăng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (postId: string) => {
    Modal.confirm({
      title: "Xác nhận xóa bài đăng ",
      content: "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa ?",
      okText: "Xóa ngay",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          await PostService.deletePost(postId);
          toast.success("Đã xóa bài đăng thành công!");
          loadPosts();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Lỗi khi xóa bài đăng");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Quản lý bài đăng của tôi</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsCreateOpen(true)}
        >
          Tạo bài đăng mới
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {posts.map((post) => (
          <Col xs={24} sm={12} md={8} lg={8} key={post.postId}>
            <Card
              hoverable
              cover={
                <img
                  alt="court"
                  src={
                    post.courtCoverImageUrl ||
                    "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  style={{ height: 180, objectFit: "cover" }}
                />
              }
              actions={[
                <EyeOutlined
                  key="view"
                  onClick={() => {
                    setSelectedPost(post);
                    setIsDetailOpen(true);
                  }}
                />,
                <EditOutlined
                  key="edit"
                  onClick={() => {
                    setSelectedPost(post);
                    setIsUpdateOpen(true);
                  }}
                />,
                <DeleteOutlined
                  key="delete"
                  className="text-red-500"
                  onClick={() => handleDelete(post.postId)}
                />,
              ]}
            >
              <Card.Meta
                title={
                  <span className="text-lg font-bold uppercase">
                    {post.title}
                  </span>
                }
                description={
                  <Space direction="vertical" size={0} className="w-full">
                    <Text type="secondary">{post.address.street}</Text>
                    <Text type="secondary">{post.address.ward}</Text>
                    <Text type="secondary">{post.address.district}</Text>
                    <Text type="secondary">{post.address.city.cityName}</Text>
                    <Text type="secondary">{post.courtName}</Text>
                    <div className="mt-2 flex justify-between items-center">
                      <Text className="text-red-500 font-bold text-lg">
                        {post.price?.toLocaleString()} VND
                      </Text>
                      <Tag
                        color={
                          post.postStatus === "PUBLISHED" ? "green" : "orange"
                        }
                      >
                        {post.postStatus}
                      </Tag>
                    </div>
                  </Space>
                }
              />
              <Button
                type="primary"
                block
                className="mt-4"
                onClick={() => {
                  setSelectedPost(post);
                  setIsDetailOpen(true);
                }}
              >
                Xem chi tiết
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      {posts.length === 0 && !loading && (
        <Empty description="Bạn chưa có bài đăng nào" />
      )}

      <CreatePostModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadPosts}
      />

      {selectedPost && (
        <>
          <UpdatePostModal
            open={isUpdateOpen}
            post={selectedPost}
            onClose={() => {
              setIsUpdateOpen(false);
              setSelectedPost(null);
            }}
            onSuccess={loadPosts}
          />
          <PostDetailModal
            open={isDetailOpen}
            post={selectedPost}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedPost(null);
            }}
          />
        </>
      )}
    </div>
  );
}

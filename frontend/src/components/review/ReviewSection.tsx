import React, { useEffect, useState, useMemo } from "react";
import {
  Rate,
  Button,
  Modal,
  Form,
  Input,
  List,
  message,
  Dropdown,
  Avatar
} from "antd";
import type { MenuProps } from "antd";
import { MoreOutlined, EditOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import reviewService from "../../service/reviewService";
import type { ReviewData } from "../../service/reviewService";

interface Props {
  rentalAreaId: string;
}

export default function ReviewSection({ rentalAreaId }: Props) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [myReview, setMyReview] = useState<ReviewData | null>(null);
  const [isEligible, setIsEligible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 5;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  
  const combinedReviews = useMemo(() => {
    if (!myReview) return reviews;
  
    const otherReviews = reviews.filter(
      (r) => r.reviewId !== myReview.reviewId,
    );
    return [myReview, ...otherReviews];
  }, [reviews, myReview]);

  const fetchReviews = async (page: number) => {
    try {
      const res = await reviewService.getReviewsByRentalArea(
        rentalAreaId,
        page - 1,
        pageSize,
      );
      if (res.data && res.data.result) {
        setReviews(res.data.result.data || []);
        setTotalElements(res.data.result.totalElements || 0);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách review", error);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const eligibleRes = await reviewService.checkEligibility(rentalAreaId);
      const isUserEligible = eligibleRes.data?.result || false;
      setIsEligible(isUserEligible);

      if (isUserEligible) {
        const myRevRes = await reviewService.getMyReview(rentalAreaId);
        if (myRevRes.data && myRevRes.data.result) {
          setMyReview(myRevRes.data.result);
        }
      }
    } catch (error) {
      console.error("Lỗi tải thông tin review cá nhân", error);
    }
  };

  useEffect(() => {
    if (rentalAreaId) {
      fetchReviews(currentPage);
      fetchUserData();
    }
  }, [rentalAreaId, user, currentPage]);

  const openReviewModal = () => {
    if (myReview) {
      form.setFieldsValue({
        rating: myReview.rating,
        comment: myReview.comment,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: { rating: number; comment: string }) => {
    setSubmitting(true);
    try {
      await reviewService.submitReview(rentalAreaId, values);
      message.success("Thao tác thành công!");
      setIsModalOpen(false);
      fetchReviews(currentPage);
      fetchUserData();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const getActionMenu = (): MenuProps => ({
    items: [
      {
        key: "edit",
        label: "Sửa đánh giá",
        icon: <EditOutlined />,
        onClick: openReviewModal,
      },
    ],
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[#9156F1] rounded-full"></span>
          Đánh giá từ khách hàng
        </h3>

        {isEligible && !myReview && (
          <Button
            type="primary"
            onClick={openReviewModal}
            className="bg-[#9156F1] hover:bg-purple-600 border-none rounded-lg"
          >
            Viết đánh giá
          </Button>
        )}
      </div>

      <List
        itemLayout="horizontal"
        dataSource={combinedReviews}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalElements,
          onChange: (page) => setCurrentPage(page),
          align: "center",
          hideOnSinglePage: true,
        }}
        renderItem={(item) => {
          const isMine = item.reviewId === myReview?.reviewId;

          return (
            <List.Item
              className={`px-4 rounded-xl mb-4 border transition-all ${
                isMine
                  ? "bg-purple-50/40 border-purple-100"
                  : "border-transparent"
              }`}
              extra={
                isMine && (
                  <Dropdown
                    menu={getActionMenu()}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      shape="circle"
                      icon={<MoreOutlined className="text-lg text-gray-500" />}
                    />
                  </Dropdown>
                )
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    className={isMine ? "bg-[#9156F1]" : "bg-gray-300"}
                  />
                }
                title={
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {item.userName || "Khách hàng"}
                      </span>
                      {isMine && (
                        <span className="text-[10px] bg-[#9156F1] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Bạn
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-normal">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                }
                description={
                  <div className="mt-1">
                    <Rate
                      disabled
                      value={item.rating}
                      className="text-[10px] text-[#9156F1] block mb-1"
                    />
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.comment}
                    </p>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      <Modal
        title={myReview ? "Chỉnh sửa đánh giá" : "Đánh giá sân thể thao"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="rating"
            label="Bạn thấy chất lượng sân thế nào?"
            rules={[{ required: true, message: "Vui lòng chọn số sao!" }]}
          >
            <Rate className="text-3xl text-[#9156F1]" />
          </Form.Item>

          <Form.Item
            name="comment"
            label="Nhận xét chi tiết"
            rules={[{ required: true, message: "Vui lòng nhập nhận xét!" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Sân đẹp, đèn sáng, chủ sân nhiệt tình..."
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            className="w-full h-12 bg-[#9156F1] hover:bg-purple-600 text-base font-semibold"
          >
            {myReview ? "Cập nhật đánh giá" : "Gửi đánh giá ngay"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

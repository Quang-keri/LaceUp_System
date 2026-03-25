import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Card,
  Row,
  Col,
  Spin,
  Space,
  Upload,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import RentalService from "../../../service/rental/rentalService";
import type { UpdateRentalAreaRequest } from "../../../types/rental";
import type { UploadFile } from "antd/es/upload/interface";

const CITIES = [
  { label: "TP Hồ Chí Minh", value: 1 },
  { label: "Hà Nội", value: 2 },
  { label: "Đà Nẵng", value: 3 },
  { label: "Hải Phòng", value: 4 },
  { label: "Cần Thơ", value: 5 },
];

export default function BuildingEditPage() {
  const navigate = useNavigate();
  const { buildingId } = useParams<{ buildingId: string }>();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State quản lý danh sách file ảnh
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchBuildingDetail = async () => {
      if (!buildingId) return;

      try {
        setLoading(true);
        const response = await RentalService.getRentalAreaById(buildingId);

        if (response && response.result) {
          const data = response.result;

          // 1. Fill data vào các ô Input
          form.setFieldsValue({
            rentalAreaName: data.rentalAreaName,
            cityId: data.cityId,
            address: data.address,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
          });

          // 2. Hiển thị ảnh cũ lên khung Upload (nếu có)
          if (data.images) {
            const initialImages: UploadFile[] = data.images.map((img: any) => ({
              uid: img.rentalAreaImageId,
              name: `Image-${img.rentalAreaImageId}`,
              status: "done",
              url: img.imageUrl, // Link ảnh từ Cloudinary
            }));
            setFileList(initialImages);
          }
        }
      } catch (error) {
        message.error("Không thể tải thông tin tòa nhà!");
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingDetail();
  }, [buildingId, form]);

  const handleUpdateBuilding = async (values: any) => {
    if (!buildingId) return;

    try {
      setIsSubmitting(true);

      // Chuẩn bị mảng File thực tế để gửi lên server
      // Chỉ lấy những file thực sự là object File (những file mới chọn)
      const imageFiles = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      const updateData: UpdateRentalAreaRequest = {
        rentalAreaName: values.rentalAreaName,
        address: values.address,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        cityId: values.cityId,
      };

      // Gọi API với cả text và mảng file ảnh mới
      await RentalService.updateRentalArea(buildingId, updateData, imageFiles);

      message.success("Cập nhật tòa nhà thành công!");
      navigate("/owner/buildings/list");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <Card
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => navigate("/owner/buildings/list")}
            />
            <h2>Chỉnh sửa tòa nhà</h2>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={handleUpdateBuilding}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Tên tòa nhà"
                  name="rentalAreaName"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Thành phố"
                  name="cityId"
                  rules={[{ required: true }]}
                >
                  <Select options={CITIES} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Người liên hệ"
                  name="contactName"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="SĐT"
                  name="contactPhone"
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            {/* Phần Upload Ảnh */}
            <Form.Item label="Hình ảnh (Chọn tối đa 5 ảnh mới nếu muốn thay đổi)">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList: newFileList }) =>
                  setFileList(newFileList)
                }
                beforeUpload={() => false} // Không upload tự động
                multiple
                maxCount={5}
              >
                {fileList.length < 5 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <div style={{ textAlign: "right" }}>
              <Space>
                <Button onClick={() => navigate("/owner/buildings/list")}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={isSubmitting}
                >
                  Lưu thay đổi
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

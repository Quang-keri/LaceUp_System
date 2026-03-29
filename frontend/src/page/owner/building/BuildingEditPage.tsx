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
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchBuildingDetail = async () => {
      if (!buildingId) return;

      try {
        setLoading(true);
        const response = await RentalService.getRentalAreaById(buildingId);

        if (response && response.result) {
          const data = response.result;

          form.setFieldsValue({
            rentalAreaName: data.rentalAreaName,
            cityId: data.cityId,
            street: data.address?.street,
            ward: data.address?.ward,
            district: data.address?.district,

            contactName: data.contactName,
            contactPhone: data.contactPhone,
          });

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

      const imageFiles = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      const updateData: UpdateRentalAreaRequest = {
        rentalAreaName: values.rentalAreaName,
        address: {
          street: values.street,
          ward: values.ward,
          district: values.district,
        },
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        cityId: values.cityId,
      };

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
            <h2 className="text-xl font-bold">Chỉnh sửa tòa nhà</h2>
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
                  rules={[
                    { required: true, message: "Vui lòng nhập tên tòa nhà" },
                  ]}
                >
                  <Input placeholder="Nhập tên tòa nhà" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Thành phố"
                  name="cityId"
                  rules={[
                    { required: true, message: "Vui lòng chọn thành phố" },
                  ]}
                >
                  <Select options={CITIES} placeholder="Chọn thành phố" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Quận/Huyện"
                  name="district"
                  rules={[
                    { required: true, message: "Vui lòng nhập quận/huyện" },
                  ]}
                >
                  <Input placeholder="Ví dụ: Quận 1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Phường/Xã"
                  name="ward"
                  rules={[
                    { required: true, message: "Vui lòng nhập phường/xã" },
                  ]}
                >
                  <Input placeholder="Ví dụ: Phường Bến Nghé" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Số nhà/Tên đường"
              name="street"
              rules={[
                { required: true, message: "Vui lòng nhập số nhà/đường" },
              ]}
            >
              <Input placeholder="Ví dụ: 123 Lê Lợi" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Người liên hệ"
                  name="contactName"
                  rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                >
                  <Input placeholder="Tên người quản lý" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Số điện thoại"
                  name="contactPhone"
                  rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
                >
                  <Input placeholder="Số điện thoại liên hệ" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Hình ảnh (Chọn tối đa 5 ảnh mới để thay đổi)">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList: newFileList }) =>
                  setFileList(newFileList)
                }
                beforeUpload={() => false}
                multiple
                maxCount={5}
                accept="image/*"
              >
                {fileList.length < 5 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <div style={{ textAlign: "right", marginTop: 24 }}>
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

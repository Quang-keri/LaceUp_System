import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Upload,
  Select,
  Skeleton,
  Row,
  Col,
  TimePicker, // Thêm TimePicker
  Switch, // Thêm Switch
} from "antd";
import { UploadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { UploadFile } from "antd";
import RentalService from "../../../service/rental/rentalService";
import { useAuth } from "../../../context/AuthContext";
import dayjs from "dayjs"; // Thêm dayjs để xử lý LocalTime

const CITIES = [
  { label: "Hà Nội", value: 1 },
  { label: "TP Hồ Chí Minh", value: 2 },
  { label: "Đà Nẵng", value: 3 },
  { label: "Hải Phòng", value: 4 },
  { label: "Cần Thơ", value: 5 },
];

export default function BuildingFormPage() {
  const navigate = useNavigate();
  const { buildingId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    if (buildingId) {
      setIsEditMode(true);
      loadBuildingData(buildingId);
    }
  }, [buildingId]);

  const { user } = useAuth();

  const loadBuildingData = async (id: string) => {
    setPageLoading(true);
    try {
      const response = await RentalService.getRentalAreaById(id);
      if (response.data && response.data.result) {
        const building = response.data.result;
        form.setFieldsValue({
          rentalAreaName: building.rentalAreaName,
          address: building.address,
          contactName: building.contactName,
          contactPhone: building.contactPhone,
          cityId: building.cityId,
          // Format chuỗi giờ từ backend (HH:mm:ss) sang dayjs object cho Form
          openTime: building.openTime
            ? dayjs(building.openTime, "HH:mm:ss")
            : null,
          closeTime: building.closeTime
            ? dayjs(building.closeTime, "HH:mm:ss")
            : null,
          isActive: building.isActive,
        });
      }
    } catch (error) {
      message.error("Lỗi khi tải thông tin tòa nhà");
      console.error(error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileChange = (e: any) => {
    const files = Array.from(e.fileList);
    const newFiles: File[] = [];

    files.forEach((fileObj: any) => {
      if (fileObj.originFileObj) {
        newFiles.push(fileObj.originFileObj);
      }
    });

    setImageFiles(newFiles);
    setFileList(e.fileList);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Format dayjs object sang chuỗi "HH:mm:ss" để gửi xuống Java (LocalTime)
      const openTimeFormatted = values.openTime
        ? values.openTime.format("HH:mm:ss")
        : null;
      const closeTimeFormatted = values.closeTime
        ? values.closeTime.format("HH:mm:ss")
        : null;

      if (isEditMode && buildingId) {
        const updateData = {
          rentalAreaName: values.rentalAreaName,
          address: values.address,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          cityId: values.cityId,
          openTime: openTimeFormatted,
          closeTime: closeTimeFormatted,
          isActive: values.isActive, // Gửi trạng thái hoạt động khi edit
        };
        await RentalService.updateRentalArea(buildingId, updateData);
        message.success("Cập nhật tòa nhà thành công");
      } else {
        if (imageFiles.length === 0) {
          message.error("Vui lòng chọn ít nhất một hình ảnh");
          setLoading(false);
          return;
        }

        const createData = {
          userId: user?.userId,
          rentalAreaName: values.rentalAreaName,
          address: values.address,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          cityId: values.cityId,
          openTime: openTimeFormatted,
          closeTime: closeTimeFormatted,
          isActive: true, // Mặc định tạo mới là true
        };

        await RentalService.createRentalArea(createData, imageFiles);
        message.success("Tòa nhà được tạo thành công!");
      }

      setTimeout(() => {
        navigate("/owner/buildings/list");
      }, 500);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Lỗi khi lưu tòa nhà";
      message.error(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  return (
    <div className="p-4">
      <Card
        title={
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/owner/buildings/list")}
            />
            <h2>{isEditMode ? "Cập nhật tòa nhà" : "Tạo tòa nhà mới"}</h2>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ isActive: true }} // Set giá trị mặc định cho Switch
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
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
            <Col xs={24} md={12}>
              <Form.Item
                label="Thành phố"
                name="cityId"
                rules={[{ required: true, message: "Vui lòng chọn thành phố" }]}
              >
                <Select placeholder="Chọn thành phố" options={CITIES} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
              >
                <Input placeholder="Nhập địa chỉ tòa nhà" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tên người liên hệ"
                name="contactName"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên người liên hệ",
                  },
                ]}
              >
                <Input placeholder="Nhập tên người liên hệ" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Số điện thoại liên hệ"
                name="contactPhone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          {/* ----- THÊM PHẦN THỜI GIAN HOẠT ĐỘNG ----- */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Giờ mở cửa"
                name="openTime"
                rules={[
                  { required: true, message: "Vui lòng chọn giờ mở cửa" },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  className="w-full"
                  placeholder="Ví dụ: 06:00"
                  showNow={false}
                  minuteStep={15} // Tuỳ chọn: để dễ chọn giờ chẵn
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Giờ đóng cửa"
                name="closeTime"
                rules={[
                  { required: true, message: "Vui lòng chọn giờ đóng cửa" },
                ]}
              >
                <TimePicker
                  format="HH:mm"
                  className="w-full"
                  placeholder="Ví dụ: 23:00"
                  showNow={false}
                  minuteStep={15}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ----- TRẠNG THÁI (CHỈ NÊN HIỆN KHI EDIT) ----- */}
          {isEditMode && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Trạng thái hoạt động"
                  name="isActive"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Đang hoạt động"
                    unCheckedChildren="Tạm ngưng"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {!isEditMode && (
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Form.Item
                  label="Hình ảnh tòa nhà"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng tải lên ít nhất một hình ảnh",
                    },
                  ]}
                >
                  <Upload
                    listType="picture"
                    multiple
                    maxCount={1}
                    fileList={fileList}
                    onChange={handleFileChange}
                    accept="image/*"
                  >
                    <Button icon={<UploadOutlined />}>
                      Chọn hình ảnh (tối đa 1 ảnh)
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]} className="mt-6">
            <Col xs={24}>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => navigate("/owner/buildings/list")}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEditMode ? "Cập nhật" : "Tạo tòa nhà"}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

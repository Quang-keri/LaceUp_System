import React, { useState, useRef, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Upload,
  TimePicker,
  Card,
  AutoComplete,
  Result,
} from "antd";
import { useRentalForm } from "../../context/RentalFormContext";
import {
  UploadOutlined,
  UserAddOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY;

export default function Step1BasicInfo({ next }: { next: () => void }) {
  const { formData, updateFormData } = useRentalForm();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<any>(null);
  const [addressSource, setAddressSource] = useState<"goong" | "manual">(
    "manual",
  );

  const isGoongEnabled = !!GOONG_API_KEY;

  // Hiệu ứng tự động điền thông tin nếu người dùng đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user) {
      form.setFieldsValue({
        contactName: user.userName,
        gmail: user.email,
        contactPhone: user.phone,
      });
    }
  }, [isAuthenticated, user, form]);

  // Nếu chưa đăng nhập, trả về giao diện yêu cầu đăng ký/đăng nhập
  if (!isAuthenticated) {
    return (
      <Card bordered={false} style={{ textAlign: "center", padding: "40px 0" }}>
        <Result
          status="warning"
          title="Bạn cần tài khoản để tiếp tục"
          subTitle="Để quản lý khu vực và nhận thông báo đặt sân, vui lòng đăng nhập hoặc tạo tài khoản mới."
          extra={[
            <Button
              type="primary"
              key="login"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
            >
              Đăng nhập ngay
            </Button>,
            <Button
              key="register"
              icon={<UserAddOutlined />}
              onClick={() => navigate("/register")}
            >
              Tạo tài khoản mới
            </Button>,
          ]}
        />
      </Card>
    );
  }

  const handleSearchAddress = (value: string) => {
    if (!value || !isGoongEnabled) {
      setAddressOptions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(
          `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(
            value,
          )}`,
        );
        const data = await res.json();
        const options =
          data?.predictions?.map((item: any) => ({
            label: item.description,
            value: item.description,
            placeId: item.place_id,
            compound: item.compound,
            structured_formatting: item.structured_formatting,
          })) || [];
        setAddressOptions(options);
      } catch (err) {
        setAddressOptions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectAddress = (value: string, option: any) => {
    setAddressSource("goong");
    const compound = option.compound || {};
    form.setFieldsValue({
      address: {
        street: option.structured_formatting?.main_text || value,
        ward: compound?.commune || "",
        district: compound?.district || "",
        cityName: compound?.province || "",
        placeId: option.placeId || "",
      },
    });
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    try {
      const finalAddress = { ...values.address };
      if (isGoongEnabled && addressSource === "goong" && finalAddress.placeId) {
        try {
          const res = await fetch(
            `https://rsapi.goong.io/Place/Detail?place_id=${finalAddress.placeId}&api_key=${GOONG_API_KEY}`,
          );
          const data = await res.json();
          const location = data?.result?.geometry?.location;
          if (location) {
            finalAddress.latitude = location.lat;
            finalAddress.longitude = location.lng;
          }
        } catch (err) {
          console.warn("Không lấy được tọa độ");
        }
      }
      const submissionData = { ...values, address: finalAddress };
      updateFormData("basicInfo", submissionData);
      next();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card title="Thông tin cơ bản" bordered={false}>
      <Form
        form={form}
        layout="vertical"
        initialValues={formData.basicInfo}
        onFinish={onFinish}
      >
        <Row gutter={16}>
          {/* Tọa độ ẩn */}
          <Form.Item name={["address", "latitude"]} hidden>
            <Input />
          </Form.Item>
          <Form.Item name={["address", "longitude"]} hidden>
            <Input />
          </Form.Item>
          <Form.Item name={["address", "placeId"]} hidden>
            <Input />
          </Form.Item>

          <Col span={24}>
            <Form.Item
              name="rentalAreaName"
              label="Tên khu vực"
              rules={[{ required: true, message: "Vui lòng nhập tên khu vực" }]}
            >
              <Input placeholder="Ví dụ: Sân cầu lông Hòa Bình" />
            </Form.Item>
          </Col>

          {isGoongEnabled && (
            <Col span={24}>
              <Form.Item label="Tìm địa chỉ nhanh">
                <AutoComplete
                  options={addressOptions}
                  onSearch={handleSearchAddress}
                  onSelect={handleSelectAddress}
                  placeholder="Gõ để tìm kiếm địa chỉ..."
                  notFoundContent={searching ? "Đang tìm..." : null}
                  filterOption={false}
                  allowClear
                />
              </Form.Item>
            </Col>
          )}

          <Col span={12}>
            <Form.Item
              name={["address", "street"]}
              label="Số nhà / Đường"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={["address", "ward"]}
              label="Phường / Xã"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={["address", "district"]}
              label="Quận / Huyện"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={["address", "cityName"]}
              label="Thành phố / Tỉnh"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="openTime"
              label="Giờ mở cửa"
              rules={[{ required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="closeTime"
              label="Giờ đóng cửa"
              rules={[{ required: true }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="contactName"
              label="Người liên hệ"
              rules={[{ required: true }]}
            >
              <Input placeholder="Tên chủ sân/quản lý" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="Số điện thoại"
              rules={[{ required: true }]}
              
            >
              <Input placeholder="Số điện thoại liên hệ" disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gmail" label="Email" rules={[{ type: "email" }]}>
              <Input placeholder="Địa chỉ Email" disabled/>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="facebookLink" label="Facebook (Link)">
              <Input placeholder="https://facebook.com/..." />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="images"
              label="Ảnh khu vực chung"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[
                {
                  required: true,
                  message:
                    "Vui lòng tải lên ít nhất 1 và tối đa 3 ảnh khu vực chung",
                },
              ]}
            >
              <Upload
                listType="picture-card"
                maxCount={3}
                multiple
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          style={{
            marginTop: 16,
            background: "#9156F1",
            borderColor: "#9156F1",
          }}
        >
          Tiếp tục
        </Button>
      </Form>
    </Card>
  );
}

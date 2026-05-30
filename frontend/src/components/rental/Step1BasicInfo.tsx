import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Upload,
  TimePicker,
  Card,
  Result,
  Select,
  message,
} from "antd";
import { useRentalForm } from "../../context/RentalFormContext";
import {
  UploadOutlined,
  UserAddOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { locationService } from "../../service/locationService";

export default function Step1BasicInfo({ next }: { next: () => void }) {
  const { formData, updateFormData } = useRentalForm();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    fetchProvinces();

    const handleTabClose = () => locationService.clearCache?.();
    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      form.setFieldsValue({
        contactName: user.userName,
        gmail: user.email,
        contactPhone: user.phone,
      });
    }
  }, [isAuthenticated, user, form]);

  useEffect(() => {
    if (formData.basicInfo) {
      form.setFieldsValue(formData.basicInfo);

      const provinceCode = formData.basicInfo?.address?.provinceCode;
      if (provinceCode) {
        locationService.getWardsByProvince(provinceCode).then((data) => {
          setWards(data || []);
        });
      }
    }
  }, [formData.basicInfo, form]);

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const data = await locationService.getProvinces();
      setProvinces(data || []);
    } catch (error) {
      message.error("Lỗi tải danh sách tỉnh/thành phố");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const handleProvinceChange = async (value?: number) => {
    if (!value) {
      setWards([]);
      form.setFieldsValue({
        address: {
          provinceCode: undefined,
          cityName: undefined,
          ward: undefined,
        },
      });
      return;
    }

    const selectedProvince = provinces.find((p) => p.code === value);

    form.setFieldsValue({
      address: {
        provinceCode: value,
        cityName: selectedProvince?.name,
        ward: undefined,
      },
    });

    setWards([]);

    try {
      setLoadingWards(true);
      const data = await locationService.getWardsByProvince(value);
      setWards(data || []);
    } catch (error) {
      message.error("Lỗi tải danh sách phường/xã");
    } finally {
      setLoadingWards(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    try {
      const submissionData = {
        ...values,
        address: {
          ...values.address,
          district: undefined,
        },
      };

      updateFormData("basicInfo", submissionData);
      next();
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <Card title="Thông tin cơ bản" bordered={false}>
      <Form
        form={form}
        layout="vertical"
        initialValues={formData.basicInfo}
        onFinish={onFinish}
      >
        <Row gutter={16}>
          <Form.Item name={["address", "latitude"]} hidden>
            <Input />
          </Form.Item>

          <Form.Item name={["address", "longitude"]} hidden>
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

          <Col span={12}>
            <Form.Item
              name={["address", "street"]}
              label="Số nhà / Đường"
              rules={[
                { required: true, message: "Vui lòng nhập số nhà / đường" },
              ]}
            >
              <Input placeholder="Ví dụ: 76 Lê Văn Việt" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name={["address", "provinceCode"]}
              label="Thành phố / Tỉnh"
              rules={[
                { required: true, message: "Vui lòng chọn thành phố / tỉnh" },
              ]}
            >
              <Select
                showSearch
                allowClear
                loading={loadingProvinces}
                placeholder="Chọn thành phố / tỉnh"
                optionFilterProp="label"
                onChange={handleProvinceChange}
                options={provinces.map((p) => ({
                  label: p.name,
                  value: p.code,
                }))}
              />
            </Form.Item>

            <Form.Item name={["address", "cityName"]} hidden>
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name={["address", "ward"]}
              label="Phường / Xã"
              rules={[{ required: true, message: "Vui lòng chọn phường / xã" }]}
            >
              <Select
                showSearch
                allowClear
                loading={loadingWards}
                placeholder="Chọn phường / xã"
                optionFilterProp="label"
                disabled={!form.getFieldValue(["address", "provinceCode"])}
                options={wards.map((w) => ({
                  label: w.name,
                  value: w.name,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="openTime"
              label="Giờ mở cửa"
              rules={[{ required: true, message: "Vui lòng chọn giờ mở cửa" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="closeTime"
              label="Giờ đóng cửa"
              rules={[
                { required: true, message: "Vui lòng chọn giờ đóng cửa" },
              ]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="contactName"
              label="Người liên hệ"
              rules={[
                { required: true, message: "Vui lòng nhập người liên hệ" },
              ]}
            >
              <Input placeholder="Tên chủ sân/quản lý" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
              ]}
            >
              <Input placeholder="Số điện thoại liên hệ" disabled />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="gmail" label="Email" rules={[{ type: "email" }]}>
              <Input placeholder="Địa chỉ Email" disabled />
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
                accept="image/*"
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

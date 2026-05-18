import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Upload,
  Select,
  Row,
  Col,
  TimePicker,
  Modal,
  Spin,
} from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import RentalService from "../../../service/rental/rentalService";
import { useAuth } from "../../../context/AuthContext";
import { locationService } from "../../../service/locationService";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function BuildingCreateModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadProvinces();
      form.resetFields();
      setFileList([]);
      setWards([]);
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      loadProvinces();
      form.resetFields();
      setFileList([]);
      setWards([]);

      if (isAuthenticated && user) {
        form.setFieldsValue({
          contactName: user.userName || user.fullName || "",
          contactPhone: user.phone || "",
          gmailLink: user.email || "",
        });
      }
    }
  }, [open, isAuthenticated, user, form]);
  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const data = await locationService.getProvinces();
      setProvinces(data || []);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadWards = async (provinceCode: number) => {
    try {
      setLoadingWards(true);
      const data = await locationService.getWardsByProvince(provinceCode);
      setWards(data || []);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleProvinceChange = async (provinceCode: number) => {
    form.setFieldsValue({ ward: undefined });
    await loadWards(provinceCode);
  };

  const handleCreateBuilding = async () => {
    try {
      const values = await form.validateFields();

      const imageFiles = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      if (imageFiles.length === 0) {
        message.error("Vui lòng chọn ít nhất một hình ảnh");
        return;
      }

      const createData = {
        userId: user?.userId,
        rentalAreaName: values.rentalAreaName,
        street: values.street,
        ward: values.ward,
        cityId: values.cityId,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        gmailLink: values.gmailLink,
        facebookLink: values.facebookLink,
        openTime: values.openTime ? values.openTime.format("HH:mm:ss") : null,
        closeTime: values.closeTime
          ? values.closeTime.format("HH:mm:ss")
          : null,
        isActive: true,
      };

      setLoading(true);

      await RentalService.createRentalArea(createData, imageFiles);

      message.success("Tạo tòa nhà thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || "Lỗi khi tạo tòa nhà");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Tạo tòa nhà mới"
      onCancel={onClose}
      width={1100}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleCreateBuilding}
        >
          Tạo tòa nhà
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" autoComplete="off">
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
                label="Số nhà/Tên đường"
                name="street"
                rules={[
                  { required: true, message: "Vui lòng nhập số nhà/đường" },
                ]}
              >
                <Input placeholder="Ví dụ: 456 Lê Văn Việt" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Thành phố"
                name="cityId"
                rules={[{ required: true, message: "Vui lòng chọn thành phố" }]}
              >
                <Select
                  showSearch
                  loading={loadingProvinces}
                  placeholder="Chọn tỉnh/thành phố"
                  optionFilterProp="label"
                  onChange={handleProvinceChange}
                  options={provinces.map((item) => ({
                    label: item.name,
                    value: item.code,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phường/Xã"
                name="ward"
                rules={[{ required: true, message: "Vui lòng chọn phường/xã" }]}
              >
                <Select
                  showSearch
                  loading={loadingWards}
                  disabled={!form.getFieldValue("cityId")}
                  placeholder="Chọn phường/xã"
                  optionFilterProp="label"
                  options={wards.map((item) => ({
                    label: item.name,
                    value: item.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên người liên hệ"
                name="contactName"
                rules={[
                  { required: true, message: "Vui lòng nhập người liên hệ" },
                ]}
              >
                <Input placeholder="Tên người quản lý" disabled />
              </Form.Item>
            </Col>

            <Col span={12}>
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
                <Input placeholder="Nhập số điện thoại" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Gmail" name="gmailLink">
                <Input placeholder="example@gmail.com" disabled />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Facebook" name="facebookLink">
                <Input placeholder="Link Facebook" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
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
                  minuteStep={15}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
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

          <Form.Item label="Hình ảnh tòa nhà" required>
            <Upload
              listType="picture-card"
              multiple
              maxCount={5}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
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
        </Form>
      </Spin>
    </Modal>
  );
}

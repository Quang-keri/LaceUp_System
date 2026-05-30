import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Row,
  Col,
  Spin,
  Upload,
  Modal,
} from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import RentalService from "../../../service/rental/rentalService";
import { locationService } from "../../../service/locationService";
import { useAuth } from "../../../context/AuthContext";
import type { UpdateRentalAreaRequest } from "../../../types/rental";
import type { UploadFile } from "antd/es/upload/interface";

type Props = {
  open: boolean;
  buildingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function BuildingEditModal({
  open,
  buildingId,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>();
  useEffect(() => {
    const initData = async () => {
      if (open) {
        const provs = await loadProvinces();
        if (buildingId) {
          await fetchBuildingDetail(provs);
        }
      }
    };
    initData();
  }, [open, buildingId, user]);

  const getOwnerName = () => {
    return user?.userName || "";
  };

  const getOwnerPhone = () => {
    return user?.phone || "";
  };

  const getOwnerEmail = () => {
    return user?.email || "";
  };

  const loadProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data || []);
    return data || [];
  };

  const loadWards = async (provinceCode: number) => {
    if (!provinceCode) {
      setWards([]);
      return;
    }

    const data = await locationService.getWardsByProvince(provinceCode);
    setWards(data || []);
  };

  const fetchBuildingDetail = async (loadedProvinces: any[]) => {
    if (!buildingId) return;

    try {
      setLoading(true);

      const response = await RentalService.getRentalAreaById(buildingId);
      const data = response?.result;

      if (!data) return;

      const apiCityId = data.address?.city?.cityId;
      const apiCityName = data.address?.city?.cityName;

      let correctCityCode = apiCityId;
      if (apiCityName && loadedProvinces.length > 0) {
        const matchedProvince = loadedProvinces.find(
          (p) => p.name === apiCityName || p.name.includes(apiCityName),
        );
        if (matchedProvince) {
          correctCityCode = matchedProvince.code;
        }
      }

      setCurrentStatus(data.status);

      form.setFieldsValue({
        rentalAreaName: data.rentalAreaName,
        cityId: correctCityCode,
        street: data.address?.street,
        ward: data.address?.ward,
        contactName: getOwnerName() || data.contactName,
        contactPhone: getOwnerPhone() || data.contactPhone,
        gmailLink: getOwnerEmail() || data.gmailLink,
        facebookLink: data.facebookLink,

        status: data.status === "SUSPENDED" ? undefined : data.status,
      });

      if (correctCityCode) {
        await loadWards(correctCityCode);
      }

      const initialImages: UploadFile[] =
        data.images?.map((img: any) => ({
          uid: String(img.rentalAreaImageId),
          name: `Image-${img.rentalAreaImageId}`,
          status: "done",
          url: img.imageUrl,
        })) || [];

      setFileList(initialImages);
    } catch (error) {
      message.error("Không thể tải thông tin tòa nhà!");
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = async (cityId: number) => {
    form.setFieldsValue({ ward: undefined });
    await loadWards(cityId);
  };

  const handleUpdateBuilding = async () => {
    if (!buildingId) return;

    try {
      const values = await form.validateFields();

      setIsSubmitting(true);

      const imageFiles = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      const updateData: UpdateRentalAreaRequest = {
        rentalAreaName: values.rentalAreaName,
        address: {
          city: {
            cityId: values.cityId,
            cityName: provinces.find((p) => p.code === values.cityId)?.name || "",
          },
          street: values.street,
          ward: values.ward,
        },
        cityId: values.cityId,

        contactName: getOwnerName() || values.contactName,
        contactPhone: getOwnerPhone() || values.contactPhone,

        status: currentStatus === "SUSPENDED" ? undefined : values.status,
      };

      await RentalService.updateRentalArea(buildingId, updateData, imageFiles);

      message.success("Cập nhật tòa nhà thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Cập nhật thông tin tòa nhà"
      onCancel={onClose}
      width={1000}
      confirmLoading={isSubmitting}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={isSubmitting}
          onClick={handleUpdateBuilding}
        >
          Lưu thay đổi
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
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
                rules={[{ required: true, message: "Vui lòng chọn thành phố" }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn tỉnh/thành phố"
                  onChange={handleCityChange}
                  optionFilterProp="label"
                  options={provinces.map((item) => ({
                    label: item.name,
                    value: item.code,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phường/Xã"
                name="ward"
                rules={[{ required: true, message: "Vui lòng chọn phường/xã" }]}
              >
                <Select
                  showSearch
                  placeholder="Chọn phường/xã"
                  optionFilterProp="label"
                  options={wards.map((item) => ({
                    label: item.name,
                    value: item.name,
                  }))}
                />
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
            <Col span={8}>
              <Form.Item
                label="Người liên hệ"
                name="contactName"
                rules={[
                  { required: true, message: "Vui lòng nhập người liên hệ" },
                ]}
              >
                <Input placeholder="Tên người quản lý" disabled />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Số điện thoại"
                name="contactPhone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                ]}
              >
                <Input placeholder="Số điện thoại liên hệ" disabled />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Gmail" name="gmailLink">
                <Input placeholder="example@gmail.com" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Facebook" name="facebookLink">
                <Input placeholder="Link Facebook" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Trạng thái hoạt động"
                name="status"
                rules={[
                  {
                    required: currentStatus !== "SUSPENDED",
                    message: "Vui lòng chọn trạng thái",
                  },
                ]}
              >
                <Select
                  placeholder={
                    currentStatus === "SUSPENDED"
                      ? "Tòa nhà đang bị admin tạm khóa"
                      : "Chọn trạng thái"
                  }
                  disabled={currentStatus === "SUSPENDED"}
                >
                  <Select.Option value="ACTIVE">Đang kinh doanh</Select.Option>
                  <Select.Option value="INACTIVE">
                    Tạm ngưng hoạt động
                  </Select.Option>
                </Select>
              </Form.Item>

              {currentStatus === "SUSPENDED" && (
                <div
                  style={{ color: "#ff4d4f", marginTop: -12, marginBottom: 16 }}
                >
                  Tòa nhà đang bị admin tạm khóa, Vui lòng liên hệ đội ngũ của
                  chúng tôi hỗ trợ
                </div>
              )}
            </Col>
          </Row>
          <Form.Item label="Hình ảnh tòa nhà">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
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
        </Form>
      </Spin>
    </Modal>
  );
}

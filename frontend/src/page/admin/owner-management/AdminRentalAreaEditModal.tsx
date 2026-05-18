import { useEffect, useState } from "react";
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
import type { UploadFile } from "antd/es/upload/interface";
import rentalService from "../../../service/rental/rentalService";
import { locationService } from "../../../service/locationService";

type Props = {
  open: boolean;
  rentalAreaId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AdminRentalAreaEditModal({
  open,
  rentalAreaId,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    const initData = async () => {
      if (open && rentalAreaId) {
        const provs = await loadProvinces();
        await fetchRentalAreaDetail(provs);
      }
    };

    initData();
  }, [open, rentalAreaId]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFileList([]);
      setWards([]);
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const loadProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data || []);
    return data || [];
  };

  const loadWards = async (provinceCode: number) => {
    if (!provinceCode) {
      setWards([]);
      return [];
    }

    const data = await locationService.getWardsByProvince(provinceCode);
    setWards(data || []);
    return data || [];
  };

  const findProvinceCode = (data: any, loadedProvinces: any[]) => {
    const provinceCode =
      data.address?.city?.provinceCode ||
      data.city?.provinceCode ||
      data.provinceCode;

    if (provinceCode) return provinceCode;

    const cityName =
      data.address?.city?.cityName ||
      data.address?.cityName ||
      data.city?.cityName;

    if (!cityName) return undefined;

    const matchedProvince = loadedProvinces.find((p: any) => {
      const provinceName = p.name || p.cityName;
      return (
        provinceName === cityName ||
        provinceName?.includes(cityName) ||
        cityName?.includes(provinceName)
      );
    });

    return matchedProvince?.code;
  };

  const fetchRentalAreaDetail = async (loadedProvinces: any[]) => {
    if (!rentalAreaId) return;

    try {
      setLoading(true);

      const response = await rentalService.getRentalAreaById(rentalAreaId);
      const data = response?.result;

      if (!data) return;

      const correctProvinceCode = findProvinceCode(data, loadedProvinces);

      if (correctProvinceCode) {
        await loadWards(correctProvinceCode);
      }

      form.setFieldsValue({
        rentalAreaName: data.rentalAreaName,

        cityId: correctProvinceCode,
        ward: data.address?.ward || data.ward,
        street: data.address?.street || data.street,

        contactName: data.contactName,
        contactPhone: data.contactPhone,
        gmailLink: data.gmailLink || data.gmail,
        facebookLink: data.facebookLink,
      });

      const oldImages: UploadFile[] =
        data.images?.map((img: any, index: number) => ({
          uid: String(img.rentalAreaImageId || img.imageUrl || index),
          name: `Image-${index + 1}`,
          status: "done",
          url: img.imageUrl,
        })) || [];

      setFileList(oldImages);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || "Không thể tải thông tin tòa nhà",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = async (provinceCode: number) => {
    form.setFieldsValue({ ward: undefined });

    if (!provinceCode) {
      setWards([]);
      return;
    }

    await loadWards(provinceCode);
  };

  const handleSubmit = async () => {
    if (!rentalAreaId) return;

    try {
      const values = await form.validateFields();

      setIsSubmitting(true);

      const newImages = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj as File);

      await rentalService.updateRentalArea(
        rentalAreaId,
        {
          rentalAreaName: values.rentalAreaName,
          cityId: values.cityId,
          ward: values.ward,
          street: values.street,
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          facebookLink: values.facebookLink,
        },
        newImages,
      );

      message.success("Cập nhật tòa nhà thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Admin cập nhật thông tin tòa nhà"
      width={1000}
      onCancel={onClose}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={isSubmitting}
          onClick={handleSubmit}
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
                <Input placeholder="Tên người quản lý" />
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
                <Input placeholder="Số điện thoại liên hệ" />
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

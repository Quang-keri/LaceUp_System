import { useEffect, useState } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Spin,
  Upload,
} from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

import rentalService from "../../../service/rental/rentalService";
import { locationService } from "../../../service/locationService";

type Props = {
  open: boolean;
  buildingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

type Province = {
  code: number;
  name: string;
};

type Ward = {
  code?: number;
  name: string;
};

const toProvinceCode = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const code = Number(value);
  return Number.isFinite(code) ? code : undefined;
};

const normalizeLocationName = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(tinh|thanh pho|tp\.?)[\s-]*/i, "")
    .replace(/[^a-z0-9]/g, "");

export default function BuildingEditModal({
  open,
  buildingId,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const selectedCityId = Form.useWatch("cityId", form);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const loadProvinces = async (): Promise<Province[]> => {
    const data = await locationService.getProvinces();

    // Ép toàn bộ code về number để Ant Design Select so sánh đúng value.
    const normalizedData: Province[] = (data ?? [])
      .map((item: any) => ({
        code: Number(item.code),
        name: item.name ?? item.cityName ?? "",
      }))
      .filter(
        (item: Province) => Number.isFinite(item.code) && Boolean(item.name),
      );

    setProvinces(normalizedData);
    return normalizedData;
  };

  const loadWards = async (provinceCode: number): Promise<Ward[]> => {
    const data = await locationService.getWardsByProvince(provinceCode);
    const normalizedData: Ward[] = (data ?? []).map((item: any) => ({
      ...item,
      name: item.name,
    }));

    setWards(normalizedData);
    return normalizedData;
  };

  const findProvinceCode = (
    data: any,
    loadedProvinces: Province[],
  ): number | undefined => {
    const rawProvinceCode =
      data.address?.city?.provinceCode ??
      data.city?.provinceCode ??
      data.provinceCode;

    const provinceCode = toProvinceCode(rawProvinceCode);

    if (
      provinceCode !== undefined &&
      loadedProvinces.some((province) => province.code === provinceCode)
    ) {
      return provinceCode;
    }

    // Một số response cũ dùng cityId chính là mã tỉnh/thành.
    const possibleCodeFromCityId = toProvinceCode(
      data.address?.city?.cityId ?? data.city?.cityId ?? data.cityId,
    );

    if (
      possibleCodeFromCityId !== undefined &&
      loadedProvinces.some(
        (province) => province.code === possibleCodeFromCityId,
      )
    ) {
      return possibleCodeFromCityId;
    }

    const cityName =
      data.address?.city?.cityName ??
      data.address?.cityName ??
      data.city?.cityName ??
      data.cityName;

    const normalizedCityName = normalizeLocationName(cityName);
    if (!normalizedCityName) return undefined;

    return loadedProvinces.find((province) => {
      const normalizedProvinceName = normalizeLocationName(province.name);

      return (
        normalizedProvinceName === normalizedCityName ||
        normalizedProvinceName.includes(normalizedCityName) ||
        normalizedCityName.includes(normalizedProvinceName)
      );
    })?.code;
  };

  const fetchRentalAreaDetail = async (
    loadedProvinces: Province[],
  ): Promise<void> => {
    if (!buildingId) return;

    const response: any = await rentalService.getRentalAreaById(buildingId);

    // Hỗ trợ cả service trả res.data lẫn trả nguyên AxiosResponse.
    const data =
      response?.result ?? response?.data?.result ?? response?.data ?? response;

    if (!data) {
      throw new Error("Không tìm thấy dữ liệu tòa nhà");
    }

    const provinceCode = findProvinceCode(data, loadedProvinces);

    if (provinceCode !== undefined) {
      await loadWards(provinceCode);
    } else {
      setWards([]);
    }

    form.setFieldsValue({
      rentalAreaName: data.rentalAreaName,
      cityId: provinceCode,
      ward: data.address?.ward,
      street: data.address?.street,
      status: data.status,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      gmailLink: data.gmailLink ?? data.gmail,
      facebookLink: data.facebookLink,
    });

    const oldImages: UploadFile[] = (data.images ?? []).map(
      (img: any, index: number) => ({
        uid: String(img.rentalAreaImageId ?? img.imageUrl ?? index),
        name: `Image-${index + 1}`,
        status: "done",
        url: img.imageUrl,
      }),
    );

    setFileList(oldImages);
  };

  useEffect(() => {
    let cancelled = false;

    const initializeModal = async () => {
      if (!open || !buildingId) return;

      try {
        setLoading(true);
        form.resetFields();
        setWards([]);
        setFileList([]);

        const loadedProvinces = await loadProvinces();
        if (cancelled) return;

        await fetchRentalAreaDetail(loadedProvinces);
      } catch (error: any) {
        if (!cancelled) {
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Không thể tải thông tin tòa nhà",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initializeModal();

    return () => {
      cancelled = true;
    };
  }, [open, buildingId]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setFileList([]);
      setWards([]);
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [open, form]);

  const handleCityChange = async (rawProvinceCode: number | string) => {
    const provinceCode = toProvinceCode(rawProvinceCode);

    form.setFieldsValue({ ward: undefined });

    if (provinceCode === undefined) {
      setWards([]);
      return;
    }

    try {
      await loadWards(provinceCode);
    } catch (error: any) {
      setWards([]);
      message.error(
        error?.response?.data?.message || "Không thể tải danh sách phường/xã",
      );
    }
  };

  const handleSubmit = async () => {
    if (!buildingId) return;

    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const provinceCode = toProvinceCode(values.cityId);
      if (provinceCode === undefined) {
        message.error("Mã tỉnh/thành phố không hợp lệ");
        return;
      }

      const selectedProvince = provinces.find(
        (province) => province.code === provinceCode,
      );

      const newImages = fileList
        .filter((file) => Boolean(file.originFileObj))
        .map((file) => file.originFileObj as File);

      await rentalService.updateRentalArea(
        buildingId,
        {
          rentalAreaName: values.rentalAreaName,

          cityId: provinceCode,
          address: {
            city: {
              cityId: provinceCode,
              cityName: selectedProvince?.name ?? "",
            },
            street: values.street,
            ward: values.ward,
          },
          contactName: values.contactName,
          contactPhone: values.contactPhone,
          facebookLink: values.facebookLink,
          status: values.status,
        },
        newImages,
      );

      message.success("Cập nhật tòa nhà thành công");
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error?.errorFields) return;

      message.error(
        error?.response?.data?.message || error?.message || "Cập nhật thất bại",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Cập nhật thông tin tòa nhà"
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
          disabled={loading}
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
                  allowClear
                  placeholder="Chọn tỉnh/thành phố"
                  onChange={handleCityChange}
                  optionFilterProp="label"
                  options={provinces.map((province) => ({
                    label: province.name,
                    value: province.code,
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
                  allowClear
                  disabled={!selectedCityId}
                  placeholder="Chọn phường/xã"
                  optionFilterProp="label"
                  options={wards.map((ward) => ({
                    label: ward.name,
                    value: ward.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Số nhà/Tên đường"
                name="street"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số nhà/tên đường",
                  },
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

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Trạng thái tòa nhà"
                name="status"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái" },
                ]}
              >
                <Select
                  placeholder="Chọn trạng thái"
                  options={[
                    { label: "Đang hoạt động", value: "ACTIVE" },
                    { label: "Tạm ngưng", value: "INACTIVE" },
                    { label: "Bị khóa / Suspended", value: "SUSPENDED" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Hình ảnh tòa nhà">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: nextFileList }) =>
                setFileList(nextFileList)
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
        </Form>
      </Spin>
    </Modal>
  );
}

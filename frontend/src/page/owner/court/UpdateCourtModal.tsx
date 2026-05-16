import { Modal, Form, Input, Select, message, Upload } from "antd";
import { useEffect, useMemo, useState } from "react";
import CourtService from "../../../service/courtService";
import amenityService from "../../../service/amenityService";

export default function UpdateCourtModal({
  open,
  onClose,
  categories,
  court,
  courtId,
  onSuccess,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const categoriesList = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.result)
    ? categories.result
    : Array.isArray(categories?.data)
    ? categories.data
    : [];

  const [amenities, setAmenities] = useState<any[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);

  const initialValues = useMemo(
    () => ({
      courtName: court?.courtName,
      categoryId: court?.categoryId || court?.category?.categoryId,
      surfaceType: court?.surfaceType,
      indoor:
        court?.indoor === true
          ? "true"
          : court?.indoor === false
          ? "false"
          : undefined,
      status: court?.status,
      amenityIds:
        court?.amenityIds ||
        court?.amenities?.map((a: any) => a.amenityId) ||
        [],
    }),
    [court],
  );

  useEffect(() => {
    if (!open) {
      setFileList([]);
      return;
    }

    if (court && court.images && Array.isArray(court.images)) {
      setFileList(
        court.images.map((img: any, idx: number) => ({
          uid: img.courtImageId || `img-${idx}`,
          name: `img-${idx}`,
          status: "done",
          url: img.imageUrl,
        })),
      );
    } else {
      setFileList([]);
    }
  }, [open, court]);

  useEffect(() => {
    (async () => {
      try {
        const res = await amenityService.getAllAmenities();
        setAmenities(res.result || []);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const idToUpdate = courtId || court?.courtId;
      if (!idToUpdate) {
        throw new Error("courtId is required to update court");
      }

      await CourtService.updateCourt(
        idToUpdate,
        {
          courtId: idToUpdate,
          courtName: values.courtName,
          categoryId: values.categoryId,
          rentalAreaId: court?.rentalAreaId,
          status: values.status,
          courtCodes:
            court?.courtCopies?.map((copy: any) => copy.courtCode) || [],
          surfaceType: values.surfaceType,
          indoor: values.indoor === "true",
          amenityIds: values.amenityIds || [],
        },
        fileList.map((f) => f.originFileObj || f),
      );

      message.success("Cập nhật sân thành công");

      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Lỗi update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa sân"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
    >
      <Form
        key={`${court?.courtId ?? "update"}-${open ? "open" : "closed"}`}
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          label="Tên sân"
          name="courtName"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại sân"
          name="categoryId"
          rules={[{ required: true }]}
        >
          <Select
            options={categoriesList.map((c: any) => ({
              label: c.categoryName,
              value: c.categoryId,
            }))}
          />
        </Form.Item>

        <Form.Item label="Bề mặt " name="surfaceType">
          <Input placeholder="Ví dụ: Thảm PVC, Nhận tạo, Xi măng..." />
        </Form.Item>

        <Form.Item label="Trong nhà / Ngoài trời" name="indoor">
          <Select>
            <Select.Option value="true">Trong nhà</Select.Option>
            <Select.Option value="false">Ngoài trời</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Trạng thái" name="status">
          <Select>
            <Select.Option value="ACTIVE">Đang kinh doanh</Select.Option>
            <Select.Option value="INACTIVE">Ngừng kinh doanh</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Tiện ích" name="amenityIds">
          <Select mode="multiple" placeholder="Chọn tiện ích">
            {amenities.map((a: any) => (
              <Select.Option key={a.amenityId} value={a.amenityId}>
                {a.amenityName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Ảnh sân (tải thêm) ">
          <Upload
            listType="picture-card"
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            multiple
          >
            {fileList.length >= 6 ? null : "+ Tải ảnh"}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
}

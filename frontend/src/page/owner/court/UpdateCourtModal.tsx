import { Modal, Form, Input, InputNumber, Select, message, Upload } from "antd";
import { useEffect, useState } from "react";
import CourtService from "../../../service/courtService";
import amenityService from "../../../service/amenityService";

export default function UpdateCourtModal({
  open,
  onClose,
  categories,
  court,
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

  useEffect(() => {
    if (court) {
      form.setFieldsValue({
        courtName: court.courtName,
        categoryId: court.categoryId,
        price: court.pricePerHour,
        surfaceType: court.surfaceType,
        indoor: court.indoor,
        amenityIds: court.amenityIds || [],
      });
      // populate existing images into upload list
      if (court.images && Array.isArray(court.images)) {
        const list = court.images.map((img: any, idx: number) => ({
          uid: img.courtImageId || `img-${idx}`,
          name: `img-${idx}`,
          status: "done",
          url: img.imageUrl,
        }));
        setFileList(list);
      } else {
        setFileList([]);
      }
    }
  }, [court]);

  useEffect(() => {
    (async () => {
      try {
        const res = await amenityService.getAllAmenities();
        setAmenities(res.result || []);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      await CourtService.updateCourt(
        court.courtId,
        {
          courtName: values.courtName,
          categoryId: values.categoryId,
          pricePerHour: values.price,
          surfaceType: values.surfaceType,
          indoor: values.indoor,
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
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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

        <Form.Item label="Giá" name="price" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="Bề mặt (surfaceType)" name="surfaceType">
          <Input placeholder="Ví dụ: Thảm, Gỗ, Xi măng..." />
        </Form.Item>

        <Form.Item label="Trong nhà / Ngoài trời" name="indoor">
          <Select>
            <Select.Option value={true}>Trong nhà</Select.Option>
            <Select.Option value={false}>Ngoài trời</Select.Option>
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

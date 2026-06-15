import { Modal, Form, Input, Select, Upload, message, Button, Tag } from "antd";
import { PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { useState } from "react";
import CourtService from "../../../service/courtService";
import CourtPriceService from "../../../service/courtPriceService";
import DraftCourtPriceModal from "../court-price/DraftCourtPriceModal";

export default function CreateCourtModal({
  open,
  onClose,
  categories,
  buildingId,
  onSuccess,
}: any) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // State quản lý việc nhập giá nháp
  const [isDraftPriceOpen, setIsDraftPriceOpen] = useState(false);
  const [draftPrices, setDraftPrices] = useState<any>(null);

  const categoriesList = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.result)
    ? categories.result
    : Array.isArray(categories?.data)
    ? categories.data
    : [];

  const handleSubmit = async (values: any) => {
    try {
      if (fileList.length < 1) {
        message.error("Phải upload ít nhất 1 ảnh");
        return;
      }

      // KIỂM TRA BẮT BUỘC PHẢI NHẬP GIÁ TRƯỚC KHI TẠO SÂN
      if (
        !draftPrices ||
        !draftPrices.prices ||
        draftPrices.prices.length === 0
      ) {
        message.error(
          "Bạn chưa thiết lập bảng giá! Không thể tạo sân nếu chưa có giá.",
        );
        return;
      }

      setLoading(true);

      const courtCopyRequests = values.courtCodes
        .split(",")
        .map((c: string) => ({
          courtCode: c.trim(),
          location: values.location?.trim(),
        }))
        .filter((c: any) => c.courtCode);

      const images = fileList.map((f) => f.originFileObj);

      const res = await CourtService.createCourt(
        {
          courtName: values.courtName,
          categoryId: values.categoryId,
          rentalAreaId: buildingId,
          courtCopyRequests,
          // pricePerHour: 0, // Không cần nếu BE của bạn cho phép bỏ trống, vì ta đã dùng bảng giá động
        },
        images,
      );

      const newCourtId =
        res?.result?.courtId ||
        res?.data?.result?.courtId ||
        res?.courtId ||
        res?.data?.courtId;

      if (!newCourtId) {
        console.log("Cấu trúc Response tạo sân:", res);
        throw new Error("Lỗi hệ thống: Không lấy được ID sân sau khi tạo.");
      }

      // 2. LƯU BẢNG GIÁ THEO SÂN ĐÓ
      const { dateRange, specificDate, priority, prices } = draftPrices;
      const startDate = dateRange ? dateRange[0].format("YYYY-MM-DD") : null;
      const endDate = dateRange ? dateRange[1].format("YYYY-MM-DD") : null;
      const specDate = specificDate?.format("YYYY-MM-DD");

      const pricePromises = prices.map((p: any) => {
        return CourtPriceService.createCourtPrice({
          courtId: newCourtId,
          startTime: p.startTime?.format("HH:mm"),
          endTime: p.endTime?.format("HH:mm"),
          startDate,
          endDate,
          specificDate: specDate,
          pricePerHour: p.pricePerHour,
          priceType: p.priceType,
          dayType: p.dayType,
          priority: priority || 1,
        });
      });

      await Promise.all(pricePromises);

      message.success("Đã tạo sân và cấu hình giá thành công!");

      // Reset
      form.resetFields();
      setFileList([]);
      setDraftPrices(null);
      onClose();
      onSuccess();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || err.message || "Lỗi khi tạo sân",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        title="Tạo sân"
        open={open}
        onCancel={onClose}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            label="Tên sân"
            name="courtName"
            rules={[{ required: true, message: "Vui lòng nhập tên sân" }]}
          >
            <Input placeholder="Ví dụ: Sân Pickleball 123..." />
          </Form.Item>

          <Form.Item
            label="Loại sân"
            name="categoryId"
            rules={[{ required: true, message: "Vui lòng chọn loại sân" }]}
          >
            <Select
              placeholder="Chọn loại sân"
              options={categoriesList.map((c: any) => ({
                label: c.categoryName,
                value: c.categoryId,
              }))}
            />
          </Form.Item>

          {/* CHỖ ĐỂ MỞ FORM GIÁ NHÁP LÊN */}
          <Form.Item
            label="Bảng giá sân"
            required
            tooltip="Bắt buộc phải thiết lập ít nhất 1 khung giờ giá tiền trước khi tạo sân"
          >
            <div className="flex items-center gap-4">
              <Button
                type="dashed"
                icon={<SettingOutlined />}
                onClick={() => setIsDraftPriceOpen(true)}
                danger={!draftPrices} // Hiện đỏ nếu người dùng chưa thiết lập
              >
                {draftPrices ? "Chỉnh sửa bảng giá" : "Thiết lập bảng giá"}
              </Button>

              {draftPrices && draftPrices.prices && (
                <Tag color="green">
                  Đã thiết lập {draftPrices.prices.length} khung giá
                </Tag>
              )}
            </div>
          </Form.Item>

          <Form.Item
            label="Vị trí / Khu vực"
            name="location"
            tooltip="Ví dụ: Trong nhà, Ngoài trời, Khu A, Tầng 2..."
            rules={[{ required: true, message: "Vui lòng nhập vị trí sân" }]}
          >
            <Input placeholder="Nhập vị trí (VD: Trong nhà, Khu A...)" />
          </Form.Item>

          <Form.Item
            label="Mã sân"
            name="courtCodes"
            tooltip="Ví dụ: A,B,C (mỗi mã là 1 sân con)."
            rules={[{ required: true, message: "Vui lòng nhập mã sân" }]}
          >
            <Input placeholder="Ví dụ: Sân số 1, Sân số 2..." />
          </Form.Item>

          <Form.Item label="Ảnh sân (1-2 ảnh)">
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={2}
            >
              {fileList.length >= 2 ? null : <PlusOutlined />}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <DraftCourtPriceModal
        open={isDraftPriceOpen}
        onClose={() => setIsDraftPriceOpen(false)}
        initialDraftValues={draftPrices}
        onSaveDraft={(values: any) => {
          setDraftPrices(values);
        }}
      />
    </>
  );
}

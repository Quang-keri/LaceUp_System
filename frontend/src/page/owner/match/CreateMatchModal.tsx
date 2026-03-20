import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Switch,
  message,
  Checkbox,
} from "antd";
import matchService from "../../../service/matchService.ts";
import courtService from "../../../service/courtService.ts";

// Khai báo danh sách các thứ trong tuần
const DAYS_OF_WEEK = [
  { label: "Thứ 2", value: "MONDAY" },
  { label: "Thứ 3", value: "TUESDAY" },
  { label: "Thứ 4", value: "WEDNESDAY" },
  { label: "Thứ 5", value: "THURSDAY" },
  { label: "Thứ 6", value: "FRIDAY" },
  { label: "Thứ 7", value: "SATURDAY" },
  { label: "Chủ Nhật", value: "SUNDAY" },
];

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateMatchModal: React.FC<Props> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Theo dõi trạng thái switch lặp lại để hiện/ẩn các input bổ sung
  const isRecurring = Form.useWatch("isRecurring", form);
  const recurringType = Form.useWatch("recurringType", form);

  useEffect(() => {
    const fetchMyCourts = async () => {
      try {
        const res = await courtService.getMyCourts(1, 100);
        if (res.code === 200 || res.code === 1000) {
          setCourts(res.result.data || []);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách sân:", error);
      }
    };
    if (visible) fetchMyCourts();
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const requestData: any = {
        courtId: values.courtId,
        startTime: values.timeRange[0].format("YYYY-MM-DDTHH:mm:ss"),
        endTime: values.timeRange[1].format("YYYY-MM-DDTHH:mm:ss"),
        maxPlayers: values.maxPlayers,
        minPlayersToStart: values.minPlayersToStart,

        // SỬA Ở ĐÂY: Đổi key 'isRecurring' thành 'recurring' để khớp với Java Jackson
        recurring: values.isRecurring || false,

        recurringType: values.isRecurring ? values.recurringType : null,
        dayOfWeek:
          values.isRecurring && values.recurringType === "WEEKLY"
            ? values.dayOfWeek.join(",")
            : null,
        endDate:
          values.isRecurring && values.endDate
            ? values.endDate.format("YYYY-MM-DD")
            : null,
      };

      const res = await matchService.createMatch(requestData);

      if (res.code === 1000 || res.code === 0) {
        message.success("Tạo trận đấu thành công!");
        form.resetFields();
        onSuccess();
        onCancel();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="text-xl font-bold text-blue-600">
          Thiết Lập Trận Đấu
        </span>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={650}
      okText="Tạo trận ngay"
      cancelText="Đóng"
      centered
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          maxPlayers: 10,
          minPlayersToStart: 6,
          isRecurring: false,
          recurringType: "DAILY",
        }}
        className="mt-4"
      >
        <Form.Item
          name="courtId"
          label="Sân thi đấu"
          rules={[{ required: true, message: "Vui lòng chọn sân!" }]}
        >
          <Select placeholder="Chọn sân của bạn" size="large">
            {courts.map((court) => (
              <Select.Option key={court.courtId} value={court.courtId}>
                {court.courtName} -{" "}
                <span className="text-gray-400 text-xs">
                  {court.categoryName}
                </span>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="timeRange"
          label="Thời gian (Trận đầu tiên)"
          rules={[{ required: true, message: "Chọn khung giờ!" }]}
        >
          <DatePicker.RangePicker
            showTime
            format="HH:mm DD/MM/YYYY"
            className="w-full"
            size="large"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="maxPlayers"
            label="Số người tối đa"
            rules={[{ required: true }]}
          >
            <InputNumber min={2} className="w-full" size="large" />
          </Form.Item>
          <Form.Item
            name="minPlayersToStart"
            label="Tối thiểu để chốt"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} className="w-full" size="large" />
          </Form.Item>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-blue-800">
              Cấu hình lặp lại trận đấu
            </span>
            <Form.Item name="isRecurring" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>

          {isRecurring && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Form.Item name="recurringType" label="Tần suất lặp">
                <Select size="large">
                  <Select.Option value="DAILY">Hàng ngày</Select.Option>
                  <Select.Option value="WEEKLY">
                    Theo các thứ trong tuần
                  </Select.Option>
                </Select>
              </Form.Item>

              {recurringType === "WEEKLY" && (
                <Form.Item
                  name="dayOfWeek"
                  label="Chọn các ngày trong tuần"
                  rules={[{ required: true, message: "Chọn ít nhất 1 ngày!" }]}
                >
                  <Checkbox.Group
                    options={DAYS_OF_WEEK}
                    className="flex flex-wrap gap-2"
                  />
                </Form.Item>
              )}

              <Form.Item
                name="endDate"
                label="Ngày kết thúc lặp (Tùy chọn)"
                tooltip="Hệ thống sẽ ngừng tự động tạo trận sau ngày này"
              >
                <DatePicker
                  className="w-full"
                  size="large"
                  placeholder="Chọn ngày dừng lặp"
                />
              </Form.Item>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default CreateMatchModal;

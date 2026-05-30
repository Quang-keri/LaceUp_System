import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  DatePicker,
  TimePicker,
  InputNumber,
  Select,
  Switch,
  message,
  Checkbox,
  Row,
  Col,
} from "antd";
import matchService from "../../../service/match/matchService.ts";
import courtService from "../../../service/courtService.ts";
import type { Dayjs } from "dayjs";

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

  const [sportType, setSportType] = useState<"RACKET" | "OTHER">("OTHER");

  const isRecurring = Form.useWatch("isRecurring", form);
  const recurringType = Form.useWatch("recurringType", form);
  const selectedCourtId = Form.useWatch("courtId", form);

  useEffect(() => {
    const fetchMyCourts = async () => {
      try {
        const res = await courtService.getMyCourts(1, 100);
        if (res.code === 200) {
          let flattenedCourts: any[] = [];
          const items = res.result?.data || res.result || [];

          items.forEach((item: any) => {
            if (item.courtResponses && Array.isArray(item.courtResponses)) {
              item.courtResponses.forEach((court: any) => {
                flattenedCourts.push({
                  ...court,
                  openTime: item.openTime,
                  closeTime: item.closeTime,
                });
              });
            } else if (item.courtId) {
              flattenedCourts.push({
                ...item,
                openTime:
                  item.rentalArea?.openTime || item.openTime || "00:00:00",
                closeTime:
                  item.rentalArea?.closeTime || item.closeTime || "23:59:59",
              });
            }
          });

          setCourts(flattenedCourts);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách sân:", error);
      }
    };

    if (visible) {
      fetchMyCourts();
      form.resetFields();
      setSportType("OTHER");
    }
  }, [visible, form]);

  useEffect(() => {
    if (selectedCourtId && courts.length > 0) {
      const selectedCourt = courts.find((c) => c.courtId === selectedCourtId);

      if (selectedCourt) {
        const catName = (
          selectedCourt.category?.categoryName ||
          selectedCourt.categoryName ||
          ""
        ).toLowerCase();

        let max = 10;
        let isRacketSport = false;

        if (catName.includes("cầu lông") || catName.includes("pickleball")) {
          max = 4;
          isRacketSport = true;
        } else if (
          catName.includes("bóng đá") ||
          catName.includes("football")
        ) {
          max = 10;
        }

        setSportType(isRacketSport ? "RACKET" : "OTHER");

        form.setFieldsValue({
          timeRange: undefined,
          maxPlayers: max,
          minPlayersToStart: Math.ceil(max / 2),
        });
      }
    }
  }, [selectedCourtId, courts, form]);

  const getDisabledTime = (_date: Dayjs | null, type: "start" | "end") => {
    if (!selectedCourtId) return {};
    const court = courts.find((c) => c.courtId === selectedCourtId);
    if (!court || !court.openTime || !court.closeTime) return {};

    const openHour = parseInt(court.openTime.split(":")[0], 10);
    const closeHour = parseInt(court.closeTime.split(":")[0], 10);
    const closeMinute = parseInt(court.closeTime.split(":")[1], 10);

    const timeRange = form.getFieldValue("timeRange");
    const startHour =
      type === "end" && timeRange && timeRange[0] ? timeRange[0].hour() : null;
    const startMinute =
      type === "end" && timeRange && timeRange[0]
        ? timeRange[0].minute()
        : null;

    return {
      disabledHours: () => {
        const hours = [];
        for (let i = 0; i < 24; i++) {
          if (i < openHour || i > closeHour) {
            hours.push(i);
          } else if (type === "end" && startHour !== null && i < startHour) {
            hours.push(i);
          }
        }
        return hours;
      },
      disabledMinutes: (selectedHour: number) => {
        const minutes = [];
        for (let i = 0; i < 60; i++) {
          if (i !== 0 && i !== 30) {
            minutes.push(i);
            continue;
          }
          if (selectedHour === closeHour && i > closeMinute) {
            minutes.push(i);
          }
          if (
            type === "end" &&
            startHour !== null &&
            selectedHour === startHour &&
            i <= startMinute
          ) {
            minutes.push(i);
          }
        }
        return minutes;
      },
    };
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const dateStr = values.matchDate.format("YYYY-MM-DD");
      const startTimeStr = values.timeRange[0].format("HH:mm:ss");
      const endTimeStr = values.timeRange[1].format("HH:mm:ss");

      const requestData: any = {
        courtId: values.courtId,
        startTime: `${dateStr}T${startTimeStr}`,
        endTime: `${dateStr}T${endTimeStr}`,
        maxPlayers: values.maxPlayers,
        minPlayersToStart: values.minPlayersToStart,

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

      if (res.code === 200) {
        message.success("Tạo trận đấu thành công!");
        form.resetFields();
        onSuccess();
        onCancel();
      } else {
        message.error(res.message || "Tạo trận thất bại!");
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      }
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
      centered
      footer={[
        <div key="footer" className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-[#9156F1] to-[orange] hover:scale-[1.02] transition-transform shadow-md"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Tạo trận ngay"}
          </button>
        </div>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
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
                  {court.category?.categoryName || court.categoryName}
                </span>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12} xs={24} sm={12}>
            <Form.Item
              name="matchDate"
              label="Ngày thi đấu"
              rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
            >
              <DatePicker
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
              />
            </Form.Item>
          </Col>
          <Col span={12} xs={24} sm={12}>
            <Form.Item
              name="timeRange"
              label="Khung giờ thi đấu"
              rules={[{ required: true, message: "Vui lòng chọn khung giờ!" }]}
            >
              <TimePicker.RangePicker
                format="HH:mm"
                className="w-full"
                size="large"
                minuteStep={30}
                hideDisabledOptions={true}
                placeholder={["Bắt đầu", "Kết thúc"]}
                disabled={!selectedCourtId}
                disabledTime={getDisabledTime}
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Form.Item
            name="maxPlayers"
            label="Số người tối đa"
            rules={[{ required: true, message: "Vui lòng chọn số người!" }]}
          >
            {sportType === "RACKET" ? (
              <Select
                size="large"
                onChange={(val) => {
                  if (val) {
                    form.setFieldsValue({
                      minPlayersToStart: Math.ceil(Number(val) / 2),
                    });
                  }
                }}
              >
                <Select.Option value={2}>2 người (Đánh đơn)</Select.Option>
                <Select.Option value={4}>4 người (Đánh đôi)</Select.Option>
              </Select>
            ) : (
              <InputNumber
                min={2}
                max={30}
                className="w-full"
                size="large"
                onChange={(val) => {
                  if (val) {
                    form.setFieldsValue({
                      minPlayersToStart: Math.ceil(Number(val) / 2),
                    });
                  }
                }}
              />
            )}
          </Form.Item>

          <Form.Item
            name="minPlayersToStart"
            label="Tối thiểu để chốt"
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("maxPlayers") >= value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Min không được lớn hơn Max!"),
                  );
                },
              }),
            ]}
          >
            <InputNumber min={2} max={30} className="w-full" size="large" />
          </Form.Item>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-blue-800">
              Cấu hình lặp lại trận đấu
            </span>
            <Form.Item name="isRecurring" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>

          {isRecurring && (
            <div className="space-y-4 animate-in fade-in duration-500 mt-4 border-t border-blue-200 pt-4">
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
                  format="DD/MM/YYYY"
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

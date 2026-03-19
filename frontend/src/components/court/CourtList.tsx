import { useState } from "react";
import { DatePicker, Form, InputNumber, message, Modal, Select } from "antd";
import matchService from "../../service/matchService";
import dayjs from "dayjs";

const PRICE_TYPE_LABEL: any = {
  NORMAL: "Giá thường",
  WEEKEND: "Cuối tuần",
  PEAK: "Giờ cao điểm",
  HOLIDAY: "Ngày lễ",
  EVENT: "Sự kiện",
  OTHER: "Khác",
};

export default function CourtList({ courts, onAddCourt, filter }: any) {
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);

  const [openMatchModal, setOpenMatchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // group theo type + specificDate
  const groupByType = (rules: any[]) => {
    const map: any = {};

    rules.forEach((r) => {
      const key = r.specificDate ? `DATE_${r.specificDate}` : r.priceType;

      if (!map[key]) map[key] = [];
      map[key].push(r);
    });

    return map;
  };

  const renderPriceTable = (court: any) => {
    const grouped = groupByType(court.priceRules || []);

    if (!court.priceRules || court.priceRules.length === 0) {
      return (
        <p className="text-gray-500">
          Giá cố định: {court.price?.toLocaleString()} VNĐ / giờ
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {Object.keys(grouped).map((key) => {
          const rules = grouped[key];
          const formatDate = (dateStr: string) => {
            const d = new Date(dateStr);

            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();

            return `${day}/${month}/${year}`;
          };
          let title = "";
          if (key.startsWith("DATE_")) {
            const rawDate = key.replace("DATE_", "");
            title = `Ngày đặc biệt: ${formatDate(rawDate)}`;
          } else {
            title = PRICE_TYPE_LABEL[key] || key;
          }

          return (
            <div key={key}>
              <p className="font-semibold text-gray-700 mb-1">
                --- {title} ---
              </p>

              {rules.map((r: any) => (
                <p key={r.courtPriceId} className="text-sm text-gray-600 ml-2">
                  {r.startTime.slice(0, 5)} - {r.endTime.slice(0, 5)}:{" "}
                  <span className="text-blue-600">
                    {r.pricePerHour.toLocaleString()} VNĐ
                  </span>
                </p>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const handleCreateMatch = async (values: any) => {
    if (!selectedCourt) return;

    setLoading(true);
    try {
      const start = values.startTime;
      const end = start.add(values.duration, "hour");

      const payload = {
        courtId: selectedCourt.courtId,
        categoryId:
          selectedCourt.categoryId || selectedCourt.category?.categoryId,
        address: selectedCourt.address || "Địa chỉ mặc định",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        maxPlayers: values.maxPlayers,
        minPlayersToStart: values.minPlayersToStart,
        isRecurring: false,
      };

      await matchService.createMatch(payload);
      message.success("Tạo trận đấu thành công!");
      setOpenMatchModal(false);
      form.resetFields();
    } catch (error: any) {
      // Log chi tiết lỗi từ backend để biết chính xác sai ở đâu
      console.error("Lỗi Backend trả về:", error.response?.data);
      message.error(error.response?.data?.message || "Không thể tạo trận đấu.");
    } finally {
      setLoading(false);
    }
  };

  const disabledDateTime = (current: any) => {
    const now = dayjs();
    const isToday = current && current.isSame(now, "day");

    return {
      disabledHours: () => {
        if (!isToday) return [];
        return Array.from({ length: now.hour() }, (_, i) => i);
      },
      disabledMinutes: (selectedHour: number) => {
        const minuteOptions = [0, 30];
        const disabledMin = Array.from({ length: 60 }, (_, i) => i).filter(
          (m) => !minuteOptions.includes(m),
        );

        if (isToday && selectedHour === now.hour()) {
          if (now.minute() >= 0) disabledMin.push(0);
          if (now.minute() >= 30) disabledMin.push(30);
        }

        return disabledMin;
      },
    };
  };

  return (
    <>
      <div className="space-y-4">
        {courts.map((court: any) => (
          <div key={court.courtId} className="border rounded-xl p-4 flex gap-4">
            <img
              src={court.coverImage}
              className="w-40 h-28 object-cover rounded"
            />

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{court.courtName}</h3>

              <p className="text-gray-500">{court.categoryName}</p>

              <p className="text-blue-600 font-semibold mt-1">
                Giá từ: {(court.minPrice || court.price)?.toLocaleString()} VNĐ
              </p>

              <button
                onClick={() => {
                  setSelectedCourt(court);
                  setOpenModal(true);
                }}
                className="text-sm text-blue-500 mt-1 underline"
              >
                Xem bảng giá
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => onAddCourt(court)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Thêm vào giỏ
              </button>

              <button
                onClick={() => {
                  setSelectedCourt(court);
                  setOpenMatchModal(true);
                }}
                className="border border-orange-500 text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                Tạo kèo ghép
              </button>
            </div>

            <button
              onClick={() => onAddCourt(court)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Thêm
            </button>
          </div>
        ))}
      </div>

      <Modal
        title={`Bảng giá - ${selectedCourt?.courtName || ""}`}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={null}
      >
        {selectedCourt && renderPriceTable(selectedCourt)}
      </Modal>

      <Modal
        title="Thiết lập kèo ghép khách"
        open={openMatchModal}
        onCancel={() => setOpenMatchModal(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Xác nhận tạo"
        cancelText="Hủy"
        width={500}
      >
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            Bạn đang tạo kèo ghép cho:{" "}
            <strong>{selectedCourt?.courtName}</strong>
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateMatch}
          initialValues={{
            maxPlayers: 4,
            minPlayersToStart: 2,
            duration: 1, // Mặc định chơi 1h
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Giờ bắt đầu"
              name="startTime"
              rules={[
                { required: true, message: "Vui lòng chọn giờ bắt đầu!" },
              ]}
            >
              <DatePicker
                showTime={{
                  format: "HH:mm",
                  hideDisabledOptions: true,
                }}
                format="HH:mm - DD/MM"
                className="w-full"
                placeholder="Chọn giờ"
                showNow={false}
                // Chặn ngày quá khứ
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                // Chặn giờ quá khứ (QUAN TRỌNG)
                disabledTime={disabledDateTime}
              />
            </Form.Item>

            <Form.Item
              label="Thời lượng chơi"
              name="duration"
              rules={[{ required: true }]}
            >
              <Select className="w-full">
                <Select.Option value={1}>1 giờ</Select.Option>
                <Select.Option value={1.5}>1.5 giờ</Select.Option>
                <Select.Option value={2}>2 giờ</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Số người tối đa"
              name="maxPlayers"
              rules={[{ required: true, message: "Nhập số người tối đa!" }]}
            >
              <InputNumber
                min={2}
                className="w-full"
                onChange={(val) => {
                  if (val)
                    form.setFieldValue("minPlayersToStart", Math.ceil(val / 2));
                }}
              />
            </Form.Item>

            <Form.Item
              label="Số người tối thiểu"
              name="minPlayersToStart"
              tooltip="Trận đấu sẽ bị hủy nếu không đủ số người này"
              rules={[
                { required: true, message: "Nhập số người tối thiểu!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("maxPlayers") >= value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Tối thiểu ≤ Tối đa!"));
                  },
                }),
              ]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}

import { useState } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  message,
  Modal,
  Select,
  Radio,
} from "antd";
import matchService from "../../service/match/matchService";
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
        matchType: values.matchType,
        winnerPercent: values.matchType === "BET" ? values.winnerPercent : null,
        minRank: values.matchType === "RANKED" ? values.minRank : null,
        maxRank: values.matchType === "RANKED" ? values.maxRank : null,
      };

      await matchService.createMatch(payload as any);
      message.success("Tạo trận đấu thành công!");
      setOpenMatchModal(false);
      form.resetFields();
    } catch (error: any) {
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
          <div
            key={court.courtId}
            className="border rounded-xl p-4 flex gap-4 bg-white shadow-sm"
          >
            <img
              src={
                court.coverImage ||
                "https://placehold.co/600x400?text=San+The+Thao"
              }
              className="w-40 h-28 object-cover rounded"
              alt="Court Cover"
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
                className="text-sm text-blue-500 mt-1 underline hover:text-blue-700"
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
                  form.resetFields(); // Reset form mỗi khi mở modal mới
                  setOpenMatchModal(true);
                }}
                className="border border-orange-500 text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                Tạo kèo ghép
              </button>
            </div>
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
        title={
          <div className="text-lg font-bold text-gray-800">
            🏸 Thiết lập kèo ghép khách
          </div>
        }
        open={openMatchModal}
        onCancel={() => setOpenMatchModal(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Xác nhận tạo kèo"
        cancelText="Hủy"
        width={500}
        centered
      >
        <div className="mb-6 mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-2">
          <span className="text-xl">📍</span>
          <p className="text-sm text-blue-900">
            Sân áp dụng: <strong>{selectedCourt?.courtName}</strong>
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateMatch}
          initialValues={{
            maxPlayers: 4,
            minPlayersToStart: 2,
            duration: 1,
            // Giá trị mặc định cho thể thức
            matchType: "NORMAL",
            winnerPercent: 0,
            minRank: 2000,
            maxRank: 4000,
          }}
        >
          {/* Lựa chọn Thể thức */}
          <Form.Item
            label={
              <span className="font-semibold text-gray-700">
                Thể thức thi đấu
              </span>
            }
            name="matchType"
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className="flex w-full"
            >
              <Radio.Button value="NORMAL" className="w-1/3 text-center">
                😊 Giao lưu
              </Radio.Button>
              <Radio.Button value="BET" className="w-1/3 text-center">
                💰 Chia Kèo
              </Radio.Button>
              <Radio.Button value="RANKED" className="w-1/3 text-center">
                🏆 Đánh Rank
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) =>
              prev.matchType !== curr.matchType ||
              prev.winnerPercent !== curr.winnerPercent
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("matchType");

              if (type === "BET") {
                const currentWinnerPercent =
                  getFieldValue("winnerPercent") || 0;
                const loserPercent = 100 - currentWinnerPercent;

                return (
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                    <Form.Item
                      label={
                        <span className="text-yellow-700 font-bold">
                          % Tiền sân phe THẮNG phải trả
                        </span>
                      }
                      className="mb-0" // Bỏ margin bottom mặc định của Antd
                    >
                      <div className="flex items-center gap-4">
                        {/* Ô nhập liệu (Nhỏ lại, nằm bên trái) */}
                        <Form.Item name="winnerPercent" noStyle>
                          <InputNumber
                            min={0}
                            max={50}
                            step={10}
                            formatter={(value) => `${value}%`}
                            parser={(value) => value!.replace("%", "")}
                            className="w-24 font-bold text-yellow-700 text-lg"
                          />
                        </Form.Item>

                        {/* Ô hiển thị phe thua (Nằm bên phải) */}
                        <div className="flex-1 bg-yellow-100/80 py-1.5 px-3 rounded-lg border border-yellow-300 text-sm text-yellow-800 flex items-center gap-2 shadow-sm">
                          <span>👉</span>
                          <span>
                            <strong>Phe THUA</strong> sẽ trả:{" "}
                            <span className="text-red-500 font-bold text-base">
                              {loserPercent}%
                            </span>
                          </span>
                        </div>
                      </div>
                    </Form.Item>
                  </div>
                );
              }

              if (type === "RANKED") {
                return (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-4 grid grid-cols-2 gap-4">
                    <Form.Item
                      label={
                        <span className="text-purple-700 font-bold">
                          Rank tối thiểu
                        </span>
                      }
                      name="minRank"
                      rules={[{ required: true, message: "Bắt buộc nhập" }]}
                      className="mb-0"
                    >
                      <InputNumber
                        step={100}
                        className="w-full font-bold text-purple-700 text-lg"
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span className="text-purple-700 font-bold">
                          Rank tối đa
                        </span>
                      }
                      name="maxRank"
                      className="mb-0"
                      rules={[
                        { required: true, message: "Bắt buộc nhập" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("minRank") <= value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error("Phải ≥ Min!"));
                          },
                        }),
                      ]}
                    >
                      <InputNumber
                        step={100}
                        className="w-full font-bold text-purple-700 text-lg"
                      />
                    </Form.Item>
                  </div>
                );
              }

              return null;
            }}
          </Form.Item>

          <hr className="my-5 border-gray-100" />

          {/* Thời gian */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={
                <span className="font-semibold text-gray-700">Giờ bắt đầu</span>
              }
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
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                disabledTime={disabledDateTime}
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="font-semibold text-gray-700">
                  Thời lượng chơi
                </span>
              }
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

          {/* Số lượng người */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={
                <span className="font-semibold text-gray-700">
                  Số người tối đa
                </span>
              }
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
              label={
                <span className="font-semibold text-gray-700">
                  Người tối thiểu
                </span>
              }
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

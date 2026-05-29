import { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Radio,
  Button,
  Typography,
  Space,
  Alert,
  Select,
  message,
  DatePicker,
  List,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import {
  ClockCircleOutlined,
  SwapOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { bookingSlotService } from "../../../service/bookingSlotService";

const { Text } = Typography;

export default function SlotEditorModal({
  open,
  booking,
  onClose,
  onSuccess,
}: any) {
  const [activeSlot, setActiveSlot] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setActiveSlot(null);
    }
  }, [open, booking]);

  const handleClose = () => {
    setActiveSlot(null);
    onClose();
  };

  const handleSuccess = () => {
    setActiveSlot(null);
    if (onSuccess) onSuccess();
  };

  const slots = booking?.slots || [];
  const rentalAreaId = booking?.rentalArea?.rentalAreaId;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={520}
      title={
        <Space>
          {activeSlot && (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setActiveSlot(null)}
            />
          )}
          <span style={{ fontWeight: 600 }}>
            {activeSlot
              ? `Chỉnh sửa slot — Sân ${activeSlot.courtCode || "Chưa rõ"}`
              : `Chọn Slot cần xử lý (Đơn ${
                  booking?.bookingId?.substring(0, 8) || ""
                })`}
          </span>
        </Space>
      }
    >
      {!activeSlot ? (
        <List
          dataSource={slots}
          locale={{ emptyText: "Đơn này không có slot nào" }}
          renderItem={(s: any) => (
            <List.Item
              style={{ padding: "12px 0" }}
              actions={[
                <Button
                  size="small"
                  type="primary"
                  ghost
                  icon={<EditOutlined />}
                  onClick={() => setActiveSlot(s)}
                >
                  Thao tác
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`Sân: ${s.courtCode || "Chưa rõ"}`}
                description={`${dayjs(s.startTime).format(
                  "DD/MM/YYYY HH:mm",
                )} → ${dayjs(s.endTime).format("HH:mm")}`}
              />
            </List.Item>
          )}
        />
      ) : (
        <SlotEditForm
          slot={activeSlot}
          rentalAreaId={rentalAreaId}
          onSuccess={handleSuccess}
        />
      )}
    </Modal>
  );
}

function SlotEditForm({ slot, rentalAreaId, onSuccess }: any) {
  const [mode, setMode] = useState("extend");

  const [extendMinutes, setExtendMinutes] = useState(30);
  const [checkExtend, setCheckExtend] = useState<any>(null);
  const [loadingExtend, setLoadingExtend] = useState(false);

  const [targetCourt, setTargetCourt] = useState<any>(null);
  const [targetDate, setTargetDate] = useState<any>(null);
  const [targetStartTime, setTargetStartTime] = useState<any>(null);
  const [targetEndTime, setTargetEndTime] = useState<any>(null);

  const [checkSwap, setCheckSwap] = useState<any>(null);
  const [loadingSwap, setLoadingSwap] = useState(false);

  const [courtOptions, setCourtOptions] = useState<any[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);

  const start = dayjs(slot?.startTime);
  const end = dayjs(slot?.endTime);
  const duration = end.diff(start, "minute");

  const MAX_TOTAL_MINUTES = 240;
  const maxExtendAllowed = MAX_TOTAL_MINUTES - duration;

  const extendOptions = useMemo(() => {
    const opts = [];
    for (let i = 30; i <= maxExtendAllowed; i += 30) {
      opts.push(i);
    }
    return opts;
  }, [maxExtendAllowed]);

  useEffect(() => {
    if (maxExtendAllowed > 0 && !extendOptions.includes(extendMinutes)) {
      setExtendMinutes(extendOptions[0] || 0);
    }
  }, [extendOptions, extendMinutes, maxExtendAllowed]);

  const newEnd = useMemo(
    () => end.add(extendMinutes, "minute"),
    [extendMinutes, end],
  );

  useEffect(() => {
    if (slot) {
      setTargetCourt(slot.courtCopy?.courtCopyId || null);
      setTargetDate(dayjs(slot.startTime));
      setTargetStartTime(dayjs(slot.startTime));
      setTargetEndTime(dayjs(slot.endTime));
    }
  }, [slot]);

  useEffect(() => {
    if (mode === "swap" && rentalAreaId && courtOptions.length === 0) {
      fetchCourts();
    }
  }, [mode, rentalAreaId]);

  const fetchCourts = async () => {
    setLoadingCourts(true);
    try {
      const courtsRes: any = await bookingSlotService.getCourts(rentalAreaId);
      const options: any[] = [];

      if (Array.isArray(courtsRes)) {
        courtsRes.forEach((courtType: any) => {
          if (Array.isArray(courtType.courtCopies)) {
            courtType.courtCopies.forEach((copy: any) => {
              if (copy.status === "ACTIVE") {
                options.push({
                  label: `${courtType.courtName} - ${copy.courtCode}`,
                  value: copy.courtCopyId,
                });
              }
            });
          }
        });
      }
      setCourtOptions(options);
    } catch {
      message.error("Lỗi tải danh sách sân");
    } finally {
      setLoadingCourts(false);
    }
  };

  const handleCheckExtend = async () => {
    try {
      setLoadingExtend(true);
      const res = await bookingSlotService.checkExtend(slot.slotId, {
        amount: extendMinutes,
        unit: "minute",
      });
      setCheckExtend(res);
    } catch {
      message.error("Lỗi kiểm tra gia hạn");
    } finally {
      setLoadingExtend(false);
    }
  };

  const handleConfirmExtend = async () => {
    try {
      await bookingSlotService.confirmExtend(slot.slotId, {
        amount: extendMinutes,
        unit: "minute",
      });
      message.success("Gia hạn thành công");
      onSuccess();
    } catch {
      message.error("Lỗi xác nhận gia hạn");
    }
  };

  const handleCheckSwap = async () => {
    if (!targetCourt || !targetDate || !targetStartTime || !targetEndTime) {
      return message.warning("Vui lòng chọn đầy đủ sân và ngày giờ");
    }

    const newStart = targetDate
      .clone()
      .hour(targetStartTime.hour())
      .minute(targetStartTime.minute())
      .second(0);

    let newEndT = targetDate
      .clone()
      .hour(targetEndTime.hour())
      .minute(targetEndTime.minute())
      .second(0);

    if (newEndT.isBefore(newStart)) {
      newEndT = newEndT.add(1, "day");
    }

    const newDuration = newEndT.diff(newStart, "minute");

    if (newDuration !== duration) {
      return message.error(
        `Thời lượng không hợp lệ! Khung giờ mới (${newDuration} phút) phải bằng với thời lượng cũ (${duration} phút).`,
      );
    }

    try {
      setLoadingSwap(true);
      const res = await bookingSlotService.checkSwap(slot.slotId, {
        courtCopyId: targetCourt,
        newStartTime: newStart.format("YYYY-MM-DDTHH:mm:ss"),
      });
      setCheckSwap(res);
    } catch {
      message.error("Lỗi kiểm tra swap");
    } finally {
      setLoadingSwap(false);
    }
  };

  const handleConfirmSwap = async () => {
    const newStart = targetDate
      .clone()
      .hour(targetStartTime.hour())
      .minute(targetStartTime.minute())
      .second(0);

    try {
      await bookingSlotService.confirmSwap(slot.slotId, {
        courtCopyId: targetCourt,
        newStartTime: newStart.format("YYYY-MM-DDTHH:mm:ss"),
      });
      message.success("Đổi slot thành công");
      onSuccess();
    } catch {
      message.error("Lỗi xác nhận swap");
    }
  };

  const formatTimeLabel = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h${m}`;
  };

  return (
    <div>
      {/* CURRENT SLOT INFO */}
      <div
        style={{
          background: "#f0f5ff",
          border: "1px solid #d6e4ff",
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
          THÔNG TIN SLOT HIỆN TẠI
        </Text>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#1890ff",
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          Sân đang đặt: {slot?.courtCode || "Chưa rõ"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>
          {start.format("DD/MM/YYYY HH:mm")} → {end.format("HH:mm")}
          <Text type="secondary" style={{ marginLeft: 8 }}>
            ({duration} phút)
          </Text>
        </div>
      </div>

      {/* MODE SWITCH */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div
          onClick={() => setMode("extend")}
          style={{
            flex: 1,
            padding: 12,
            border:
              mode === "extend" ? "1px solid #1890ff" : "1px solid #d9d9d9",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "center",
            background: mode === "extend" ? "#e6f7ff" : "#fff",
          }}
        >
          <ClockCircleOutlined
            style={{ color: mode === "extend" ? "#1890ff" : "inherit" }}
          />
          <div style={{ fontWeight: 500, marginTop: 4 }}>Gia hạn thêm</div>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
            Kéo dài thời gian
          </div>
        </div>

        <div
          onClick={() => setMode("swap")}
          style={{
            flex: 1,
            padding: 12,
            border: mode === "swap" ? "1px solid #1890ff" : "1px solid #d9d9d9",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "center",
            background: mode === "swap" ? "#e6f7ff" : "#fff",
          }}
        >
          <SwapOutlined
            style={{ color: mode === "swap" ? "#1890ff" : "inherit" }}
          />
          <div style={{ fontWeight: 500, marginTop: 4 }}>Chuyển slot</div>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
            Đổi sang giờ/sân khác
          </div>
        </div>
      </div>

      {/* EXTEND UI */}
      {mode === "extend" && (
        <>
          <Text strong>Gia hạn thêm bao lâu?</Text>
          <div style={{ marginTop: 8 }}>
            {maxExtendAllowed >= 30 ? (
              <Radio.Group
                value={extendMinutes}
                onChange={(e) => {
                  setExtendMinutes(e.target.value);
                  setCheckExtend(null);
                }}
                buttonStyle="solid"
                style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
              >
                {extendOptions.map((mins) => (
                  <Radio.Button
                    key={mins}
                    value={mins}
                    style={{ borderRadius: 6 }}
                  >
                    {formatTimeLabel(mins)}
                  </Radio.Button>
                ))}
              </Radio.Group>
            ) : (
              <Alert
                type="warning"
                message="Đã đạt giới hạn 4 giờ"
                description="Slot này đã đạt (hoặc vượt) thời lượng tối đa cho phép, không thể gia hạn thêm."
                showIcon
              />
            )}
          </div>

          {maxExtendAllowed >= 30 && (
            <div
              style={{
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                padding: 16,
                borderRadius: 8,
                marginTop: 20,
              }}
            >
              <Text type="secondary" style={{ fontSize: 12, color: "#389e0d" }}>
                THỜI GIAN DỰ KIẾN SAU GIA HẠN (Tối đa 4h)
              </Text>
              <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                {start.format("HH:mm")} →
                <span style={{ color: "#52c41a", marginLeft: 4 }}>
                  {newEnd.format("HH:mm")}
                </span>
                <Text style={{ marginLeft: 8, color: "#52c41a" }}>
                  (Tổng: {duration + extendMinutes} phút)
                </Text>
              </div>
            </div>
          )}

          {checkExtend?.available && (
            <Alert
              type="success"
              message={`Phí phát sinh thêm: ${checkExtend.extraPrice?.toLocaleString()}đ`}
              style={{ marginTop: 16 }}
            />
          )}

          {checkExtend?.available === false && (
            <Alert
              type="error"
              message={
                checkExtend.conflictReason ||
                "Không thể gia hạn (Bị trùng lịch)"
              }
              style={{ marginTop: 16 }}
            />
          )}

          {maxExtendAllowed >= 30 && (
            <Space style={{ marginTop: 16 }}>
              <Button
                icon={<SearchOutlined />}
                onClick={handleCheckExtend}
                loading={loadingExtend}
              >
                Kiểm tra xung đột
              </Button>
              {checkExtend?.available && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConfirmExtend}
                >
                  Xác nhận gia hạn
                </Button>
              )}
            </Space>
          )}
        </>
      )}

      {/* SWAP UI */}
      {mode === "swap" && (
        <>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Select
              placeholder="Chọn sân muốn đổi sang"
              style={{ width: "100%" }}
              value={targetCourt}
              onChange={(val) => {
                setTargetCourt(val);
                setCheckSwap(null);
              }}
              options={courtOptions}
              loading={loadingCourts}
              showSearch
              optionFilterProp="label"
            />

            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <DatePicker
                format="DD/MM/YYYY"
                placeholder="Ngày"
                style={{ flex: 1 }}
                value={targetDate}
                onChange={(d) => {
                  setTargetDate(d);
                  setCheckSwap(null);
                }}
              />
              <TimePicker
                format="HH:mm"
                placeholder="Bắt đầu"
                style={{ width: 100 }}
                value={targetStartTime}
                onChange={(t) => {
                  setTargetStartTime(t);
                  if (t) setTargetEndTime(t.add(duration, "minute"));
                  setCheckSwap(null);
                }}
              />
              <TimePicker
                format="HH:mm"
                placeholder="Kết thúc"
                style={{ width: 100 }}
                value={targetEndTime}
                onChange={(t) => {
                  setTargetEndTime(t);
                  setCheckSwap(null);
                }}
              />
            </div>
          </Space>

          {checkSwap?.available && (
            <Alert
              type={checkSwap.priceDiff > 0 ? "warning" : "success"}
              message={
                <div>
                  <div style={{ fontWeight: 500 }}>
                    Giá sân mới: {checkSwap.newPrice?.toLocaleString()}đ
                  </div>
                  {checkSwap.priceDiff > 0 && (
                    <div
                      style={{
                        color: "#d48806",
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      Phát sinh thêm: +{checkSwap.priceDiff.toLocaleString()}đ
                    </div>
                  )}
                  {checkSwap.priceDiff < 0 && (
                    <div
                      style={{
                        color: "#52c41a",
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      Giá rẻ hơn:{" "}
                      {Math.abs(checkSwap.priceDiff).toLocaleString()}đ (Hoàn
                      tiền)
                    </div>
                  )}
                  {checkSwap.priceDiff === 0 && (
                    <div
                      style={{
                        color: "#52c41a",
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      Không phát sinh chênh lệch (Giữ nguyên giá)
                    </div>
                  )}
                </div>
              }
              style={{ marginTop: 16 }}
            />
          )}

          {checkSwap?.available === false && (
            <Alert
              type="error"
              message={checkSwap.conflictReason || "Khung giờ này đã bị trùng"}
              style={{ marginTop: 16 }}
            />
          )}

          <Space style={{ marginTop: 16 }}>
            <Button
              icon={<SearchOutlined />}
              onClick={handleCheckSwap}
              loading={loadingSwap}
            >
              Kiểm tra slot trống
            </Button>
            {checkSwap?.available && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirmSwap}
              >
                Xác nhận đổi
              </Button>
            )}
          </Space>
        </>
      )}
    </div>
  );
}

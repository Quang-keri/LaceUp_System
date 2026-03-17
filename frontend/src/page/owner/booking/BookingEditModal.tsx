import {
  Modal,
  Form,
  Select,
  Input,
  Divider,
  DatePicker,
  Typography,
  message,
  Button,
  Space,
  Tag,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import courtService from "../../../service/courtService";

const { Text } = Typography;

interface Props {
  open: boolean;
  booking: any;
  rentalAreaId?: string | null;
  onCancel: () => void;
  onSubmit: (values: any) => void;
}

export default function BookingEditModal({
  open,
  booking,
  rentalAreaId,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm();
  const [courtCopyOptions, setCourtCopyOptions] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;

    form.setFieldsValue({
      bookerName: booking.userName,
      bookerPhone: booking.phoneNumber,
      status: booking.bookingStatus,
      notes: booking.note,

      slots: booking.slots?.map((slot: any) => ({
        slotId: slot.slotId,

        currentStart: dayjs(slot.startTime),
        currentEnd: dayjs(slot.endTime),

        timeRange: null,

        courtCode: slot.courtCode,
        courtCopyId: slot.courtCopyId,
        originalCourtCopyId: slot.courtCopyId,
      })),
    });
  }, [open, booking]);

  useEffect(() => {
    const fetchCourtCopies = async () => {
      try {
        const rentalId = rentalAreaId || booking?.rentalAreaId;
        if (!rentalId) return;

        const res = await courtService.getCourtsByRentalArea(rentalId, 1, 200);

        const courts = res.result?.data || [];

        const options: any[] = [];

        courts.forEach((c: any) => {
          (c.courtCopies || []).forEach((copy: any) => {
            options.push({
              label: `${c.courtName} - ${copy.courtCode}`,
              value: copy.courtCopyId,
            });
          });
        });

        setCourtCopyOptions(options);
      } catch {
        message.error("Không thể tải danh sách sân");
      }
    };

    if (open) fetchCourtCopies();
  }, [open]);

  const getSlotTime = (slot: any) => {
    const startMoment = slot.timeRange?.[0] ?? slot.currentStart;
    const endMoment = slot.timeRange?.[1] ?? slot.currentEnd;

    return {
      start: dayjs(startMoment).format("YYYY-MM-DDTHH:mm:ss"),
      end: dayjs(endMoment).format("YYYY-MM-DDTHH:mm:ss"),
    };
  };

  const checkSlotsAvailability = async (slots: any[]) => {
    setChecking(true);

    try {
      for (const s of slots) {
        const changed = s.timeRange || s.courtCopyId !== s.originalCourtCopyId;

        if (!changed) continue;

        const { start, end } = getSlotTime(s);

        const available = await courtService.checkCourtCopyAvailability(
          s.courtCopyId,
          start,
          end,
          s.slotId,
        );

        if (!available) {
          message.error(`Sân ${s.courtCode} đã bị đặt`);
          return false;
        }
      }

      return true;
    } finally {
      setChecking(false);
    }
  };

  const handleAutoFind = async (index: number) => {
    const slots = form.getFieldValue("slots") || [];
    const s = slots[index];

    const startMoment = s?.timeRange?.[0] ?? s?.currentStart;
    const endMoment = s?.timeRange?.[1] ?? s?.currentEnd;

    if (!startMoment || !endMoment) {
      message.warning("Vui lòng chọn thời gian");
      return;
    }

    const start = dayjs(startMoment).format("YYYY-MM-DDTHH:mm:ss");
    const end = dayjs(endMoment).format("YYYY-MM-DDTHH:mm:ss");

    setChecking(true);

    try {
      for (const opt of courtCopyOptions) {
        const available = await courtService.checkCourtCopyAvailability(
          opt.value,
          start,
          end,
          s.slotId,
        );

        if (available) {
          const code = String(opt.label).split("-").pop()?.trim() || "";

          const newSlots = [...slots];

          newSlots[index] = {
            ...newSlots[index],
            courtCopyId: opt.value,
            courtCode: code,
          };

          form.setFieldsValue({ slots: newSlots });

          message.success(`Tìm được sân: ${opt.label}`);
          return;
        }
      }

      message.error("Không tìm thấy sân trống");
    } finally {
      setChecking(false);
    }
  };


  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const slots = values.slots || [];

      if (slots.length === 0) {
        message.error("Booking phải có ít nhất 1 slot");
        return;
      }

      const ok = await checkSlotsAvailability(slots);
      if (!ok) return;

      const changedSlots = slots
        .filter(
          (s: any) => s.timeRange || s.courtCopyId !== s.originalCourtCopyId,
        )
        .map((s: any) => {
          const { start, end } = getSlotTime(s);

          return {
            slotId: s.slotId,
            courtCopyId: s.courtCopyId, 
            startTime: start,
            endTime: end,
          };
        });

      const payload: any = {};

     
      if (values.bookerName?.trim() !== booking.userName?.trim()) {
        payload.bookerName = values.bookerName;
      }

      if (values.bookerPhone?.trim() !== booking.phoneNumber?.trim()) {
        payload.bookerPhone = values.bookerPhone;
      }

      if (values.notes?.trim() !== (booking.note?.trim() || "")) {
        payload.note = values.notes;
      }

      if (values.status !== booking.bookingStatus) {
        payload.bookingStatus = values.status;
      }

      if (changedSlots.length > 0) {
        payload.slots = changedSlots;
      }

      if (Object.keys(payload).length === 0) {
        message.info("Không có thay đổi nào");
        return;
      }

      
      if (payload.slots) {
        console.log("📍 Slot Times Sent:");
        payload.slots.forEach((slot: any, idx: number) => {
          console.log(`   Slot ${idx}: ${slot.startTime} → ${slot.endTime}`);
        });
      }
 

    

      onSubmit(payload);
    } catch (error: any) {
      message.error(error?.message || "Vui lòng kiểm tra lại dữ liệu");
    }
  };

  return (
    <Modal
      title="Cập nhật Booking"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={checking}
      width={700}
      okText="Lưu thay đổi"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên khách hàng"
          name="bookerName"
          rules={[
            { required: true, message: "Vui lòng nhập tên khách hàng" },
            { min: 2, message: "Tên phải có ít nhất 2 ký tự" },
            { max: 100, message: "Tên không quá 100 ký tự" },
          ]}
        >
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="bookerPhone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại" },
            {
              pattern: /^[0-9]{10,11}$/,
              message: "SĐT phải 10-11 chữ số",
            },
          ]}
        >
          <Input placeholder="VD: 0912345678" />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status">
          <Select
            placeholder="Chọn trạng thái"
            options={[
              { label: "Đã xác nhận", value: "BOOKED" },
              { label: "Hoàn thành", value: "COMPLETED" },
              { label: "Hủy", value: "CANCELLED" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Ghi chú" name="notes">
          <Input.TextArea
            rows={2}
            placeholder="Ghi chú hoặc yêu cầu đặc biệt..."
          />
        </Form.Item>

        <Divider>Danh sách Slots</Divider>

        <Form.List name="slots">
          {(fields) => (
            <>
              {fields.map(({ key, name, ...rest }) => {
                const hasTimeChange = form.getFieldValue([
                  "slots",
                  name,
                  "timeRange",
                ]);
                const hasCourtChange =
                  form.getFieldValue(["slots", name, "courtCopyId"]) !==
                  form.getFieldValue(["slots", name, "originalCourtCopyId"]);

                return (
                  <div
                    key={key}
                    style={{
                      background:
                        hasTimeChange || hasCourtChange ? "#e6f7ff" : "#f5f5f5",
                      padding: 12,
                      marginBottom: 10,
                      borderRadius: 8,
                      border:
                        hasTimeChange || hasCourtChange
                          ? "1px solid #1890ff"
                          : "none",
                    }}
                  >
                    <Space style={{ marginBottom: 12 }} wrap>
                      <Text strong>
                        Sân: {form.getFieldValue(["slots", name, "courtCode"])}
                      </Text>
                      {(hasTimeChange || hasCourtChange) && (
                        <Tag color="blue" icon={<CheckCircleOutlined />}>
                          Có thay đổi
                        </Tag>
                      )}
                    </Space>

                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary"> Thời gian hiện tại</Text>
                      <div>
                        {form
                          .getFieldValue(["slots", name, "currentStart"])
                          ?.format("YYYY-MM-DD HH:mm")}{" "}
                        -{" "}
                        {form
                          .getFieldValue(["slots", name, "currentEnd"])
                          ?.format("YYYY-MM-DD HH:mm")}
                      </div>
                    </div>

                    <Form.Item
                      {...rest}
                      name={[name, "timeRange"]}
                      label=" Thời gian mới (nếu cần đổi)"
                      rules={[
                        {
                          validator(_, value) {
                            if (!value) return Promise.resolve();

                            const [start, end] = value;

                            if (
                              start.minute() % 30 !== 0 ||
                              end.minute() % 30 !== 0
                            ) {
                              return Promise.reject(
                                new Error(
                                  "Phải chọn mốc 30 phút (XX:00 hoặc XX:30)",
                                ),
                              );
                            }

                            if (end.diff(start, "minute") < 60) {
                              return Promise.reject(
                                new Error("Tối thiểu 1 giờ thuê"),
                              );
                            }

                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <DatePicker.RangePicker
                        showTime={{
                          format: "HH:mm",
                          minuteStep: 30,
                        }}
                        format="YYYY-MM-DD HH:mm"
                        placeholder={["Từ giờ", "Đến giờ"]}
                      />
                    </Form.Item>

                    <Form.Item
                      {...rest}
                      name={[name, "courtCopyId"]}
                      label=" Chuyển sân (nếu cần đổi)"
                    >
                      <Select
                        placeholder="Chọn sân"
                        options={courtCopyOptions}
                        allowClear
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button
                          size="small"
                          type="dashed"
                          loading={checking}
                          onClick={() => handleAutoFind(name)}
                        >
                          Tìm sân trống tự động
                        </Button>
                      </Space>
                    </Form.Item>

                    <Form.Item name={[name, "slotId"]} hidden>
                      <Input />
                    </Form.Item>

                    <Form.Item name={[name, "originalCourtCopyId"]} hidden>
                      <Input />
                    </Form.Item>
                  </div>
                );
              })}
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}

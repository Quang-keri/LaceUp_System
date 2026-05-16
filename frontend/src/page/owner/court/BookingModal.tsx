import React from "react";
import { Modal, Input, InputNumber, Select, Button, Popconfirm } from "antd";

interface BookingModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  formState: any;
  setFormState: (state: any) => void;
  selectedSlots: any[];
  onRemoveSlot?: (index: number) => void;
}

export const BookingModal = ({
  open,
  onCancel,
  onOk,
  formState,
  setFormState,
  selectedSlots,
  onRemoveSlot,
}: BookingModalProps) => {
  return (
    <Modal
      title="Tạo lịch đặt"
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="Tạo lịch & Xuất phiếu"
      cancelText="Hủy"
      width={600}
    >
      <div className="space-y-3">
        <Input
          placeholder="Tên khách hàng"
          value={formState.customerName}
          onChange={(e) =>
            setFormState({ ...formState, customerName: e.target.value })
          }
        />
        <Input
          placeholder="Số điện thoại"
          value={formState.phone}
          onChange={(e) =>
            setFormState({ ...formState, phone: e.target.value })
          }
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">
              Hình thức thanh toán
            </label>
            <Select
              value={formState.paymentType || "UNPAID"}
              onChange={(v) => {
                // v: 'UNPAID' | 'PARTIAL' | 'FULL'
                if (v === "FULL") {
                  setFormState({
                    ...formState,
                    paymentType: v,
                    paidAmount: formState.totalPrice || 0,
                  });
                } else if (v === "UNPAID") {
                  setFormState({ ...formState, paymentType: v, paidAmount: 0 });
                } else {
                  setFormState({ ...formState, paymentType: v });
                }
              }}
              options={[
                { label: "Chưa thanh toán", value: "UNPAID" },
                { label: "Thanh toán một phần", value: "PARTIAL" },
                { label: "Thanh toán đầy đủ", value: "FULL" },
              ]}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">
              Phương thức thanh toán
            </label>
            <Select
              value={formState.paymentMethod || "BANK_TRANSFER"}
              onChange={(v) => setFormState({ ...formState, paymentMethod: v })}
              options={[
                { label: "Chuyển khoản ngân hàng", value: "BANK_TRANSFER" },
                { label: "Tiền mặt", value: "CASH" },
                { label: "Thẻ tín dụng", value: "CARD" },
                { label: "Ví điện tử", value: "E_WALLET" },
              ]}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Tổng tiền cần trả</label>
            <InputNumber
              className="w-full"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              value={formState.totalPrice}
              onChange={(v) =>
                setFormState({ ...formState, totalPrice: v || 0 })
              }
              addonAfter="VND"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">Khách đã thanh toán</label>
            <InputNumber
              className="w-full"
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              value={formState.paidAmount}
              onChange={(v) =>
                setFormState({
                  ...formState,
                  paidAmount: v || 0,
                  paymentType:
                    (v || 0) === 0
                      ? "UNPAID"
                      : v === formState.totalPrice
                      ? "FULL"
                      : "PARTIAL",
                })
              }
              addonAfter="VND"
            />
          </div>
        </div>
        <Input.TextArea
          placeholder="Ghi chú"
          value={formState.note}
          onChange={(e) => setFormState({ ...formState, note: e.target.value })}
        />
      </div>

      <h4 className="mt-4 font-semibold">Khung giờ đã chọn:</h4>
      <div className="bg-gray-50 p-3 rounded-md mt-2 max-h-40 overflow-y-auto text-sm">
        {selectedSlots.map((s, i) => (
          <div
            key={i}
            className="mb-1 border-b pb-1 last:border-0 flex items-start justify-between"
          >
            <div>
              <b className="text-blue-600">{s.courtCode}</b>: {s.startDisplay} →{" "}
              {s.endDisplay}
            </div>
            <div>
              {onRemoveSlot && (
                <Popconfirm
                  title="Xóa khung giờ này?"
                  onConfirm={() => onRemoveSlot(i)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button size="small" danger>
                    Xóa
                  </Button>
                </Popconfirm>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

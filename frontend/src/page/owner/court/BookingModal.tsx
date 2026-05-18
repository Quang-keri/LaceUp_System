import React from "react";
import { Modal, Input, InputNumber, Select, Button, Popconfirm } from "antd";

interface BookingModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
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
  const formatMoney = (value?: string | number) =>
    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
      <div className="space-y-3 ">
        <div>
          <Input
            placeholder="Tên khách hàng"
            value={formState.customerName}
            onChange={(e) =>
              setFormState((prev: any) => ({
                ...prev,
                customerName: e.target.value,
              }))
            }
          />
        </div>
        <div>
          <Input
            placeholder="Số điện thoại"
            value={formState.phone}
            onChange={(e) =>
              setFormState((prev: any) => ({
                ...prev,
                phone: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500">
              Hình thức thanh toán
            </label>
            <Select
              className="w-full"
              value={formState.paymentType || "UNPAID"}
              onChange={(v) => {
                setFormState((prev: any) => {
                  if (v === "FULL") {
                    return {
                      ...prev,
                      paymentType: v,
                      paidAmount: prev.totalPrice || 0,
                    };
                  }

                  if (v === "UNPAID") {
                    return {
                      ...prev,
                      paymentType: v,
                      paidAmount: 0,
                    };
                  }

                  return {
                    ...prev,
                    paymentType: v,
                  };
                });
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
              className="w-full"
              value={formState.paymentMethod || "BANK_TRANSFER"}
              onChange={(v) =>
                setFormState((prev: any) => ({
                  ...prev,
                  paymentMethod: v,
                }))
              }
              disabled={formState.paymentType === "UNPAID"}
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
              formatter={(v) => formatMoney(v)}
              value={formState.totalPrice}
              disabled
              addonAfter="VND"
            />
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-500">Khách đã thanh toán</label>
            <InputNumber
              className="w-full"
              min={0}
              max={formState.totalPrice || 0}
              formatter={(v) => formatMoney(v)}
              value={formState.paidAmount}
              disabled={formState.paymentType === "UNPAID"}
              onChange={(v) =>
                setFormState((prev: any) => {
                  const paidAmount = Number(v || 0);

                  return {
                    ...prev,
                    paidAmount,
                    paymentType:
                      paidAmount === 0
                        ? "UNPAID"
                        : paidAmount >= Number(prev.totalPrice || 0)
                        ? "FULL"
                        : "PARTIAL",
                  };
                })
              }
              addonAfter="VND"
            />
          </div>
        </div>

        <Input.TextArea
          placeholder="Ghi chú"
          value={formState.note}
          onChange={(e) =>
            setFormState((prev: any) => ({
              ...prev,
              note: e.target.value,
            }))
          }
        />
      </div>

      <h4 className="mt-4 font-semibold">Khung giờ đã chọn:</h4>

      <div className="bg-gray-50 p-3 rounded-md mt-2 max-h-40 overflow-y-auto text-sm">
        {selectedSlots.map((s, i) => (
          <div
            key={s.id || i}
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

// import React, { useState, useMemo, useEffect } from "react";
// import {
//   Modal,
//   InputNumber,
//   Radio,
//   Button,
//   Typography,
//   Space,
//   Alert,
//   Select,
//   message,
//   DatePicker,
//   List,
// } from "antd";
// import dayjs from "dayjs";
// import {
//   ClockCircleOutlined,
//   SwapOutlined,
//   SearchOutlined,
//   CheckCircleOutlined,
//   ArrowLeftOutlined,
//   EditOutlined,
// } from "@ant-design/icons";
// import { bookingSlotService } from "../../../service/bookingSlotService";

// const { Text } = Typography;

// export default function BookingEditModal({
//   open,
//   booking,
//   onClose,
//   onRefresh,
// }: any) {
//   const [activeSlot, setActiveSlot] = useState<any>(null);

//   useEffect(() => {
//     if (open) {
//       setActiveSlot(null);
//     }
//   }, [open, booking]);

//   const handleClose = () => {
//     setActiveSlot(null);
//     onClose();
//   };

//   const handleSuccess = () => {
//     setActiveSlot(null);
//     onRefresh();
//   };

//   const slots = booking?.slots || [];

//   return (
//     <Modal
//       open={open}
//       onCancel={handleClose}
//       footer={null}
//       width={520}
//       title={
//         <Space>
//           {activeSlot && (
//             <Button
//               type="text"
//               icon={<ArrowLeftOutlined />}
//               onClick={() => setActiveSlot(null)}
//             />
//           )}
//           <span style={{ fontWeight: 600 }}>
//             {activeSlot
//               ? `Chỉnh sửa slot — Sân ${activeSlot.courtName}`
//               : `Chọn Slot cần xử lý (Đơn ${booking?.bookingId?.substring(0, 8) || ""})`}
//           </span>
//         </Space>
//       }
//     >
//       {!activeSlot ? (
//         <List
//           dataSource={slots}
//           locale={{ emptyText: "Đơn này không có slot nào" }}
//           renderItem={(s: any) => (
//             <List.Item
//               style={{ padding: "12px 0" }}
//               actions={[
//                 <Button
//                   size="small"
//                   type="primary"
//                   ghost
//                   icon={<EditOutlined />}
//                   onClick={() => setActiveSlot(s)}
//                 >
//                   Thao tác
//                 </Button>,
//               ]}
//             >
//               <List.Item.Meta
//                 title={`Sân: ${s.courtName || "Chưa rõ"}`}
//                 description={`${dayjs(s.startTime).format("DD/MM/YYYY HH:mm")} → ${dayjs(s.endTime).format("HH:mm")}`}
//               />
//             </List.Item>
//           )}
//         />
//       ) : (
//         <SlotEditForm
//           slot={activeSlot}
//           bookingId={booking?.bookingId}
//           onSuccess={handleSuccess}
//         />
//       )}
//     </Modal>
//   );
// }

// function SlotEditForm({ slot, bookingId, onSuccess }: any) {
//   const [mode, setMode] = useState("extend");

//   const [amount, setAmount] = useState(30);
//   const [unit, setUnit] = useState("minute");
//   const [checkExtend, setCheckExtend] = useState<any>(null);
//   const [loadingExtend, setLoadingExtend] = useState(false);

//   const [targetCourt, setTargetCourt] = useState<any>(null);
//   const [targetTime, setTargetTime] = useState<any>(null);
//   const [checkSwap, setCheckSwap] = useState<any>(null);
//   const [loadingSwap, setLoadingSwap] = useState(false);

//   const start = dayjs(slot?.startTime);
//   const end = dayjs(slot?.endTime);
//   const duration = end.diff(start, "minute");

//   const newEnd = useMemo(
//     () => end.add(amount, unit as any),
//     [amount, unit, end],
//   );
//   const addedMinutes = unit === "hour" ? amount * 60 : amount;

//   // ===== ACTION EXTEND =====
//   const handleCheckExtend = async () => {
//     try {
//       setLoadingExtend(true);
//       const res = await bookingSlotService.checkExtend(bookingId, slot.slotId, {
//         amount,
//         unit,
//       });
//       setCheckExtend(res);
//     } catch {
//       message.error("Lỗi kiểm tra gia hạn");
//     } finally {
//       setLoadingExtend(false);
//     }
//   };

//   const handleConfirmExtend = async () => {
//     try {
//       await bookingSlotService.confirmExtend(bookingId, slot.slotId, {
//         amount,
//         unit,
//       });
//       message.success("Gia hạn thành công");
//       onSuccess();
//     } catch {
//       message.error("Lỗi xác nhận gia hạn");
//     }
//   };

//   // ===== ACTION SWAP =====
//   const handleCheckSwap = async () => {
//     if (!targetCourt || !targetTime) {
//       return message.warning("Chọn sân và thời gian");
//     }

//     try {
//       setLoadingSwap(true);
//       const res = await bookingSlotService.checkSwap(bookingId, slot.slotId, {
//         courtId: targetCourt,
//         startTime: targetTime,
//         duration,
//       });
//       setCheckSwap(res);
//     } catch {
//       message.error("Lỗi kiểm tra swap");
//     } finally {
//       setLoadingSwap(false);
//     }
//   };

//   const handleConfirmSwap = async () => {
//     try {
//       await bookingSlotService.confirmSwap(bookingId, slot.slotId, {
//         courtId: targetCourt,
//         startTime: targetTime,
//         duration,
//       });
//       message.success("Đổi slot thành công");
//       onSuccess();
//     } catch {
//       message.error("Lỗi xác nhận swap");
//     }
//   };

//   return (
//     <div>
//       {/* CURRENT SLOT INFO */}
//       <div
//         style={{
//           background: "#f0f5ff",
//           border: "1px solid #d6e4ff",
//           padding: 16,
//           borderRadius: 8,
//           marginBottom: 20,
//         }}
//       >
//         <Text type="secondary" style={{ fontSize: 12 }}>
//           THỜI GIAN HIỆN TẠI
//         </Text>
//         <div style={{ fontSize: 16, fontWeight: 500 }}>
//           {start.format("DD/MM/YYYY HH:mm")} → {end.format("HH:mm")}
//           <Text type="secondary" style={{ marginLeft: 8 }}>
//             ({duration / 60} giờ)
//           </Text>
//         </div>
//       </div>

//       {/* MODE SWITCH */}
//       <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
//         <div
//           onClick={() => setMode("extend")}
//           style={{
//             flex: 1,
//             padding: 12,
//             border:
//               mode === "extend" ? "1px solid #1890ff" : "1px solid #d9d9d9",
//             borderRadius: 8,
//             cursor: "pointer",
//             textAlign: "center",
//             background: mode === "extend" ? "#e6f7ff" : "#fff",
//           }}
//         >
//           <ClockCircleOutlined
//             style={{ color: mode === "extend" ? "#1890ff" : "inherit" }}
//           />
//           <div style={{ fontWeight: 500, marginTop: 4 }}>Gia hạn thêm</div>
//           <div style={{ fontSize: 12, color: "#8c8c8c" }}>
//             Kéo dài thời gian
//           </div>
//         </div>

//         <div
//           onClick={() => setMode("swap")}
//           style={{
//             flex: 1,
//             padding: 12,
//             border: mode === "swap" ? "1px solid #1890ff" : "1px solid #d9d9d9",
//             borderRadius: 8,
//             cursor: "pointer",
//             textAlign: "center",
//             background: mode === "swap" ? "#e6f7ff" : "#fff",
//           }}
//         >
//           <SwapOutlined
//             style={{ color: mode === "swap" ? "#1890ff" : "inherit" }}
//           />
//           <div style={{ fontWeight: 500, marginTop: 4 }}>Chuyển slot</div>
//           <div style={{ fontSize: 12, color: "#8c8c8c" }}>
//             Đổi sang giờ/sân khác
//           </div>
//         </div>
//       </div>

//       {/* EXTEND UI */}
//       {mode === "extend" && (
//         <>
//           <Text strong>Gia hạn thêm bao lâu?</Text>
//           <Space style={{ marginTop: 8, display: "flex" }}>
//             <InputNumber
//               min={1}
//               value={amount}
//               onChange={(v) => setAmount(v || 1)}
//             />
//             <Radio.Group
//               value={unit}
//               onChange={(e) => setUnit(e.target.value)}
//               buttonStyle="solid"
//             >
//               <Radio.Button value="hour">Giờ</Radio.Button>
//               <Radio.Button value="minute">Phút</Radio.Button>
//             </Radio.Group>
//           </Space>

//           <div
//             style={{
//               background: "#f6ffed",
//               border: "1px solid #b7eb8f",
//               padding: 16,
//               borderRadius: 8,
//               marginTop: 20,
//             }}
//           >
//             <Text type="secondary" style={{ fontSize: 12, color: "#389e0d" }}>
//               THỜI GIAN DỰ KIẾN SAU GIA HẠN
//             </Text>
//             <div style={{ fontSize: 16, fontWeight: 500 }}>
//               {start.format("HH:mm")} →
//               <span style={{ color: "#52c41a", marginLeft: 4 }}>
//                 {newEnd.format("HH:mm")}
//               </span>
//               <Text style={{ marginLeft: 8, color: "#52c41a" }}>
//                 (+{addedMinutes} phút)
//               </Text>
//             </div>
//           </div>

//           {checkExtend?.available && (
//             <Alert
//               type="success"
//               message={`Phí phát sinh thêm: ${checkExtend.extraPrice?.toLocaleString()}đ`}
//               style={{ marginTop: 16 }}
//             />
//           )}

//           <Space style={{ marginTop: 16 }}>
//             <Button
//               icon={<SearchOutlined />}
//               onClick={handleCheckExtend}
//               loading={loadingExtend}
//             >
//               Kiểm tra xung đột
//             </Button>

//             {checkExtend?.available && (
//               <Button
//                 type="primary"
//                 icon={<CheckCircleOutlined />}
//                 onClick={handleConfirmExtend}
//               >
//                 Xác nhận gia hạn
//               </Button>
//             )}
//           </Space>
//         </>
//       )}

//       {/* SWAP UI */}
//       {mode === "swap" && (
//         <>
//           <Space direction="vertical" style={{ width: "100%" }}>
//             <Select
//               placeholder="Chọn sân muốn đổi sang"
//               style={{ width: "100%" }}
//               onChange={setTargetCourt}
//               options={[]} /* TRUYỀN DANH SÁCH SÂN VÀO ĐÂY NHÉ */
//             />
//             <DatePicker
//               showTime
//               placeholder="Chọn thời gian bắt đầu mới"
//               style={{ width: "100%" }}
//               onChange={(v) => setTargetTime(v?.toISOString())}
//             />
//           </Space>

//           {checkSwap?.available && (
//             <Alert
//               type="success"
//               message={`Giữ nguyên giá: ${slot.price?.toLocaleString()}đ`}
//               style={{ marginTop: 16 }}
//             />
//           )}

//           <Space style={{ marginTop: 16 }}>
//             <Button
//               icon={<SearchOutlined />}
//               onClick={handleCheckSwap}
//               loading={loadingSwap}
//             >
//               Kiểm tra slot trống
//             </Button>

//             {checkSwap?.available && (
//               <Button
//                 type="primary"
//                 icon={<CheckCircleOutlined />}
//                 onClick={handleConfirmSwap}
//               >
//                 Xác nhận đổi
//               </Button>
//             )}
//           </Space>
//         </>
//       )}
//     </div>
//   );
// }

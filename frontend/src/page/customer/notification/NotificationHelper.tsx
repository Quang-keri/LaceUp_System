import type { NotificationResponse } from "../../../types/notification";

const NotificationHelper = async (data: NotificationResponse) => {
  // 1. Kiểm tra quyền, nếu là 'default' thì hỏi xin người dùng
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Người dùng từ chối cấp quyền thông báo.");
      return;
    }
  }

  // 2. Nếu người dùng đã chặn (denied), thì không làm gì được nữa
  if (Notification.permission === "denied") {
    console.error(
      "❌ Quyền thông báo bị chặn (denied). Hãy mở cài đặt trình duyệt để bật lại.",
    );
    return;
  }

  // --- Đoạn code hiển thị thông báo phía dưới giữ nguyên ---
  const senderId = data.link ? data.link.split("/").pop() : "default";
  const options: NotificationOptions = {
    body: data.notificationBody,
    icon: "/logo.png",
    tag:
      data.type === "CHAT"
        ? `chat-${senderId}`
        : `other-${data.notificationId}`,
    badge: "/logo.png",
  };

  new Notification(data.notificationTitle, options);
};

export default NotificationHelper;

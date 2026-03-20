import { toast } from "react-toastify";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

class WebSocketService {
  private stompClient: any = null;
  private socket: any = null;

  private newMessageListeners: ((data: any) => void)[] = [];
  private readReceiptListeners: ((data: {
    conversationId: string;
    readerId: string;
  }) => void)[] = [];
  private notificationListeners: ((data: any) => void)[] = [];

  connect(url: string, token: string | null = null): void {
    if (this.isConnected()) return;

    this.socket = new SockJS(url);
    this.stompClient = Stomp.over(this.socket);

    const headers = { Authorization: `Bearer ${token}` };

    this.stompClient.connect(headers, (frame: any) => {
      console.log(
        "✅ Kết nối thành công! User Principal:",
        frame.headers["user-name"],
      );

      this.stompClient.subscribe("/user/queue/messages", (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          this.newMessageListeners.forEach((callback) => callback(data));
        }
      });

      this.stompClient.subscribe("/user/queue/read-receipt", (message: any) => {
        if (message.body) {
          const data = JSON.parse(message.body);
          this.readReceiptListeners.forEach((callback) => callback(data));
        }
      });

      this.stompClient.subscribe(
        "/user/queue/notifications",
        (message: any) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            const currentPath = window.location.pathname;

            const isChat = data.type === "CHAT";
            const isAtChatOrNotiPage =
              currentPath.includes("/chat") ||
              currentPath.includes("/notifications");

            if (isChat && !isAtChatOrNotiPage) {
              const senderKey = data.link
                ? data.link.split("/").pop()
                : "default_sender";

              if (!toast.isActive(senderKey)) {
                toast.info(
                  `💬 ${data.notificationTitle}: ${data.notificationBody}`,
                  {
                    toastId: senderKey,
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    onClick: () => {
                      if (data.link) window.location.href = data.link;
                    },
                  },
                );
              } else {
                toast.update(senderKey, {
                  render: `💬 ${data.notificationTitle}: ${data.notificationBody}`,
                  autoClose: 3000,
                });
              }
            }

            this.notificationListeners.forEach((callback) => callback(data));
          }
        },
      );
    });
  }

  send(destination: string, payload: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(payload));
    }
  }

  onNewMessage(callback: (data: any) => void) {
    this.newMessageListeners.push(callback);
    return () => {
      this.newMessageListeners = this.newMessageListeners.filter(
        (l) => l !== callback,
      );
    };
  }

  onReadReceipt(
    callback: (data: { conversationId: string; readerId: string }) => void,
  ) {
    this.readReceiptListeners.push(callback);
    return () => {
      this.readReceiptListeners = this.readReceiptListeners.filter(
        (l) => l !== callback,
      );
    };
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect(() => {
        console.log("Disconnected");
      });
      this.stompClient = null;
    }
  }

  isConnected(): boolean {
    return this.stompClient && this.stompClient.connected;
  }

  onNotification(callback: (data: any) => void) {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        (l) => l !== callback,
      );
    };
  }
}

const websocketService = new WebSocketService();
export default websocketService;

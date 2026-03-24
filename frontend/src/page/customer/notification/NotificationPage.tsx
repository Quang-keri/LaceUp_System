import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { NotificationResponse } from "../../../types/notification";
import notificationService from "../../../service/notificationService";
import websocketService from "../../../service/websocketService";
import notificationHelper from "./NotificationHelper";

const NotificationPage = () => {
  const [allNotis, setAllNotis] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const fetchNotifications = async (
    page: number,
    isLoadMore: boolean = false,
  ) => {
    try {
      setLoading(true);
      const response = await notificationService.getMyNotifications(
        page,
        pageSize,
      );

      if (response.code === 200) {
        const { content, last } = response.result;

        if (isLoadMore) {
          setAllNotis((prev) => [...prev, ...content]);
        } else {
          setAllNotis(content || []);
        }

        setHasMore(!last);
      }
    } catch (error) {
      console.error("Lỗi khi load thông báo:", error);
      setAllNotis([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0);

    const unsubscribe = websocketService.onNotification(
      (data: NotificationResponse) => {
        setAllNotis((prev) => {
          return [data, ...prev];
        });

        window.location.pathname.includes("/chat");
        notificationHelper(data);
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handleMarkAsRead = async (noti: NotificationResponse) => {
    if (!noti.isRead) {
      try {
        await notificationService.markAsRead(noti.notificationId);
        setAllNotis((prev) =>
          prev.map((n) =>
            n.notificationId === noti.notificationId
              ? { ...n, isRead: true }
              : n,
          ),
        );
      } catch (error) {
        console.error("Lỗi khi đánh dấu đã đọc:", error);
      }
    }

    if (noti.link) {
      window.location.href = noti.link;
    }
  };

  const getDisplayedNotifications = (notifications: NotificationResponse[]) => {
    const seenSenders = new Set<string>();

    return notifications.filter((noti) => {
      if (noti.type === "CHAT") {
        const senderId = noti.link ? noti.link.split("/").pop() : "default";

        if (senderId && seenSenders.has(senderId)) {
          return false;
        } else {
          if (senderId) seenSenders.add(senderId);
          return true;
        }
      }
      return true;
    });
  };

  // Áp dụng hàm lọc
  const displayedNotis = getDisplayedNotifications(allNotis);

  return (
    <div className="max-w-4xl mx-auto p-6 pt-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trung tâm thông báo</h1>
        {/* Đã sửa allNotis thành displayedNotis */}
        {displayedNotis?.length > 0 &&
          displayedNotis.some((n) => !n.isRead) && (
            <button
              onClick={async () => {
                await notificationService.markAllAsRead();
                setCurrentPage(0);
                fetchNotifications(0); // Reset về trang đầu sau khi mark all
              }}
              className="text-sm text-blue-500 hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Filters */}
        <div className="flex gap-4 p-4 border-b bg-gray-50/50">
          <button className="px-4 py-1.5 rounded-full bg-[#4da6ff] text-white text-sm font-medium">
            {/* Đã sửa allNotis thành displayedNotis */}
            Tất cả ({displayedNotis.length})
          </button>
          <button className="px-4 py-1.5 rounded-full bg-white border text-sm hover:bg-gray-100 transition-colors">
            {/* Đã sửa allNotis thành displayedNotis */}
            Chưa đọc ({displayedNotis.filter((n) => !n.isRead).length})
          </button>
        </div>

        {/* Danh sách thông báo */}
        <div className="divide-y divide-gray-100">
          {/* Đã sửa allNotis thành displayedNotis */}
          {displayedNotis.length === 0 && !loading ? (
            <div className="p-20 text-center text-gray-400">
              <FaBell className="mx-auto text-4xl mb-4 opacity-20" />
              <p>Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <>
              {/* Đã sửa allNotis thành displayedNotis */}
              {displayedNotis.map((noti, index) => (
                <div
                  key={`${noti.notificationId}-${index}`}
                  onClick={() => handleMarkAsRead(noti)}
                  className={`p-4 flex gap-4 hover:bg-blue-50/50 transition-all cursor-pointer items-start ${
                    !noti.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${
                      noti.type === "CHAT"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    <FaBell />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3
                        className={`text-gray-900 ${
                          !noti.isRead ? "font-bold" : "font-medium"
                        }`}
                      >
                        {noti.notificationTitle}
                      </h3>
                      <span className="text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(noti.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {noti.notificationBody}
                    </p>
                  </div>

                  {!noti.isRead && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  )}
                </div>
              ))}

              {/* Nút Load More */}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="text-sm font-medium text-gray-500 hover:text-[#4da6ff] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Đang tải..." : "Xem thêm thông báo cũ"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Đã sửa allNotis thành displayedNotis */}
          {loading && displayedNotis.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              Đang tải thông báo...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;

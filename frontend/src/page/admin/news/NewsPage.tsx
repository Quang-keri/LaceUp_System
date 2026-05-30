import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import NewsCard from "./NewsCard";
import NewsFilter from "./NewsFilter";
import newsService from "../../../service/newsService";

import CreateNewsModal from "./CreateNewsModal";
import UpdateNewsModal from "./UpdateNewsModal";

import type { NewsItem } from "../../../types/news";


export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0 });

  const [viewingNews, setViewingNews] = useState<NewsItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const fetchNews = async () => {
    try {
      const res = await newsService.getAll(
        pagination.page,
        pagination.size,
        keyword,
      );
      setNews(res.data || []);
      setPagination((p) => ({ ...p, total: res.totalElements || 0 }));
    } catch (error) {
      console.error("Fetch news error", error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [pagination.page, keyword]);

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tin tức này?")) {
      try {
        await newsService.delete(id);
        fetchNews();
      } catch (error) {
        alert("Xóa thất bại!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tin tức</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hệ thống thông tin và tin tức thể thao
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors font-medium text-sm"
        >
          <Plus size={18} />
          Tạo tin tức
        </button>
      </div>

      <NewsFilter onSearch={(kw) => setKeyword(kw)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {news.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 text-base">
            Chưa có tin tức nào.
          </div>
        ) : (
          news.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              onView={() => setViewingNews(item)}
              onEdit={async () => {
                try {
                  const detail = await newsService.getById(item.id);
                  setSelectedNews(detail);
                  setIsUpdateOpen(true);
                } catch (err) {
                  console.error("Load news detail failed", err);
                  alert("Không thể tải dữ liệu chi tiết");
                }
              }}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </div>

      <CreateNewsModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchNews}
      />

      <UpdateNewsModal
        isOpen={isUpdateOpen}
        initialData={selectedNews}
        onClose={() => setIsUpdateOpen(false)}
        onSuccess={fetchNews}
      />

      {viewingNews && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Chi tiết tin tức
              </h2>
              <button
                onClick={() => setViewingNews(null)}
                className="text-gray-500 hover:text-gray-800 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h1 className="text-2xl font-bold mb-4">{viewingNews.title}</h1>
              <p className="text-sm text-gray-500 mb-6">
                Đăng ngày:{" "}
                {new Date(viewingNews.createdAt).toLocaleDateString("vi-VN")}
              </p>

              {viewingNews.images && viewingNews.images.length > 0 && (
                <div className="mb-6 flex gap-2 overflow-x-auto">
                  {viewingNews.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.imageUrl}
                      alt="news"
                      className="h-48 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              )}

              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {viewingNews.content}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingNews(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

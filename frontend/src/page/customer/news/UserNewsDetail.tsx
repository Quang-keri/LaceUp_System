import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  ExternalLink,
} from "lucide-react";
import newsService from "../../../service/newsService";
import type { NewsItem } from "../../../types/news";

export default function UserNewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async (newsId: string) => {
      try {
        const res = await newsService.getById(newsId);
        setNewsItem(res);
      } catch (error) {
        console.error("Lỗi tải tin tức", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchDetail(id);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Không tìm thấy bài viết!
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" /> Quay lại
        </button>
      </div>
    );
  }

  const coverImage =
    newsItem.images?.find((img) => img.isCover)?.imageUrl ||
    newsItem.images?.[0]?.imageUrl ||
    null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={18} className="mr-2" /> Quay lại danh sách
          </button>
        </div>

        <div className="px-8 pt-8 pb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
            {newsItem.title}
          </h1>

          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <span>
                {new Date(newsItem.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            {newsItem.createdBy && (
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-blue-500" />
                <span>Đăng bởi: {newsItem.createdBy}</span>
              </div>
            )}
            {newsItem.sourceUrl && (
              <a
                href={newsItem.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink size={16} />
                <span>Nguồn bài viết</span>
              </a>
            )}
          </div>
        </div>

        {coverImage && (
          <div className="px-8 mb-8">
            <img
              src={coverImage}
              alt={newsItem.title}
              className="w-full h-[400px] object-cover rounded-2xl"
            />
          </div>
        )}

        <div className="px-8 pb-10">
          <div className="prose max-w-none text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
            {newsItem.content}
          </div>
        </div>

        {newsItem.images && newsItem.images.length > 1 && (
          <div className="px-8 pb-10 bg-gray-50 pt-8 mt-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Hình ảnh liên quan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {newsItem.images
                .filter((img) => img.imageUrl !== coverImage)
                .map((img, idx) => (
                  <a
                    href={img.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    key={idx}
                  >
                    <img
                      src={img.imageUrl}
                      alt={`related-${idx}`}
                      className="w-full h-32 md:h-48 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Pencil, Trash2, Eye, Globe, Users, Lock } from "lucide-react";
import type { NewsItem } from "../../../types/news";

interface NewsCardProps {
  item: NewsItem;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function NewsCard({
  item,
  onView,
  onEdit,
  onDelete,
}: NewsCardProps) {
  const coverImage =
    item.imageUrl ||
    item.images?.find((img) => img.isCover)?.imageUrl ||
    item.images?.[0]?.imageUrl ||
    "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

  const getVisibilityConfig = (visibility?: string) => {
    switch (visibility) {
      case "PRIVATE":
        return {
          icon: <Lock size={12} />,
          text: "Riêng tư",
          style: "bg-red-50 text-red-600",
        };
      case "MEMBER":
        return {
          icon: <Users size={12} />,
          text: "Thành viên",
          style: "bg-orange-50 text-orange-600",
        };
      case "PUBLIC":
      default:
        return {
          icon: <Globe size={12} />,
          text: "Công khai",
          style: "bg-green-50 text-green-600",
        };
    }
  };

  const visConfig = getVisibilityConfig(item.visibility || "");

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={coverImage}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-[15px] line-clamp-2 mb-2 leading-snug h-[45px]">
          {item.title}
        </h3>

        <div className="mb-4">
          <span className="text-blue-600 font-medium text-sm">
            {new Date(item.createdAt || Date.now()).toLocaleDateString("vi-VN")}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium ${visConfig.style}`}
            >
              {visConfig.icon}
              {visConfig.text}
            </span>
            <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
              {item.images?.length || 0} ảnh
            </span>
          </div>
        </div>

        <button
          onClick={onView}
          className="w-full py-2 mb-4 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <Eye size={16} className="text-gray-500" />
          Xem chi tiết
        </button>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5 text-sm font-medium transition-colors"
          >
            <Pencil size={14} />
            Sửa
          </button>

          <button
            onClick={onDelete}
            title="Xóa tin tức"
            className="p-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

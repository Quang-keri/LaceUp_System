import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

export default function UserNewsCard({ item }) {
  const coverImage =
    item.imageUrl ||
    item.images?.find((img) => img.isCover)?.imageUrl ||
    item.images?.[0]?.imageUrl ||
    "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

  return (
    <Link
      to={`/tin-tuc/${item.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Hình ảnh có hiệu ứng zoom nhẹ khi hover */}
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <img
          src={coverImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Nội dung */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Calendar size={14} className="text-blue-500" />
          <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
        </div>

        <h3 className="font-bold text-gray-800 text-lg line-clamp-2 mb-3 leading-snug group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>

        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
          {item.content}
        </p>

        {/* Nút Xem chi tiết giả (Chỉ để trang trí vì cả card đã là Link) */}
        <div className="mt-auto flex items-center text-blue-600 font-semibold text-sm">
          Đọc tiếp
          <ArrowRight
            size={16}
            className="ml-1 group-hover:translate-x-1 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
}

import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="h-screen  flex items-center justify-center flex-col gap-6 bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <FileQuestion className="w-24 h-24 text-orange-500" />
        <h1 className="text-5xl font-bold text-gray-800">
          <strong>404</strong>
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          Trang bạn đang tìm không tồn tại hoặc đã xóa.
        </p>
      </div>
      <Link
        className="font-medium text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors shadow-md"
        to={"/"}
      >
        Vè trang chủ
      </Link>
    </div>
  );
}

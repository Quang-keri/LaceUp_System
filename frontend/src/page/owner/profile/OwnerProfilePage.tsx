import { useEffect, useState } from "react";
import userService from "../../../service/userService";

export default function OwnerProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await userService.getMyInfo();
      setUser(res.result);
    } catch (err) {
      console.error("Fetch user error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-white-50 flex justify-center items-start py-10">
      <div className="bg-white shadow-md rounded-xl w-full max-w-xl p-6">
        <div className="flex items-center gap-4 border-b pb-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-500  flex items-center justify-center text-white text-xl font-bold">
            {user.userName?.charAt(0)}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user.userName}
            </h2>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Số điện thoại</span>
            <span className="font-medium">{user.phone}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Giới tính</span>
            <span className="font-medium">
              {user.gender === "MALE"
                ? "Nam"
                : user.gender === "FEMALE"
                  ? "Nữ"
                  : "Khác"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Ngày sinh</span>
            <span className="font-medium">
              {new Date(user.dateOfBirth).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Tuổi</span>
            <span className="font-medium">{user.age}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Trạng thái</span>
            <span
              className={`font-medium ${
                user.active ? "text-green-600" : "text-red-600"
              }`}
            >
              {user.active ? "Đang hoạt động" : ""}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Điểm xếp hạng</span>
            <span
              className={`font-medium ${
                user.active ? "text-green-600" : "text-red-600"
              }`}
            >
              {user.active ? "Đang hoạt động" : ""}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-xs text-gray-400 flex justify-between">
          <span>Ngày tạo: {new Date(user.createdAt).toLocaleDateString()}</span>
          <span>Cập nhật: {new Date(user.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

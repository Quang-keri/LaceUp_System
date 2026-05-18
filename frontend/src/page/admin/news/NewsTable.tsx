export interface NewsImage {
  imageUrl: string;
  isCover?: boolean;
}

export interface NewsItem {
  id: number | string;
  title: string;
  visibility?: string;
  createdAt: string;
  images?: NewsImage[];
}

interface NewsTableProps {
  data: NewsItem[];
  onEdit: (item: NewsItem) => void;
  onDelete: (id: number | string) => void;
}

export default function NewsTable({ data, onEdit, onDelete }: NewsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 px-4 border-b">Ảnh Cover</th>
            <th className="py-2 px-4 border-b">Tiêu đề</th>
            <th className="py-2 px-4 border-b">Phạm vi</th>
            <th className="py-2 px-4 border-b">Ngày tạo</th>
            <th className="py-2 px-4 border-b">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-4">
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((item) => {
              const coverImage =
                item.images?.find((img) => img.isCover)?.imageUrl ||
                item.images?.[0]?.imageUrl;
              return (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="cover"
                        className="w-16 h-12 object-cover rounded"
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="py-2 px-4 font-medium">{item.title}</td>
                  <td className="py-2 px-4">
                    {item.visibility ? (
                      <span className="px-2 py-1 rounded text-sm bg-gray-100">
                        {item.visibility === "PUBLIC"
                          ? "Public"
                          : item.visibility === "MEMBER"
                          ? "Member"
                          : "Private"}
                      </span>
                    ) : (
                      "Public"
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-500 mr-3 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-500 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

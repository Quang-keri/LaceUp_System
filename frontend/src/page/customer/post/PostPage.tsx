import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import type { PostResponse } from "../../../types/post";
import { useNavigate } from "react-router-dom";
import CourtCard from "./CourtCard";
import { Row, Col } from "antd";
import FilterSidebar from "./FilterSidebar";
import SearchBar from "./SearchBar";

// Cấu trúc dữ liệu của bộ lọc (Export để dùng chung với FilterSidebar)
export interface FilterState {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  cityIds?: number[];
  categoryIds?: number[];
  amenityIds?: number[];
  page: number;
  size: number;
}

export default function PostPage() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Khởi tạo state bộ lọc mặc định
  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    size: 10,
  });

  // Hàm gọi API với bộ lọc hiện tại
  const fetchPosts = async (currentFilters: FilterState) => {
    try {
      setLoading(true);
      const response = await PostService.getPosts(currentFilters);
      console.log("data post", response.result);
      if (response.code === 200) {
        setPosts(response.result.data);
      }
    } catch (error) {
      console.error("Fetch post error", error);
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe sự thay đổi của bộ lọc để tự động gọi lại API
  useEffect(() => {
    fetchPosts(filters);
  }, [filters]);

  // Cập nhật state bộ lọc (Luôn reset về trang 1 khi lọc mới)
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  if (loading && posts.length === 0)
    return <p className="p-4 text-center">Đang tải dữ liệu...</p>;

  return (
    <>
      <SearchBar
        initialTitle={filters.title}
        onSearch={(searchValues) => handleFilterChange(searchValues)}
      />
      <div className="w-[90%] mx-auto overflow-x-hidden">
        <Row gutter={[20, 20]} className="p-4">
          <Col xs={0} md={8} lg={6}>
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </Col>

          <Col xs={24} md={16} lg={18}>
            {loading ? (
              <p>Đang cập nhật kết quả...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <CourtCard
                    key={post.postId}
                    post={post}
                    onClick={() =>
                      navigate(`/rental-area/${post.rentalAreaId}`)
                    }
                  />
                ))}
                {posts.length === 0 && (
                  <p className="text-gray-500 mt-4 col-span-full text-center">
                    Không tìm thấy sân nào phù hợp với bộ lọc.
                  </p>
                )}
              </div>
            )}
          </Col>
        </Row>
      </div>
    </>
  );
}

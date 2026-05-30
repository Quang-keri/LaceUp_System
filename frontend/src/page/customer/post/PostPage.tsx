import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import type { PostResponse, PageResponse } from "../../../types/post";
import { useNavigate } from "react-router-dom";
import CourtCard from "./CourtCard";
import { Row, Col, Spin, Pagination, Button, Space } from "antd";
import FilterSidebar from "./FilterSidebar";
import useUrlFilters from "../../../hooks/useUrlFilters";
import useDebounce from "../../../hooks/useDebounce";
import { History as HistoryIcon } from "lucide-react";

export interface FilterState {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  provinceCodes?: number[];
  categoryIds?: number[];
  amenityIds?: number[];
  date?: string;
  startDateTime?: string;
  endDateTime?: string;
  page: number;
  size: number;
  minRating?: number;
}

export default function PostPage() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const { filters, setFilters } = useUrlFilters({ page: 1, size: 10 });

  const [titleDraft] = useState(filters.title || "");
  const debouncedTitle = useDebounce(titleDraft, 500);

  const fetchPosts = async (currentFilters: FilterState) => {
    try {
      setLoading(true);
      const response = await PostService.getPosts(currentFilters);
      if (response.code === 200) {
        const page = response.result as PageResponse<PostResponse>;
        setPosts(page.data || []);
        setTotal(page.totalElements || 0);
        setPageSize(page.pageSize || currentFilters.size);
      }
    } catch (error) {
      console.error("Fetch post error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(filters);
  }, [filters]);

  useEffect(() => {
    if (debouncedTitle !== (filters.title || "")) {
      setFilters({ title: debouncedTitle });
    }
  }, [debouncedTitle]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number, size?: number) => {
    setFilters({ page, size: size || filters.size });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#9156F1]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#B0DF94]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 py-8">
        <div className="w-[90%] mx-auto md:px-4 lg:px-6 xl:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 lg:px-6 xl:px-8">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-slate-800 m-0">
                Khám phá{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9156F1] to-[#7b3fd6]">
                  Sân
                </span>
              </h1>
              <p className="text-slate-500 font-medium text-base mt-1 block">
                Tìm kiếm, so sánh và lựa chọn sân tập phù hợp nhất với bạn.
              </p>
            </div>

            <Space className="w-full md:w-auto mt-4 md:mt-0 justify-end">
              <Button
                size="large"
                icon={<HistoryIcon size={18} />}
                onClick={() => navigate("/booking-history")}
                style={{
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 24px",
                  color: "#f97316",
                  borderColor: "#f97316",
                }}
                className="font-bold shadow-sm hover:opacity-80"
              >
                Lịch Sử Đặt Sân
              </Button>
            </Space>
          </div>

          <Row gutter={[32, 32]}>
            <Col xs={0} md={8} lg={6}>
              <div className="sticky top-24 h-max w-full">
                <FilterSidebar
                  filters={filters}
                  onChange={handleFilterChange}
                />
              </div>
            </Col>

            <Col xs={24} md={16} lg={18}>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Spin size="large" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                  {posts.map((post) => (
                    <div
                      key={post.postId}
                      className="transform hover:translate-y-[-8px] transition-all duration-300 h-full cursor-pointer"
                      onClick={() =>
                        navigate(`/rental-area/${post.rentalAreaId}`)
                      }
                    >
                      <CourtCard post={post} />
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="col-span-full bg-white/50 backdrop-blur-md rounded-3xl p-20 text-center border border-dashed border-purple-200">
                      <p className="text-gray-400 text-lg font-medium">
                        Không tìm thấy sân nào phù hợp với bộ lọc.
                      </p>
                    </div>
                  )}
                  {posts.length > 0 && (
                    <div className="col-span-full flex justify-center mt-6">
                      <Pagination
                        current={filters.page}
                        pageSize={pageSize}
                        total={total}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

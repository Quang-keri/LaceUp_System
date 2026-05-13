import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import type { PostResponse, PageResponse } from "../../../types/post";
import { useNavigate } from "react-router-dom";
import CourtCard from "./CourtCard";
import { Row, Col, Spin, Pagination } from "antd";
import FilterSidebar from "./FilterSidebar";
import SearchBar from "./SearchBar";
import useUrlFilters from "../../../hooks/useUrlFilters";
import useDebounce from "../../../hooks/useDebounce";

export interface FilterState {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  cityIds?: number[];
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

  const [titleDraft, setTitleDraft] = useState(filters.title || "");
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

  // debounce titleDraft -> update URL filter `title`
  useEffect(() => {
    if (debouncedTitle !== (filters.title || "")) {
      setFilters({ title: debouncedTitle });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div className="relative z-10">
        <div className="py-8 bg-white/40 backdrop-blur-md border-b border-white/20">
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-4 px-5">
            <SearchBar
              initialTitle={filters.title}
              filters={filters}
              onFiltersChange={(f) => handleFilterChange(f)}
              onSearch={(searchValues) => {
                if (searchValues.title !== undefined)
                  setTitleDraft(searchValues.title || "");
                handleFilterChange(searchValues);
              }}
              onTitleChange={(t) => setTitleDraft(t)}
            />
          </div>
        </div>

        <div className="w-[90%] mx-auto mt-8">
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
                      className="transform hover:translate-y-[-8px] transition-all duration-300"
                    >
                      <CourtCard
                        post={post}
                        onClick={() =>
                          navigate(`/rental-area/${post.rentalAreaId}`)
                        }
                      />
                    </div>
                  ))}

                  {posts.length === 0 && (
                    <div className="col-span-full bg-white/50 backdrop-blur-md rounded-3xl p-20 text-center border border-dashed border-purple-200">
                      <p className="text-gray-400 text-lg font-medium">
                        Không tìm thấy sân nào phù hợp với bộ lọc.
                      </p>
                    </div>
                  )}
                  <div className="col-span-full flex justify-center mt-6">
                    <Pagination
                      current={filters.page}
                      pageSize={pageSize}
                      total={total}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

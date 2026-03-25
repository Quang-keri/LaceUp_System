import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import type { PostResponse } from "../../../types/post";
import { useNavigate } from "react-router-dom";
import CourtCard from "./CourtCard";
import { Row, Col, Spin } from "antd";
import FilterSidebar from "./FilterSidebar";
import SearchBar from "./SearchBar";

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
  const [filters, setFilters] = useState<FilterState>({ page: 1, size: 10 });

  const fetchPosts = async (currentFilters: FilterState) => {
    try {
      setLoading(true);
      const response = await PostService.getPosts(currentFilters);
      if (response.code === 200) {
        setPosts(response.result.data);
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

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] relative overflow-hidden">

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#9156F1]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#B0DF94]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">

        <div className="py-8 bg-white/40 backdrop-blur-md border-b border-white/20">
          <SearchBar
            initialTitle={filters.title}
            onSearch={(searchValues) => handleFilterChange(searchValues)}
          />
        </div>

        <div className="w-[90%] mx-auto mt-8">
          <Row gutter={[32, 32]}>
            {/* Sidebar Filter */}
            <Col xs={0} md={8} lg={6}>
              {/* THAY ĐỔI: Thêm div bọc ngoài với sticky và h-max */}
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
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

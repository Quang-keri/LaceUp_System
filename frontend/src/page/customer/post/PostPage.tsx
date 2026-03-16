import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import type { PostResponse } from "../../../types/post";
import { useNavigate } from "react-router-dom";
import CourtCard from "./CourtCard";
import { Row, Col } from "antd";
import FilterSidebar from "./FilterSidebar";
import SearchBar from "./SearchBar";
export default function PostPage() {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchPosts = async () => {
    try {
      const response = await PostService.getPosts(1, 10);
      console.log("data post" + response.result);
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
    fetchPosts();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <SearchBar />
      <div className="w-[90%] mx-auto overflow-x-hidden">
        <Row gutter={[20, 20]} className="p-4">
          <Col xs={0} md={8} lg={6}>
            <FilterSidebar />
          </Col>

          <Col xs={24} md={16} lg={18}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <CourtCard
                  key={post.postId}
                  post={post}
                  onClick={() => navigate(`/rental-area/${post.rentalAreaId}`)}
                />
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
}

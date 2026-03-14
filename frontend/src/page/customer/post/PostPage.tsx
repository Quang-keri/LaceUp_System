import { useEffect, useState } from "react";
import PostService from "../../../service/post/postService";
import type { PostResponse } from "../../../types/post";
import { useNavigate } from "react-router-dom";
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
    <div style={{ padding: "20px" }}>
      <h1>Posts</h1>

      {posts.map((post) => (
        <div
          key={post.postId}
          onClick={() => navigate(`/rental-area/${post.rentalAreaId}`)}
          style={{
            border: "1px solid #ddd",
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          <img
            src={post.courtCoverImageUrl}
            alt={post.title}
            style={{ width: "300px", borderRadius: "6px" }}
          />

          <h2>{post.title}</h2>

          <p>{post.description}</p>

          <p>
            <b>Sân:</b> {post.courtName}
          </p>

          <p>
            <b>Khu vực:</b> {post.rentalAreaName}
          </p>

          <p>
            <b>Địa chỉ:</b> {post.address}
          </p>

          <p>
            <b>Giá:</b> {post.price} VND
          </p>
        </div>
      ))}
    </div>
  );
}

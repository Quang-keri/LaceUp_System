import { StarFilled } from "@ant-design/icons";
import { Card, Button } from "antd";

export default function CourtCard({ post, onClick }: any) {
  const addressLabel = post?.address
    ? `${post.address.street}, ${post.address.ward}, ${post.address.city?.cityName}`
    : "";

  const hasRating = post.avgRating && post.avgRating > 0;

  return (
    <div className="relative">
      {hasRating && (
        <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-md flex items-center gap-1">
          <StarFilled style={{ color: "#facc15" }} />
          <span className="text-sm font-semibold text-gray-700">
            {Number(post.avgRating).toFixed(1)}
          </span>
        </div>
      )}

      <Card
        hoverable
        className="shadow-sm rounded-lg overflow-hidden"
        bodyStyle={{ padding: "12px" }}
        cover={
          <img
            src={post.courtCoverImageUrl}
            alt=""
            className="h-[180px] w-full object-cover"
          />
        }
      >
        <h2 className="text-base font-semibold line-clamp-1">{post.title}</h2>

        <p className="text-gray-500 text-sm line-clamp-1">{addressLabel}</p>

        <p className="text-gray-500 text-sm">{post.courtName}</p>

        <div className="flex justify-between items-center mt-3">
          <span className="text-purple-500 font-bold">{post.minPrice} VND</span>

          <Button
            size="small"
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            style={{
              background: "#9156F1",
            }}
          >
            Xem sân
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { Card, Button } from "antd";

export default function CourtCard({ post, onClick }: any) {
  return (
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

      <p className="text-gray-500 text-sm line-clamp-1">{post.address}</p>

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
        >
          Xem sân
        </Button>
      </div>
    </Card>
  );
}

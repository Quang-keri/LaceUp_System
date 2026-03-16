import { Card, Tag, Space } from "antd";

export default function CourtDetailPage({ court }: any) {
  const coverImage =
    court.images?.find((img) => img.isCover)?.imageUrl ||
    court.images?.[0]?.imageUrl;
  return (
    <Card>
      <img
        src={coverImage}
        style={{ width: "100%", height: 300, objectFit: "cover" }}
      />

      <h2>{court.courtName}</h2>

      <Space>
        <Tag color="blue">{court.categoryName}</Tag>
        <Tag>{court.pricePerHour} VND / giờ</Tag>
      </Space>

      <h3>Danh sách sân con</h3>

      <Space>
        {court.courtCopies?.map((copy: any) => (
          <Tag key={copy.courtCopyId}>{copy.courtCode}</Tag>
        ))}
      </Space>
    </Card>
  );
}

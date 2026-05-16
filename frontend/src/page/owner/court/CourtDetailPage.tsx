import { Card, Tag, Space, Skeleton, Image } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CourtService from "../../../service/courtService";
import amenityService from "../../../service/amenityService";

export default function CourtDetailPage() {
  const { courtId } = useParams();
  const [court, setCourt] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [amenitiesMap, setAmenitiesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!courtId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await CourtService.getCourtById(courtId);
        setCourt(res.result);
        const am = await amenityService.getAllAmenities();
        const map: Record<number, string> = {};
        (am.result || []).forEach(
          (a: any) => (map[a.amenityId] = a.amenityName),
        );
        setAmenitiesMap(map);
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [courtId]);

  if (loading || !court) return <Skeleton active />;

  const coverImage =
    court.images?.find((img: any) => img.isCover)?.imageUrl ||
    court.images?.[0]?.imageUrl ||
    undefined;

  return (
    <Card>
      {coverImage && (
        <Image
          src={coverImage}
          style={{ width: "100%", height: 300, objectFit: "cover" }}
        />
      )}

      <h2>{court.courtName}</h2>

      <Space>
        <Tag color="blue">{court.categoryName}</Tag>
        <Tag>{court.pricePerHour} VND / giờ</Tag>
        {court.surfaceType && <Tag>{court.surfaceType}</Tag>}
        <Tag>{court.indoor ? "Trong nhà" : "Ngoài trời"}</Tag>
      </Space>

      {court.amenityIds?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4>Tiện ích</h4>
          <Space>
            {court.amenityIds.map((id: number) => (
              <Tag key={id}>{amenitiesMap[id] || id}</Tag>
            ))}
          </Space>
        </div>
      )}

      <h3 style={{ marginTop: 16 }}>Danh sách sân con</h3>

      <Space>
        {court.courtCopies?.map((copy: any) => (
          <Tag key={copy.courtCopyId}>
            {copy.courtCode} — {copy.location}
          </Tag>
        ))}
      </Space>
    </Card>
  );
}

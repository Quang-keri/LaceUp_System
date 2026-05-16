import { Modal, Card, Tag, Space, Skeleton, Image, message } from "antd";
import { useEffect, useState } from "react";
import CourtService from "../../../service/courtService";
import amenityService from "../../../service/amenityService";

interface Props {
  open: boolean;
  onClose: () => void;
  courtId?: string;
}

export default function CourtDetailModal({ open, onClose, courtId }: Props) {
  const [court, setCourt] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [amenitiesMap, setAmenitiesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!open || !courtId) return;
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
        message.error("Không tải được thông tin sân");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, courtId]);

  if (!court && loading) return <Skeleton active />;

  const coverImage =
    court?.images?.find((img: any) => img.isCover)?.imageUrl ||
    court?.images?.[0]?.imageUrl;

  return (
    <Modal
      title="Chi tiết sân"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      {loading ? (
        <Skeleton active />
      ) : court ? (
        <div>
          {coverImage && (
            <Image
              src={coverImage}
              style={{
                width: "100%",
                height: 300,
                objectFit: "cover",
                borderRadius: 4,
              }}
              preview
            />
          )}

          <h2 style={{ marginTop: 16 }}>{court.courtName}</h2>

          <Space wrap style={{ marginBottom: 16 }}>
            <Tag color="blue">{court.categoryName}</Tag>
            <Tag>{court.pricePerHour?.toLocaleString("vi-VN")} VND / giờ</Tag>
            {court.surfaceType && <Tag>{court.surfaceType}</Tag>}
            <Tag>{court.indoor ? "Trong nhà" : "Ngoài trời"}</Tag>
          </Space>

          {court.amenityIds?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4>Tiện ích</h4>
              <Space wrap>
                {court.amenityIds.map((id: number) => (
                  <Tag key={id}>{amenitiesMap[id] || id}</Tag>
                ))}
              </Space>
            </div>
          )}

          <h4 style={{ marginTop: 20 }}>Danh sách sân con</h4>
          <Space wrap>
            {court.courtCopies?.map((copy: any) => (
              <Card
                key={copy.courtCopyId}
                size="small"
                style={{ minWidth: 200 }}
              >
                <div>
                  <strong>{copy.courtCode}</strong>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {copy.location}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <Tag color={copy.status === "ACTIVE" ? "green" : "red"}>
                      {copy.status === "ACTIVE"
                        ? "Hoạt động"
                        : "Ngừng hoạt động"}
                    </Tag>
                  </div>
                </div>
              </Card>
            ))}
          </Space>

          {court.images?.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <h4>Thư viện ảnh</h4>
              <Space wrap>
                {court.images.map((img: any, idx: number) => (
                  <Image
                    key={img.courtImageId || idx}
                    src={img.imageUrl}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 4,
                    }}
                    preview
                  />
                ))}
              </Space>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

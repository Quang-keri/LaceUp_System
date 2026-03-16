import { Card, List } from "antd";

export default function BookingInfoList({ intent }: any) {
  return (
    <Card title="Thông tin sân đã chọn">
      <List
        dataSource={intent.slots}
        renderItem={(slot: any) => (
          <List.Item>
            <div style={{ width: "100%" }}>
              <div>
                <b>Sân:</b> {slot.courtCode}
              </div>
              <div>
                Thời gian:{" "}
                {new Date(slot.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(slot.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div>Giá: {slot.price?.toLocaleString()} VNĐ</div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
}

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

const PURPLE = "#9156F1";

const Section = ({ title, children }: SectionProps) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 24,
        marginBottom: 24,
        boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
        border: "1px solid #f3f3f3",
      }}
    >
      {title && (
        <h3
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: "#1a1a2e",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {title}
        </h3>
      )}

      {children}
    </div>
  );
};

export default function AboutPage() {
  return (
    <div>
      <h2
        style={{
          marginBottom: 28,
          fontSize: 32,
          fontWeight: 800,
          color: "#1a1a2e",
        }}
      >
        Về LaceUp
      </h2>

      <Section title="Sứ mệnh của chúng tôi">
        <p
          style={{
            margin: 0,
            lineHeight: 1.8,
            color: "#555",
          }}
        >
          LaceUp được xây dựng nhằm kết nối người chơi với các sân thể thao, hỗ
          trợ chủ sân quản lý vận hành hiệu quả, đảm bảo quy trình đặt sân minh
          bạch, nhanh chóng và công bằng. Chúng tôi hướng đến việc hạn chế tranh
          chấp, bom sân, gian lận và thất thoát doanh thu.
        </p>
      </Section>

      <Section title="Tại sao chọn LaceUp?">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {[
            [
              "Realtime Booking",
              "Đặt sân tức thì, không phải chờ xác nhận thủ công",
            ],
            ["Quản lý doanh thu", "Theo dõi doanh thu và giao dịch minh bạch"],
            ["Hạn chế bom sân", "Xử lý booking ảo và giảm tỷ lệ hủy"],
            ["Tăng tỷ lệ lấp sân", "Gợi ý khung giờ tối ưu cho chủ sân"],
          ].map(([title, desc]) => (
            <div
              key={title}
              style={{
                padding: 18,
                borderRadius: 14,
                background: "#faf8ff",
                border: `1px solid ${PURPLE}20`,
              }}
            >
              <div
                style={{
                  color: PURPLE,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {title}
              </div>

              <div
                style={{
                  color: "#666",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="KPI dành cho chủ sân">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#faf8ff" }}>
              <th
                style={{
                  padding: 14,
                  textAlign: "left",
                  color: PURPLE,
                }}
              >
                KPI
              </th>

              <th
                style={{
                  padding: 14,
                  textAlign: "left",
                  color: PURPLE,
                }}
              >
                Mục tiêu
              </th>
            </tr>
          </thead>

          <tbody>
            {[
              ["Tỷ lệ lấp sân", "> 70%"],
              ["Tỷ lệ hủy", "< 5%"],
              ["Tỷ lệ đánh giá", "> 4.5 "],
              ["Tốc độ phản hồi", "< 10 phút"],
            ].map(([name, value]) => (
              <tr key={name}>
                <td
                  style={{
                    padding: 14,
                    borderTop: "1px solid #f2f2f2",
                  }}
                >
                  {name}
                </td>

                <td
                  style={{
                    padding: 14,
                    borderTop: "1px solid #f2f2f2",
                    color: PURPLE,
                    fontWeight: 700,
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Định hướng tương lai">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {[
            "Giải đấu cộng đồng",
            "Thuê HLV",
            "Livestream trận đấu",
            "AI Matchmaking",
            "Camera Tracking",
            "Membership CLB",
            "Marketplace dụng cụ",
          ].map((item) => (
            <div
              key={item}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "#faf8ff",
                border: `1px solid ${PURPLE}`,
                color: PURPLE,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Đội ngũ phát triển">
        <p
          style={{
            margin: 0,
            lineHeight: 1.8,
            color: "#555",
          }}
        >
          Đội ngũ bao gồm developer, UI/UX designer và những người có kinh
          nghiệm trong vận hành mô hình thể thao số. Chúng tôi cùng hướng tới
          việc xây dựng một hệ sinh thái thể thao minh bạch, realtime và công
          bằng tại Việt Nam.
        </p>
      </Section>
    </div>
  );
}

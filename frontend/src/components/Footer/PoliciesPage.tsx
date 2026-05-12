const Section = ({ title, children }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      padding: 24,
      marginBottom: 24,
      boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
    }}
  >
    <h3
      style={{
        marginTop: 0,
        color: "#1a1a2e",
        marginBottom: 16,
      }}
    >
      {title}
    </h3>

    <div
      style={{
        lineHeight: 1.8,
        color: "#555",
      }}
    >
      {children}
    </div>
  </div>
);

export default function PoliciesPage() {
  return (
    <div>
      <h2>Chính sách vận hành</h2>

      <Section title="1. Chính sách đặt sân">
        <ul>
          <li>Booking chỉ hợp lệ khi được hệ thống xác nhận.</li>
          <li>Có thể yêu cầu thanh toán cọc trước khi giữ chỗ.</li>
          <li>
            Booking chưa thanh toán sẽ tự động hủy sau thời gian quy định.
          </li>
          <li>Người chơi có thể check-in bằng QR, OTP hoặc tại quầy.</li>
        </ul>
      </Section>

      <Section title="2. Chính sách hủy sân & hoàn tiền">
        <ul>
          <li>Hủy trước 24h: hoàn 100%.</li>
          <li>Hủy từ 6–24h: hoàn 50%.</li>
          <li>Hủy dưới 6h: không hoàn tiền.</li>
          <li>Mỗi sân có thể tùy chỉnh chính sách riêng.</li>
        </ul>
      </Section>

      <Section title="3. Chính sách thanh toán">
        <ul>
          <li>Hỗ trợ chuyển khoản, QR Banking, ví điện tử.</li>
          <li>Giao dịch được đối soát tự động.</li>
          <li>Lịch sử thanh toán được lưu minh bạch.</li>
        </ul>
      </Section>

      <Section title="4. Chính sách đánh giá">
        <ul>
          <li>Người dùng có quyền đánh giá chất lượng sân.</li>
          <li>Cấm spam review hoặc đánh giá giả mạo.</li>
          <li>Hệ thống có quyền ẩn đánh giá bất thường.</li>
        </ul>
      </Section>

      <Section title="5. Chính sách bảo mật">
        <ul>
          <li>Lưu lịch sử booking và giao dịch.</li>
          <li>Mã hóa dữ liệu người dùng.</li>
          <li>Không chia sẻ dữ liệu trái phép.</li>
        </ul>
      </Section>
    </div>
  );
}

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
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

export default function TermsPage() {
  return (
    <div>
      <h2>Điều khoản dịch vụ</h2>

      <Section title="1. Điều khoản tài khoản">
        <ul>
          <li>Mỗi cá nhân chỉ được sở hữu 01 tài khoản.</li>
          <li>Thông tin đăng ký phải chính xác.</li>
          <li>Nền tảng có quyền xác minh danh tính.</li>
        </ul>
      </Section>

      <Section title="2. Hành vi bị nghiêm cấm">
        <ul>
          <li>Tạo tài khoản giả.</li>
          <li>Spam booking.</li>
          <li>Sử dụng bot giữ sân.</li>
          <li>Can thiệp hệ thống.</li>
          <li>Mạo danh người khác.</li>
        </ul>
      </Section>

      <Section title="3. Quyền và trách nhiệm người dùng">
        <ul>
          <li>Tuân thủ quy trình booking.</li>
          <li>Thanh toán đúng hạn.</li>
          <li>Chịu trách nhiệm với thông tin đã cung cấp.</li>
        </ul>
      </Section>

      <Section title="4. Quyền và trách nhiệm chủ sân">
        <ul>
          <li>Cập nhật giá và lịch sân chính xác.</li>
          <li>Không thay đổi giá sau booking.</li>
          <li>Đảm bảo chất lượng dịch vụ đã công bố.</li>
        </ul>
      </Section>

      <Section title="5. Xử lý vi phạm">
        <ul>
          <li>Cảnh báo đối với lỗi nhẹ.</li>
          <li>Hạn chế tính năng với hành vi lặp lại.</li>
          <li>Khóa tài khoản vĩnh viễn nếu gian lận nghiêm trọng.</li>
        </ul>
      </Section>

      <Section title="6. Quyền của nền tảng">
        <ul>
          <li>Từ chối hợp tác.</li>
          <li>Kiểm duyệt nội dung.</li>
          <li>Cập nhật thuật toán hiển thị.</li>
          <li>Điều chỉnh chính sách khi cần thiết.</li>
        </ul>
      </Section>
    </div>
  );
}

import '../../../../models/terms_section.dart';

const termsPolicySections = [
  TermsSection(
    title: 'TÀI KHOẢN NGƯỜI DÙNG',
    children: [
      TermsSubSection(
        title: 'Đăng ký Tài khoản',
        bullets: [
          'Người dùng cần cung cấp thông tin chính xác khi đăng ký tài khoản.',
          'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình.',
        ],
      ),
      TermsSubSection(
        title: 'Trách nhiệm của Người dùng',
        bullets: [
          'Người dùng cam kết sử dụng ứng dụng đúng mục đích.',
          'Không thực hiện hành vi gian lận, phá hoại hoặc vi phạm pháp luật.',

        ],
      ),
      TermsSubSection(
        title: 'Khóa/Hủy tài khoản',
        bullets: [
          'Ứng dụng có quyền khóa tài khoản nếu phát hiện hành vi vi phạm.',
        ],
      ),
    ],
  ),
  TermsSection(
    title: 'ĐẶT SÂN VÀ THANH TOÁN',
    children: [
      TermsSubSection(
        title: 'Quy trình Đặt sân',
        bullets: [
          'Người dùng thực hiện đặt sân thông qua các bước được hướng dẫn trên ứng dụng.',
          'Quy trình gồm lựa chọn sân, khung giờ, xác nhận thông tin và tiến hành thanh toán.',
          'Một đặt chỗ được coi là thành công khi người dùng nhận được thông báo xác nhận từ ứng dụng.',
        ],
      ),
      TermsSubSection(
        title: 'Giá và Thanh toán',
        bullets: [
          'Giá thuê sân được niêm yết công khai trên ứng dụng và do Chủ sân quyết định.',
          'Ứng dụng hỗ trợ thanh toán trực tuyến hoặc chuyển khoản ngân hàng.',
          'Người dùng cần hoàn tất thanh toán đúng thời điểm để đảm bảo giữ chỗ thành công.',
        ],
      ),
      TermsSubSection(
        title: 'Hủy và Thay đổi Đặt chỗ',
        bullets: [
          'Bạn có thể hủy đặt chỗ theo quy trình trên ứng dụng.',
          'Việc hủy chỉ được thực hiện khi đặt chỗ chưa được Chủ sân xác nhận hoặc chưa hết thời hạn giữ chỗ.',
          'Nếu đặt chỗ đã được xác nhận hoặc đã thanh toán, bạn cần liên hệ trực tiếp Chủ sân để thỏa thuận.',
        ],
      ),
      TermsSubSection(
        title: 'Tranh chấp về Đặt chỗ',
        bullets: [
          'Mọi tranh chấp phát sinh sẽ được xử lý dựa trên thông tin đặt chỗ và thỏa thuận giữa các bên.',
        ],
      ),
    ],
  ),
  TermsSection(
    title: 'TRÁCH NHIỆM VÀ MIỄN TRỪ',
    children: [
      TermsSubSection(
        title: 'Trách nhiệm của Ứng dụng',
        bullets: [
          'Chúng tôi nỗ lực duy trì hoạt động ổn định và an toàn của ứng dụng.',
          'Ứng dụng là nền tảng kết nối, không phải chủ sở hữu sân bãi.',
          'Chúng tôi không chịu trách nhiệm về chất lượng, an toàn hoặc dịch vụ trực tiếp tại sân.',
        ],
      ),
      TermsSubSection(
        title: 'Tuyên bố Miễn trừ trách nhiệm',
        bullets: [
          'Chúng tôi không chịu trách nhiệm về chất lượng sân bãi do Chủ sân cung cấp.',
          'Chúng tôi không chịu trách nhiệm với lỗi kỹ thuật, sự cố mạng hoặc sự kiện bất khả kháng.',
          'Thông tin sân bãi do Chủ sân đăng tải và cập nhật.',
        ],
      ),
      TermsSubSection(
        title: 'Giới hạn Trách nhiệm',
        bullets: [
          'Tổng mức bồi thường nếu có sẽ không vượt quá tổng số phí dịch vụ bạn đã thanh toán trong 6 tháng gần nhất.',
        ],
      ),
    ],
  ),
  TermsSection(
    title: 'BẢO MẬT VÀ QUYỀN RIÊNG TƯ',
    children: [
      TermsSubSection(
        title: 'Chính sách quyền riêng tư',
        bullets: [
          'Chúng tôi coi trọng việc bảo vệ thông tin cá nhân của bạn.',
          'Khi sử dụng ứng dụng, bạn đồng ý với việc thu thập, sử dụng và bảo vệ thông tin cá nhân.',
          'Dữ liệu được dùng để cung cấp dịch vụ, xử lý giao dịch và đảm bảo an toàn tài khoản.',
        ],
      ),
    ],
  ),
  TermsSection(
    title: 'CÁC ĐIỀU KHOẢN KHÁC',
    children: [
      TermsSubSection(
        title: 'Luật áp dụng và Giải quyết tranh chấp',
        bullets: [
          'Các điều khoản này được điều chỉnh theo pháp luật Việt Nam.',
          'Mọi tranh chấp sẽ được ưu tiên giải quyết bằng thương lượng và hòa giải.',
        ],
      ),
      TermsSubSection(
        title: 'Liên hệ',
        bullets: [
          'Công ty: Hệ thống LaceUp',
          'Email: werelacezone@gmail.com',
          'Hotline CSKH: 0933 484 531',
        ],
      ),
    ],
  ),
];
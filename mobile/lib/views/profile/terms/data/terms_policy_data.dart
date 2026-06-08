enum TermsContentType { paragraph, bullets }

class TermsContentBlock {
  final TermsContentType type;
  final String? text;
  final List<String> items;

  const TermsContentBlock.paragraph(String value)
      : type = TermsContentType.paragraph,
        text = value,
        items = const [];

  const TermsContentBlock.bullets(List<String> value)
      : type = TermsContentType.bullets,
        text = null,
        items = value;
}

class TermsPolicyItem {
  final String id;
  final String title;
  final List<TermsContentBlock> content;

  const TermsPolicyItem({
    required this.id,
    required this.title,
    required this.content,
  });
}

class TermsPolicyGroup {
  final String id;
  final String title;
  final List<TermsPolicyItem> items;

  const TermsPolicyGroup({
    required this.id,
    required this.title,
    required this.items,
  });
}

const List<TermsPolicyGroup> termsPolicyGroups = [
  TermsPolicyGroup(
    id: 'general-terms',
    title: 'ĐIỀU KHOẢN CHUNG',
    items: [
      TermsPolicyItem(
        id: 'introduction-scope',
        title: 'Giới thiệu và Phạm vi áp dụng',
        content: [
          TermsContentBlock.bullets([
            'Chào mừng bạn đến với LaceUp - Nền tảng tìm kiếm và đặt sân thể thao (sau đây gọi tắt là “Ứng dụng”). Ứng dụng được xây dựng và vận hành nhằm kết nối người dùng có nhu cầu tìm kiếm, đặt sân và tham gia các hoạt động thể thao với các chủ sân một cách thuận tiện và nhanh chóng.',
            'Các Điều khoản và Điều kiện sử dụng này (sau đây gọi là “Điều khoản”) áp dụng cho tất cả cá nhân và tổ chức truy cập, sử dụng hoặc đăng ký tài khoản trên Ứng dụng. Bằng cách sử dụng Ứng dụng, bạn xác nhận rằng đã đọc, hiểu và đồng ý tuân thủ toàn bộ các Điều khoản này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng không sử dụng Ứng dụng.',
            'Trong phạm vi của Điều khoản này, các thuật ngữ sau đây được hiểu như sau:',
            '“Ứng dụng”: Nền tảng di động và trang web LaceUp do chúng tôi cung cấp.',
            '“Người dùng”: Bất kỳ cá nhân nào truy cập, sử dụng hoặc đăng ký tài khoản trên Ứng dụng để tìm kiếm, đặt sân hoặc tham gia các hoạt động thể thao.',
            '“Chủ sân”: Cá nhân hoặc tổ chức sở hữu, quản lý hoặc được ủy quyền đại diện cho các sân thể thao và sử dụng Ứng dụng để đăng tải thông tin, quản lý lịch đặt sân và giao dịch trực tiếp với Người dùng.',
            '“Sân”: Cơ sở vật chất hoặc địa điểm thể thao do Chủ sân cung cấp và đăng tải trên Ứng dụng.',
            '“Đặt chỗ”: Hành động Người dùng lựa chọn một Sân vào một khung giờ cụ thể và thực hiện yêu cầu đặt sân hoặc xác nhận thanh toán thông qua Ứng dụng.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'terms-change',
        title: 'Thay đổi Điều khoản',
        content: [
          TermsContentBlock.bullets([
            'Chúng tôi có quyền sửa đổi, bổ sung hoặc thay đổi các Điều khoản này vào bất kỳ thời điểm nào. Các thay đổi sẽ có hiệu lực ngay sau khi được đăng tải trên Ứng dụng hoặc trang web của chúng tôi. Chúng tôi sẽ thông báo cho bạn về những thay đổi quan trọng thông qua một trong các hình thức sau:',
            'Gửi thông báo trực tiếp trên Ứng dụng.',
            'Gửi email đến địa chỉ bạn đã đăng ký.',
            'Hiển thị banner hoặc cửa sổ pop-up trên trang chủ Ứng dụng.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'language',
        title: 'Ngôn ngữ',
        content: [
          TermsContentBlock.bullets([
            'Ngôn ngữ chính thức của các Điều khoản này là tiếng Việt.',
            'Trong trường hợp các Điều khoản này được dịch sang các ngôn ngữ khác, bản tiếng Việt sẽ là bản có giá trị pháp lý cao nhất và được ưu tiên áp dụng để giải thích các điều khoản. Mọi bản dịch chỉ mang tính chất tham khảo.',
          ]),
        ],
      ),
    ],
  ),
  TermsPolicyGroup(
    id: 'user-account',
    title: 'TÀI KHOẢN NGƯỜI DÙNG',
    items: [
      TermsPolicyItem(
        id: 'account-registration',
        title: 'Đăng ký Tài khoản',
        content: [
          TermsContentBlock.bullets([
            'Để sử dụng đầy đủ các tính năng của Ứng dụng, bạn cần đăng ký một tài khoản.',
            'Điều kiện đăng ký: Bạn phải đủ 16 tuổi trở lên và có đầy đủ năng lực hành vi dân sự theo quy định của pháp luật Việt Nam. Bằng việc đăng ký, bạn cam kết rằng bạn đáp ứng các điều kiện này.',
            'Thông tin đăng ký: Bạn cam kết cung cấp các thông tin đăng ký chính xác, đầy đủ và trung thực. Mọi thông tin sai lệch có thể dẫn đến việc tài khoản của bạn bị tạm ngừng hoặc chấm dứt. Bạn có trách nhiệm cập nhật thông tin cá nhân của mình khi có thay đổi.',
            'Tên người dùng và mật khẩu: Bạn chịu trách nhiệm hoàn toàn trong việc bảo mật tên người dùng và mật khẩu của mình. Bạn không được chia sẻ thông tin này với bất kỳ ai. Chúng tôi không chịu trách nhiệm về bất kỳ thiệt hại nào phát sinh do việc bạn không bảo mật thông tin tài khoản.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'user-responsibility',
        title: 'Trách nhiệm của Người dùng',
        content: [
          TermsContentBlock.bullets([
            'Bảo mật thông tin đăng nhập: Bạn phải giữ bí mật tuyệt đối thông tin đăng nhập của mình. Bạn phải chịu trách nhiệm về tất cả hoạt động diễn ra thông qua tài khoản của mình, dù bạn có cho phép hay không.',
            'Thông báo truy cập trái phép: Nếu phát hiện bất kỳ hành vi sử dụng trái phép nào đối với tài khoản của mình, bạn phải thông báo ngay lập tức cho chúng tôi qua email hoặc hotline hỗ trợ để chúng tôi có biện pháp xử lý kịp thời.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'account-lock-delete',
        title: 'Khóa/Hủy tài khoản',
        content: [
          TermsContentBlock.bullets([
            'Quyền của chúng tôi: Chúng tôi có quyền tạm ngừng, khóa hoặc chấm dứt tài khoản của bạn vào bất kỳ lúc nào nếu bạn vi phạm bất kỳ điều khoản nào trong văn bản này, có hành vi gian lận hoặc gây ảnh hưởng tiêu cực đến Ứng dụng và cộng đồng người dùng.',
            'Quyền của Người dùng: Bạn có quyền chủ động hủy tài khoản của mình bất cứ lúc nào. Để thực hiện, bạn có thể làm theo quy trình được hướng dẫn trên Ứng dụng hoặc liên hệ với bộ phận hỗ trợ của chúng tôi để được trợ giúp.',
            'Xử lý dữ liệu: Sau khi tài khoản bị hủy, chúng tôi có thể giữ lại một số thông tin cá nhân của bạn trong một khoảng thời gian hợp lý theo quy định của pháp luật hoặc theo Chính sách Quyền riêng tư để phục vụ cho các mục đích quản lý và pháp lý.',
          ]),
        ],
      ),
    ],
  ),
  TermsPolicyGroup(
    id: 'booking-payment',
    title: 'ĐẶT SÂN VÀ THANH TOÁN',
    items: [
      TermsPolicyItem(
        id: 'booking-process',
        title: 'Quy trình Đặt sân',
        content: [
          TermsContentBlock.paragraph(
            'Người dùng có thể tìm kiếm sân, lựa chọn khung giờ phù hợp và gửi yêu cầu đặt sân thông qua website hoặc ứng dụng di động LaceUp.',
          ),
          TermsContentBlock.bullets([
            'Lựa chọn sân và khung giờ: Người dùng lựa chọn địa điểm, sân, ngày chơi và khung giờ còn trống được hiển thị trên hệ thống.',
            'Kiểm tra thông tin: Trước khi xác nhận, Người dùng có trách nhiệm kiểm tra kỹ thông tin sân, thời gian, mức giá, số tiền cần thanh toán và các quy định riêng của Chủ sân.',
            'Quy trình đặt sân trên website: Sau khi lựa chọn sân và khung giờ, hệ thống sẽ hiển thị thông tin thanh toán và mã QR chuyển khoản để Người dùng có thể quét mã, thực hiện thanh toán nhanh chóng và thuận tiện.',
            'Người dùng phải chuyển khoản đúng số tiền, đúng tài khoản và đúng nội dung chuyển khoản được hệ thống cung cấp. Việc chuyển sai nội dung có thể khiến giao dịch không được nhận diện hoặc phải xử lý thủ công.',
            'Quy trình đặt sân trên ứng dụng di động: Người dùng gửi yêu cầu đặt sân, thực hiện chuyển khoản theo thông tin được cung cấp và gửi minh chứng thanh toán nếu hệ thống yêu cầu.',
            'Đối với yêu cầu đặt sân trên ứng dụng di động, Chủ sân sẽ kiểm tra thông tin và khoản thanh toán trước khi duyệt. Booking chỉ được xem là thành công sau khi Chủ sân xác nhận.',
            'Xác nhận đặt sân: Một booking chỉ có hiệu lực khi Người dùng nhận được trạng thái xác nhận thành công từ hệ thống hoặc thông báo xác nhận của Chủ sân.',
            'Việc chỉ gửi yêu cầu, quét mã QR hoặc chuyển khoản nhưng chưa được xác nhận không đồng nghĩa với việc sân đã được giữ chỗ thành công.',
            'Trong trường hợp một khung giờ nhận được nhiều yêu cầu, hệ thống ưu tiên booking đã hoàn tất đầy đủ quy trình thanh toán và được xác nhận trước.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'price-payment',
        title: 'Giá và Thanh toán',
        content: [
          TermsContentBlock.paragraph(
            'Mức giá thuê sân và số tiền cần thanh toán được hiển thị tại thời điểm Người dùng thực hiện đặt sân.',
          ),
          TermsContentBlock.bullets([
            'Giá thuê sân do Chủ sân thiết lập và được công khai trên LaceUp. Giá có thể thay đổi theo sân, khung giờ, ngày chơi hoặc chính sách của từng Chủ sân.',
            'Người dùng có trách nhiệm kiểm tra tổng số tiền trước khi xác nhận thanh toán.',
            'Tùy thuộc vào chính sách của từng sân và từng kênh đặt sân, Người dùng có thể được yêu cầu thanh toán tiền cọc hoặc thanh toán số tiền được hiển thị trên hệ thống.',
            'Thanh toán trên website: Sau khi tạo yêu cầu đặt sân, Người dùng có thể quét mã QR chuyển khoản được hiển thị trực tiếp trên website để thực hiện giao dịch.',
            'Thanh toán trên ứng dụng di động: Người dùng thực hiện chuyển khoản theo thông tin được cung cấp và chờ Chủ sân kiểm tra, duyệt khoản thanh toán và xác nhận booking.',
            'Người dùng phải sử dụng đúng mã booking hoặc nội dung chuyển khoản được LaceUp cung cấp để hệ thống và Chủ sân có thể đối soát giao dịch.',
            'Các giao dịch chuyển khoản sai số tiền, sai nội dung, sai tài khoản hoặc không có đủ bằng chứng thanh toán có thể bị từ chối xác nhận.',
            'LaceUp và Chủ sân có quyền yêu cầu Người dùng cung cấp hình ảnh giao dịch, mã giao dịch hoặc thông tin liên quan để phục vụ việc kiểm tra và đối soát.',
            'Không gửi mật khẩu ngân hàng, mã OTP, mã PIN hoặc các thông tin bảo mật ngân hàng cho Chủ sân hay bất kỳ người nào.',
            'LaceUp không chịu trách nhiệm đối với các giao dịch được thực hiện đến tài khoản không được hiển thị hoặc cung cấp chính thức trên hệ thống.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'cancel-change-booking',
        title: 'Hủy và Thay đổi Đặt chỗ',
        content: [
          TermsContentBlock.paragraph(
            'Người dùng cần cân nhắc kỹ sân, ngày chơi và khung giờ trước khi thanh toán. Chính sách của LaceUp hiện không hỗ trợ hoàn lại khoản tiền tương ứng khi Người dùng chủ động hủy booking đã được xác nhận.',
          ),
          TermsContentBlock.bullets([
            'Hủy booking chưa thanh toán: Người dùng có thể hủy yêu cầu nếu booking chưa được thanh toán và chưa được xác nhận.',
            'Hủy booking trên website: Khi tiền cọc đã được thanh toán và booking đã được xác nhận, nếu Người dùng chủ động hủy thì khoản tiền cọc sẽ không được hoàn lại.',
            'Hủy booking trên ứng dụng di động: Khi Chủ sân đã kiểm tra thanh toán và xác nhận booking, nếu Người dùng chủ động hủy thì toàn bộ số tiền đã thanh toán sẽ không được hoàn lại.',
            'Việc Người dùng không đến sân, đến trễ, thay đổi kế hoạch cá nhân hoặc không thể tham gia đúng thời gian đã đặt không phải là căn cứ để yêu cầu hoàn tiền.',
            'Trước khi thực hiện thao tác hủy, hệ thống có thể hiển thị cảnh báo về số tiền không được hoàn. Người dùng cần đọc kỹ và xác nhận trước khi tiếp tục.',
            'Thay đổi ngày hoặc khung giờ: Người dùng không được tự ý thay đổi thông tin của booking đã xác nhận. Mọi yêu cầu thay đổi phải được trao đổi với Chủ sân.',
            'Việc đổi sân, đổi ngày hoặc đổi khung giờ chỉ được thực hiện khi Chủ sân đồng ý và khung giờ mới còn khả dụng.',
            'Chủ sân có quyền từ chối yêu cầu thay đổi nếu sân đã có lịch đặt khác hoặc yêu cầu được gửi quá gần thời gian bắt đầu.',
            'Trường hợp Chủ sân chủ động hủy booking hoặc không thể cung cấp sân đúng như đã xác nhận, Chủ sân có trách nhiệm thông báo và phối hợp với Người dùng để đổi lịch hoặc xử lý hoàn lại khoản tiền đã nhận.',
            'Trường hợp booking không thể thực hiện do lỗi được xác nhận từ hệ thống LaceUp, chúng tôi sẽ phối hợp cùng Người dùng và Chủ sân để kiểm tra và đưa ra phương án xử lý phù hợp.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'booking-dispute',
        title: 'Tranh chấp về Đặt chỗ',
        content: [
          TermsContentBlock.paragraph(
            'Khi phát sinh tranh chấp liên quan đến booking, thanh toán, xác nhận đặt sân, hủy sân hoặc chất lượng dịch vụ, Người dùng và Chủ sân cần ưu tiên trao đổi và cung cấp đầy đủ bằng chứng để giải quyết.',
          ),
          TermsContentBlock.bullets([
            'Người dùng cần cung cấp mã booking, thời gian đặt sân, ảnh chuyển khoản, mã giao dịch, nội dung trao đổi và các bằng chứng liên quan.',
            'Chủ sân có trách nhiệm cung cấp thông tin xác nhận thanh toán, trạng thái booking, lịch sân và các dữ liệu cần thiết để phục vụ việc đối chiếu.',
            'LaceUp có thể sử dụng lịch sử booking, thời gian thao tác, trạng thái hệ thống, thông báo xác nhận và dữ liệu giao dịch để hỗ trợ xác minh sự việc.',
            'Đối với booking do Người dùng chủ động hủy sau khi đã được xác nhận, chính sách không hoàn tiền cọc trên website hoặc không hoàn toàn bộ số tiền đã thanh toán trên ứng dụng di động sẽ được áp dụng.',
            'Đối với trường hợp Người dùng đã chuyển khoản nhưng booking chưa được xác nhận, LaceUp và Chủ sân sẽ thực hiện kiểm tra dựa trên chứng từ giao dịch thực tế.',
            'Nếu Người dùng chuyển khoản sai tài khoản, sai nội dung hoặc thực hiện giao dịch bên ngoài thông tin được LaceUp cung cấp, khả năng hỗ trợ xác minh và xử lý có thể bị hạn chế.',
            'Nếu Chủ sân đã nhận tiền nhưng không xác nhận booking hoặc không cung cấp sân đúng như thông tin đã cam kết, LaceUp có quyền yêu cầu Chủ sân giải trình và áp dụng biện pháp xử lý tài khoản.',
            'LaceUp đóng vai trò cung cấp nền tảng, lưu trữ thông tin và hỗ trợ các bên đối chiếu. Việc hoàn tiền hoặc bồi thường sẽ được xem xét dựa trên nguyên nhân, bằng chứng và trách nhiệm của từng bên.',
            'Trong trường hợp không thể giải quyết thông qua trao đổi, các bên có quyền thực hiện các biện pháp giải quyết tranh chấp theo quy định của pháp luật.',
          ]),
        ],
      ),
    ],
  ),
  TermsPolicyGroup(
    id: 'responsibility-disclaimer',
    title: 'TRÁCH NHIỆM VÀ MIỄN TRỪ',
    items: [
      TermsPolicyItem(
        id: 'application-responsibility',
        title: 'Trách nhiệm của Ứng dụng',
        content: [
          TermsContentBlock.paragraph(
            'LaceUp cam kết nỗ lực vận hành nền tảng ổn định, an toàn và minh bạch nhằm hỗ trợ việc kết nối giữa Người dùng và Chủ sân.',
          ),
          TermsContentBlock.bullets([
            'Vận hành nền tảng: LaceUp nỗ lực duy trì hoạt động của website và ứng dụng di động để Người dùng có thể tìm kiếm sân, xem lịch trống, gửi yêu cầu đặt sân và theo dõi trạng thái booking.',
            'Hỗ trợ quy trình đặt sân trên website: LaceUp hiển thị thông tin booking và mã QR chuyển khoản để Người dùng có thể thực hiện thanh toán thuận tiện. Booking chỉ có hiệu lực khi được hệ thống xác nhận thành công.',
            'Hỗ trợ quy trình đặt sân trên ứng dụng di động: LaceUp chuyển yêu cầu đặt sân và thông tin thanh toán đến Chủ sân. Booking chỉ được xác nhận sau khi Chủ sân kiểm tra và duyệt yêu cầu.',
            'Hiển thị thông tin: LaceUp có trách nhiệm hiển thị các thông tin do Chủ sân cung cấp, bao gồm địa chỉ, giá thuê, khung giờ, hình ảnh, tiện ích và các quy định liên quan.',
            'Bảo mật thông tin: LaceUp áp dụng các biện pháp kỹ thuật phù hợp nhằm bảo vệ thông tin cá nhân và dữ liệu tài khoản của Người dùng theo Chính sách Quyền riêng tư.',
            'Hỗ trợ đối soát: Khi phát sinh vấn đề liên quan đến booking hoặc thanh toán, LaceUp có thể sử dụng dữ liệu hệ thống, mã booking, trạng thái xác nhận và lịch sử giao dịch để hỗ trợ các bên kiểm tra.',
            'Hỗ trợ tranh chấp: LaceUp tiếp nhận thông tin, hỗ trợ liên hệ và cung cấp dữ liệu liên quan trong phạm vi quyền hạn của nền tảng. LaceUp không thay thế cơ quan có thẩm quyền trong việc giải quyết tranh chấp.',
            'Vai trò nền tảng: LaceUp là nền tảng công nghệ kết nối Người dùng với Chủ sân, không trực tiếp sở hữu hoặc vận hành các sân thể thao được đăng tải trên hệ thống.',
            'Chủ sân chịu trách nhiệm trực tiếp đối với tình trạng sân, chất lượng dịch vụ, an toàn tại địa điểm, lịch hoạt động và việc cung cấp dịch vụ đúng như thông tin đã công bố.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'disclaimer',
        title: 'Tuyên bố Miễn trừ trách nhiệm',
        content: [
          TermsContentBlock.paragraph(
            'Trong phạm vi pháp luật cho phép, Người dùng hiểu và đồng ý rằng LaceUp được miễn trừ trách nhiệm đối với những thiệt hại phát sinh từ các trường hợp nằm ngoài khả năng kiểm soát hợp lý của nền tảng.',
          ),
          TermsContentBlock.bullets([
            'Chất lượng dịch vụ sân: LaceUp không trực tiếp cung cấp sân và không chịu trách nhiệm thay cho Chủ sân về chất lượng mặt sân, cơ sở vật chất, vệ sinh, an ninh, an toàn hoặc các dịch vụ đi kèm.',
            'Thông tin do Chủ sân cung cấp: LaceUp không bảo đảm tuyệt đối rằng toàn bộ hình ảnh, mô tả, mức giá, tiện ích và lịch trống do Chủ sân đăng tải luôn chính xác hoặc được cập nhật kịp thời.',
            'Booking chưa được xác nhận: Việc Người dùng gửi yêu cầu đặt sân, quét mã QR hoặc thực hiện chuyển khoản không đồng nghĩa với việc booking đã thành công. Booking chỉ có hiệu lực khi có trạng thái xác nhận từ hệ thống hoặc Chủ sân.',
            'Giao dịch sai thông tin: LaceUp không chịu trách nhiệm đối với thiệt hại phát sinh khi Người dùng chuyển sai số tiền, sai tài khoản, sai nội dung chuyển khoản hoặc giao dịch ngoài thông tin chính thức được hiển thị trên nền tảng.',
            'Dịch vụ ngân hàng và bên thứ ba: LaceUp không chịu trách nhiệm đối với sự cố, chậm trễ hoặc lỗi phát sinh từ ngân hàng, cổng thanh toán, nhà cung cấp mạng hoặc các dịch vụ của bên thứ ba.',
            'Hành vi của Người dùng: LaceUp không chịu trách nhiệm đối với thiệt hại phát sinh do Người dùng không tuân thủ nội quy sân, Điều khoản sử dụng, hướng dẫn an toàn hoặc quy định pháp luật.',
            'Hành vi của Chủ sân: Chủ sân tự chịu trách nhiệm đối với việc xác nhận booking, cung cấp sân, thay đổi lịch, hủy lịch, nhận thanh toán và thực hiện nghĩa vụ hoàn tiền thuộc trách nhiệm của mình.',
            'Sự kiện bất khả kháng: LaceUp không chịu trách nhiệm đối với việc gián đoạn dịch vụ do thiên tai, hỏa hoạn, dịch bệnh, chiến tranh, mất điện, sự cố mạng, quyết định của cơ quan nhà nước hoặc các sự kiện ngoài khả năng kiểm soát hợp lý.',
            'Nội dung và liên kết bên ngoài: LaceUp không chịu trách nhiệm đối với nội dung, sản phẩm hoặc dịch vụ được cung cấp thông qua các website và nền tảng bên thứ ba.',
            'Người dùng có trách nhiệm tự đánh giá tình trạng sức khỏe, khả năng vận động và mức độ phù hợp trước khi tham gia các hoạt động thể thao.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'limitation-liability',
        title: 'Giới hạn Trách nhiệm',
        content: [
          TermsContentBlock.paragraph(
            'Trong phạm vi pháp luật cho phép, trách nhiệm của LaceUp chỉ được xem xét đối với những thiệt hại trực tiếp, thực tế và có bằng chứng rõ ràng phát sinh từ lỗi của nền tảng.',
          ),
          TermsContentBlock.bullets([
            'LaceUp không chịu trách nhiệm đối với các thiệt hại gián tiếp, mất lợi nhuận, mất cơ hội kinh doanh, mất dữ liệu, tổn thất tinh thần hoặc các thiệt hại phát sinh ngoài dự đoán hợp lý.',
            'Đối với tranh chấp liên quan đến một booking cụ thể, tổng trách nhiệm bồi thường của LaceUp, nếu có, không vượt quá số tiền Người dùng đã thanh toán cho booking đang xảy ra tranh chấp, trừ trường hợp pháp luật có quy định khác.',
            'Khoản tiền cọc hoặc tiền thanh toán do Chủ sân trực tiếp nhận và quản lý thuộc trách nhiệm đối soát, cung cấp dịch vụ và hoàn trả của Chủ sân theo chính sách được áp dụng.',
            'Trường hợp Người dùng chủ động hủy booking đã được xác nhận, chính sách không hoàn tiền cọc trên website hoặc không hoàn toàn bộ số tiền đã thanh toán trên ứng dụng di động sẽ được áp dụng.',
            'Trường hợp Chủ sân hủy booking hoặc không cung cấp sân đúng như đã xác nhận, Chủ sân có trách nhiệm phối hợp với Người dùng để đổi lịch hoặc xử lý hoàn lại khoản tiền đã nhận.',
            'LaceUp có thể hỗ trợ xác minh thông tin và liên hệ giữa các bên nhưng không có nghĩa vụ thanh toán thay cho Chủ sân đối với khoản tiền Chủ sân đã trực tiếp nhận.',
            'Các giới hạn trách nhiệm trong Điều khoản này không loại trừ những nghĩa vụ mà LaceUp bắt buộc phải thực hiện theo quy định của pháp luật.',
            'Không nội dung nào trong Điều khoản này được hiểu là miễn trừ trách nhiệm của LaceUp đối với hành vi gian lận, cố ý vi phạm, lỗi nghiêm trọng hoặc vi phạm nghĩa vụ bảo vệ dữ liệu thuộc trách nhiệm trực tiếp của LaceUp.',
          ]),
        ],
      ),
    ],
  ),
  TermsPolicyGroup(
    id: 'privacy-security',
    title: 'BẢO MẬT VÀ QUYỀN RIÊNG TƯ',
    items: [
      TermsPolicyItem(
        id: 'privacy-policy',
        title: 'Chính sách quyền riêng tư',
        content: [
          TermsContentBlock.bullets([
            'Chúng tôi coi trọng việc bảo vệ thông tin cá nhân của bạn. Chính sách Quyền riêng tư là một phần không thể thiếu của các Điều khoản này.',
            'Khi sử dụng LaceUp, bạn đồng ý với việc chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
            'Các loại dữ liệu thu thập: Chúng tôi có thể thu thập họ tên, email, số điện thoại, thông tin tài khoản, dữ liệu đặt sân, giao dịch và dữ liệu kỹ thuật khi bạn sử dụng LaceUp.',
            'Mục đích sử dụng: Dữ liệu được sử dụng để quản lý tài khoản, xử lý booking, xác nhận thanh toán, hỗ trợ Người dùng và cải thiện chất lượng dịch vụ.',
            'Bảo vệ dữ liệu: Chúng tôi áp dụng các biện pháp bảo mật hợp lý để bảo vệ thông tin cá nhân của bạn khỏi việc truy cập, sử dụng hoặc tiết lộ trái phép.',
            'Chia sẻ với bên thứ ba: Chúng tôi có thể chia sẻ các thông tin cần thiết với Chủ sân để phục vụ việc đặt sân, xác nhận thanh toán và cung cấp dịch vụ. Thông tin cũng có thể được cung cấp theo yêu cầu của pháp luật.',
            'Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình. Để thực hiện các quyền này, vui lòng sử dụng chức năng quản lý tài khoản hoặc liên hệ với bộ phận hỗ trợ của LaceUp.',
          ]),
        ],
      ),
    ],
  ),
  TermsPolicyGroup(
    id: 'other-terms',
    title: 'CÁC ĐIỀU KHOẢN KHÁC',
    items: [
      TermsPolicyItem(
        id: 'law-and-dispute',
        title: 'Luật áp dụng và Giải quyết tranh chấp',
        content: [
          TermsContentBlock.bullets([
            'Luật áp dụng: Các Điều khoản này được điều chỉnh và giải thích theo pháp luật của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.',
            'Giải quyết tranh chấp: Mọi tranh chấp phát sinh từ hoặc liên quan đến việc sử dụng LaceUp sẽ được ưu tiên giải quyết thông qua thương lượng và hòa giải trên tinh thần thiện chí.',
            'Nếu các bên không đạt được thỏa thuận, một trong các bên có quyền đưa vụ việc ra Tòa án có thẩm quyền tại Việt Nam để giải quyết theo quy định của pháp luật.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'contact',
        title: 'Liên hệ',
        content: [
          TermsContentBlock.bullets([
            'Nếu bạn có bất kỳ câu hỏi, phản hồi, khiếu nại hoặc muốn báo cáo hành vi vi phạm liên quan đến LaceUp, vui lòng liên hệ với chúng tôi qua các kênh hỗ trợ được công bố.',
            'Đơn vị vận hành: LaceUp.',
            'Website:  https://laceupzone.id.vn.',
            'Email hỗ trợ: werelacezone@gmail.com',
            'Hotline chăm sóc khách hàng: 0933 484 531',
            'Khi gửi yêu cầu hỗ trợ liên quan đến booking hoặc thanh toán, Người dùng nên cung cấp mã booking, số điện thoại đặt sân và các bằng chứng liên quan để được xử lý nhanh chóng.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'severability',
        title: 'Điều khoản có hiệu lực từng phần',
        content: [
          TermsContentBlock.bullets([
            'Nếu bất kỳ điều khoản nào trong văn bản này bị cơ quan hoặc Tòa án có thẩm quyền xác định là không hợp lệ, trái pháp luật hoặc không thể thực thi, điều khoản đó sẽ được điều chỉnh hoặc loại bỏ trong phạm vi cần thiết.',
            'Các điều khoản còn lại vẫn tiếp tục có đầy đủ hiệu lực và giá trị pháp lý.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'assignment-rights-obligations',
        title: 'Chuyển giao Quyền và Nghĩa vụ',
        content: [
          TermsContentBlock.bullets([
            'LaceUp có quyền chuyển giao, chuyển nhượng hoặc giao cho bên thứ ba thực hiện một phần hoặc toàn bộ quyền và nghĩa vụ của mình theo các Điều khoản này, phù hợp với quy định của pháp luật.',
            'Người dùng không được tự ý chuyển giao tài khoản, quyền hoặc nghĩa vụ của mình cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý bằng văn bản của LaceUp.',
          ]),
        ],
      ),
      TermsPolicyItem(
        id: 'entire-agreement',
        title: 'Toàn bộ Thỏa thuận',
        content: [
          TermsContentBlock.bullets([
            'Các Điều khoản này cùng với Chính sách Quyền riêng tư, chính sách đặt sân, thanh toán, hủy booking và các quy định khác được công bố trên LaceUp cấu thành toàn bộ thỏa thuận giữa Người dùng và LaceUp.',
            'Các nội dung này thay thế cho mọi thỏa thuận, cam kết hoặc tuyên bố trước đó liên quan đến việc sử dụng website và ứng dụng LaceUp.',
            'Bằng việc tiếp tục sử dụng LaceUp, Người dùng xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các Điều khoản và chính sách được công bố.',
          ]),
        ],
      ),
    ],
  ),
];

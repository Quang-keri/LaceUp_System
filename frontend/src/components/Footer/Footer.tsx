import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-50 mt-20">
      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8 py-12 px-6">
        <div>
          <h3 className=" mb-4">Liên hệ với chúng tôi</h3>
          <p className="text-sm text-gray-400">Email: laceup@gmail.com</p>
          <p className="text-sm text-gray-400">Điện thoại: +84 123 456 789</p>
          <p className="text-sm text-gray-400">
            Địa chỉ: Thành phố Hồ Chí Minh
          </p>
        </div>

        <div>
          <h3 className="mb-4">Nền tảng thể thao</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Bóng đá</li>
            <li>Cầu lông</li>
            <li>Pickleball</li>
          </ul>
        </div>

        <div>
          <h3 className="  mb-4">Chính sách</h3>
          <ul className="space-y-2 text-gray-400">
            <li>
              <Link to="/info/policies">Nguyên tắc cộng đồng</Link>
            </li>
            <li>
              <Link to="/info/terms">Điều khoản dịch vụ</Link>
            </li>
            <li>
              <Link to="/create-rental-area">Đăng sân của bạn</Link>
            </li>
            <li>
              <Link to="/info/about-us">Về chúng tôi</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className=" mb-4">Tham gia cùng chúng tôi</h3>
          <p className="text-gray-400 text-sm mb-3">
            Theo dõi chúng tôi trên mạng xã hội
          </p>

          <div className="flex gap-4 text-xl">
            <FaFacebook className="cursor-pointer  bg-blue-600 text-white hover:text-[#cf9c5d]" />
            <FaInstagram className="cursor-pointer  bg-pink-500 text-white hover:text-[#cf9c5d]" />
            <FaTwitter className="cursor-pointer  bg-blue-400 text-white hover:text-[#cf9c5d]" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-gray-400 text-sm">
        © 2026 LaceUp. Bản quyền đã được bảo hộ.
      </div>
    </footer>
  );
};

export default Footer;

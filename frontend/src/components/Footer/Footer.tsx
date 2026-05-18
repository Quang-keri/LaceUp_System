import { FaFacebook, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#9156F1] text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* CONTACT */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white tracking-wide">
              Liên hệ với chúng tôi
            </h3>

            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>Email: werelacezone@gmail.com</p>
              <p>Địa chỉ: Thành phố Hồ Chí Minh</p>
              <p>Hotline: 0909 999 999</p>
            </div>
          </div>

          {/* SPORTS */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white tracking-wide">
              Nền tảng thể thao
            </h3>

            <ul className="space-y-3 text-sm text-gray-300">
              <li className="hover:text-[#cf9c5d] transition cursor-pointer">
                Bóng đá
              </li>

              <li className="hover:text-[#cf9c5d] transition cursor-pointer">
                Cầu lông
              </li>

              <li className="hover:text-[#cf9c5d] transition cursor-pointer">
                Pickleball
              </li>

              <li className="hover:text-[#cf9c5d] transition cursor-pointer">
                Các môn thể thao khác
              </li>
            </ul>
          </div>

          {/* POLICY */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white tracking-wide">
              Chính sách
            </h3>

            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <Link
                  to="/info/policies"
                  className="hover:text-[#cf9c5d] transition"
                >
                  Nguyên tắc cộng đồng
                </Link>
              </li>

              <li>
                <Link
                  to="/info/terms"
                  className="hover:text-[#cf9c5d] transition"
                >
                  Điều khoản dịch vụ
                </Link>
              </li>

              <li>
                <Link
                  to="/create-rental-area"
                  className="hover:text-[#cf9c5d] transition"
                >
                  Đăng sân của bạn
                </Link>
              </li>

              <li>
                <Link
                  to="/info/about-us"
                  className="hover:text-[#cf9c5d] transition"
                >
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white tracking-wide">
              Tham gia cùng chúng tôi
            </h3>

            <p className="text-sm text-gray-300 mb-5 leading-relaxed">
              Theo dõi chúng tôi trên mạng xã hội để cập nhật các sân thể thao
              mới và ưu đãi hấp dẫn.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg hover:scale-110 hover:bg-blue-700 transition-all duration-300 shadow-lg"
              >
                <FaFacebook />
              </a>

              <a
                href="#"
                className="w-11 h-11 rounded-xl bg-pink-500 flex items-center justify-center text-white text-lg hover:scale-110 hover:bg-pink-600 transition-all duration-300 shadow-lg"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-slate-700 mt-12 pt-6 text-center">
          <p className="text-sm text-gray-400 tracking-wide">
            © 2026 LaceUp. Bản quyền đã được bảo hộ.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

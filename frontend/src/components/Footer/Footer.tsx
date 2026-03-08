import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-[1200px] mx-auto grid grid-cols-5 gap-8 py-12 px-6">
        <div>
          <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
          <p className="text-sm text-gray-400">Email: support@LaceUp.com</p>
          <p className="text-sm text-gray-400">Phone: +84 123 456 789</p>
          <p className="text-sm text-gray-400">Address: Ho Chi Minh City</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Platform</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Football</li>
            <li>Badminton</li>
            <li>Pickleball</li>
            <li>Running</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Policy</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Privacy Policy</li>
            <li>Return Policy</li>
            <li>Shipping Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">About Us</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Our Story</li>
            <li>Our Mission</li>
            <li>Careers</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">Join Us</h3>
          <p className="text-gray-400 text-sm mb-3">
            Follow us on social media
          </p>

          <div className="flex gap-4 text-xl">
            <FaFacebook className="cursor-pointer hover:text-[#cf9c5d]" />
            <FaInstagram className="cursor-pointer hover:text-[#cf9c5d]" />
            <FaTwitter className="cursor-pointer hover:text-[#cf9c5d]" />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-gray-400 text-sm">
        © 2026 SportStore. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;

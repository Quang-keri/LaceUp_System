import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

import "./FishAnimation.scss";
import tennis from "../../../assets/tennis.jpg";
import payos from "../../../assets/payos_2.jpg";
import comnunity from "../../../assets/comunity.png";
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Định nghĩa dữ liệu cho các Content Sections
const sectionData = [
  {
    t: "Sân bãi chuẩn quốc tế",
    c: "Hệ thống thảm và ánh sáng chuyên nghiệp.",
    // ĐỔI 1: Tự thêm đường dẫn ảnh vào đây (ví dụ: /images/court.jpg)
    imageSrc: tennis,
  },
  {
    t: "Thanh toán 1 chạm",
    c: "Tích hợp Payos, Momo, VNPay tiện lợi.",
    imageSrc: payos,
  },
  {
    t: "Cộng đồng năng động",
    c: "Dễ dàng tìm đối thủ cùng trình độ.",
    imageSrc: comnunity,
  },
];

export default function SportsBookingLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const rx = window.innerWidth < 1000 ? window.innerWidth / 1200 : 1;
    const ry = window.innerHeight < 700 ? window.innerHeight / 1200 : 1;

    const path = [
      { x: 800 * rx, y: 200 * ry },
      { x: 1100 * rx, y: 100 * ry },
      { x: 10 * rx, y: 500 * ry },
      { x: 500 * rx, y: 400 * ry },
      { x: 1000 * rx, y: 200 * ry },
      { x: 400 * rx, y: 400 * ry },
      { x: 1100 * rx, y: 500 * ry },
    ];

    const ctx = gsap.context(() => {
      gsap.ticker.add(() => {
        if (!fishRef.current || !labelRef.current) return;

        const rotX = gsap.getProperty(fishRef.current, "rotationX");
        const rotY = gsap.getProperty(fishRef.current, "rotationY");
        const rotZ = gsap.getProperty(fishRef.current, "rotation");

        gsap.set(labelRef.current, {
          rotationX: -rotX,
          rotationY: -rotY,
          rotation: -rotZ,
        });
      });
      // Logic bọt khí (không đổi)
      const bubbles = gsap.timeline({ paused: true });
      bubbles.set(".bubbles__bubble", { y: 100 });
      bubbles.to(".bubbles__bubble", {
        scale: 1.2,
        y: -300,
        opacity: 1,
        duration: 2,
        stagger: 0.2,
      });
      bubbles.to(
        ".bubbles__bubble",
        { scale: 1, opacity: 0, duration: 1 },
        "-=1",
      );

      // Timeline di chuyển cá (không đổi)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });

      tl.to(indicatorRef.current, { opacity: 0 }, 0)
        .to(
          fishRef.current,
          {
            motionPath: {
              path,
              align: "self",
              alignOrigin: [0.5, 0.5],
              autoRotate: true,
            },
            duration: 10,
            immediateRender: true,
          },
          0,
        )
        .to(fishRef.current, { rotateX: 180 }, 1)
        .to(fishRef.current, { z: -300, duration: 2 }, 2.5);

      // ĐỔI 2: Logic GSAP cho Content Sections & Dynamic Images
      const sections = gsap.utils.toArray(".scroll-section");
      sections.forEach((section: any) => {
        const text = section.querySelector(".content-text");
        const image = section.querySelector(".content-image");

        // Khởi tạo text và image ở trạng thái mờ và lệch
        gsap.set(text, { opacity: 0, y: 50 });
        gsap.set(image, { opacity: 0, scale: 0.8, x: -100 });

        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          onEnter: () => {
            // Text fade-in và slide-in từ dưới lên
            gsap.to(text, { opacity: 1, y: 0, duration: 0.8 });

            // Image fade-in, slide-in từ trái sang và scale-up
            gsap.to(image, {
              opacity: 1,
              scale: 1,
              x: 0,
              duration: 1,
              ease: "power2.out",
              delay: 0.2,
            });

            // Restart bọt khí
            bubbles.restart();
          },
          onLeave: () => {
            // Text fade-out
            gsap.to(text, { opacity: 0, y: -50 });

            // Image fade-out nhanh hơn một chút
            gsap.to(image, { opacity: 0, scale: 0.9, x: 50, duration: 0.5 });
          },
          onEnterBack: () => {
            // Text fade-in khi cuộn ngược lại
            gsap.to(text, { opacity: 1, y: 0 });

            // Image fade-in khi cuộn ngược lại
            gsap.to(image, {
              opacity: 1,
              scale: 1,
              x: 0,
              duration: 1,
              ease: "power2.out",
            });
          },
          onUpdate: (self) => {
            // Quay mặt cá theo hướng cuộn (không đổi)
            gsap.to(fishRef.current, {
              rotationY: self.direction === -1 ? 180 : 0,
              duration: 0.4,
            });
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);
  useEffect(() => {
    document.body.classList.add("landing-body");
    return () => {
      document.body.classList.remove("landing-body");
    };
  }, []);
  return (
    <div ref={containerRef} className="relative text-white overflow-x-hidden">
      {/* CON CÁ MASCOT */}
      <div className="fish-wrapper fixed inset-0 pointer-events-none z-50 overflow-hidden perspective-[100rem]">
        <div ref={fishRef} className="fish absolute top-0 left-0 w-32 h-32">
          <div className="fish__inner">
            <div className="fish__label" ref={labelRef}>
              lace up
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="fish__body"></div>
            ))}
            <div className="fish__head"></div>
            <div className="fish__head fish__head--2"></div>
            <div className="fish__head fish__head--3"></div>
            <div className="fish__head fish__head--4"></div>
            <div className="fish__tail-main"></div>
            <div className="fish__tail-fork"></div>
            <div className="fish__fin"></div>
            <div className="fish__fin fish__fin--2"></div>
          </div>
        </div>
      </div>
      {/* HERO SECTION (Giữ nguyên) */}
      <div className="relative z-10 h-screen flex flex-col justify-center items-center px-6">
        <h1 className="text-6xl md:text-8xl font-black text-center mb-6 tracking-tighter">
          <span className="text-[#9156F1]">LACE</span>{" "}
          <span className="text-[#B0DF94]">UP</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 font-medium">
          Đỉnh cao đặt sân – Cầu lông, Bóng đá & Pickleball
        </p>
        <div className="w-full max-w-4xl bg-white backdrop-blur-md p-5 rounded-[2rem] shadow-[0_15px_40px_rgba(145,86,241,0.08)] border border-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Môn chơi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 tracking-wider">
                Môn chơi
              </label>
              {/* THÊM text-gray-900 VÀO ĐÂY */}
              <select className="bg-white text-gray-900 border border-gray-100 rounded-xl p-3 text-sm shadow-sm focus:ring-2 ring-[#9156F1] outline-none cursor-pointer">
                <option>Cầu lông</option>
                <option>Bóng đá</option>
                <option>Pickleball</option>
              </select>
            </div>

            {/* Khu vực */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 tracking-wider">
                Khu vực
              </label>
              {/* THÊM text-gray-900 VÀO ĐÂY */}
              <select className="bg-white text-gray-900 border border-gray-100 rounded-xl p-3 text-sm shadow-sm focus:ring-2 ring-[#9156F1] outline-none cursor-pointer">
                <option>Quận 1, HCM</option>
                <option>Cầu Giấy, HN</option>
              </select>
            </div>

            {/* Ngày chơi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 tracking-wider">
                Ngày chơi
              </label>
              {/* THÊM text-gray-900 VÀO ĐÂY */}
              <input
                type="date"
                className="bg-white text-gray-900 border border-gray-100 rounded-xl p-3 text-sm shadow-sm focus:ring-2 ring-[#9156F1] outline-none"
              />
            </div>

            {/* Nút bấm (Giữ nguyên text-white vì nền nút màu tím) */}
            <div className="flex items-end">
              <button className="w-full h-[48px] bg-[#9156F1] text-white rounded-xl text-sm font-bold hover:bg-[#7a3ee0] transition-all shadow-md shadow-[#9156F1]/20">
                Tìm sân ngay
              </button>
            </div>
          </div>
        </div>
        <div
          ref={indicatorRef}
          className="absolute bottom-10 animate-bounce text-[#9156F1]/60"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
      {/* ĐỔI 3: Cấu trúc Content Sections để chứa ảnh & text */}
      <div className="relative z-10 py-20">
        {" "}
        {/* Thêm padding trên dưới cho cả vùng chứa */}
        {sectionData.map((item, i) => (
          <section
            key={i}
            /* THAY ĐỔI: Bỏ h-screen, thay bằng py-12 (khoảng cách giữa các section) */
            className="scroll-section py-12 md:py-20 flex items-center justify-center px-6"
          >
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-6xl w-full">
              {/* KHỐI ẢNH: Thu nhỏ lại một chút để thanh thoát hơn */}
              <div className="content-image flex-1 w-full max-w-sm md:max-w-md">
                <img
                  src={item.imageSrc}
                  alt={item.t}
                  className="w-full h-[350px] md:h-[450px] object-cover rounded-[2.5rem] shadow-xl shadow-purple-900/10 border border-white"
                />
              </div>

              {/* KHỐI VĂN BẢN: Giảm padding p-12 xuống p-8 hoặc p-10 */}
              <div className="content-text bg-white flex-1 p-8 md:p-12 rounded-[2.5rem] shadow-[0_10px_40px_rgba(145,86,241,0.05)] border border-white text-center md:text-left backdrop-blur-md">
                <h2 className="text-3xl md:text-5xl font-bold text-[#9156F1] mb-4 tracking-tighter">
                  {item.t}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  {item.c}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
      <div className="h-[50vh] flex flex-col items-center justify-center relative z-10">
        <h2 className="text-4xl font-black mb-8">Sẵn sàng ra sân?</h2>
        <button className="bg-gradient-to-r from-[#9156F1] to-[#D4A3E8] text-white px-12 py-5 rounded-full font-bold text-xl shadow-xl shadow-[#9156F1]/20 hover:scale-105 transition">
          ĐẶT SÂN NGAY
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import SportsBookingLanding from "./SportsBookingLanding"; // File landing page cũ

export default function LandingPage() {
  const [isStarted, setIsStarted] = useState(false);
  const welcomeRef = useRef(null);
  const contentRef = useRef(null);

  const handleStart = () => {
    const tl = gsap.timeline({
      onComplete: () => setIsStarted(true), // Sau khi biến mất thì xóa hẳn Welcome Page
    });

    // Hiệu ứng chuyển cảnh "ngầu"
    tl.to(".welcome-text", { y: -50, opacity: 0, duration: 0.5 })
      .to(".start-btn", { scale: 0, opacity: 0, duration: 0.3 }, "-=0.3")
      .to(welcomeRef.current, {
        clipPath: "circle(0% at 50% 50%)", // Hiệu ứng thu nhỏ vòng tròn
        duration: 1,
        ease: "expo.inOut",
      });
  };

  return (
    <div className="relative overflow-hidden">
      {/* 1. WELCOME PAGE OVERLAY */}
      {!isStarted && (
        <div
          ref={welcomeRef}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#9156F1] text-white"
        >
          <div className="welcome-text text-center">
            <h1 className="text-7xl font-black tracking-tighter mb-4 italic">
              LACE <span className="text-[#B0DF94]">UP</span>
            </h1>
            <p className="text-purple-200 mb-8 uppercase tracking-[0.3em] text-sm">
              Chuẩn bị chơi thể thao chưa?
            </p>
          </div>

          <button
            onClick={handleStart}
            className="start-btn group relative px-12 py-4 bg-[#B0DF94] text-[#1A1A1A] font-bold rounded-full overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-2xl"
          >
            <span className="relative z-10">BẮT ĐẦU TRẢI NGHIỆM</span>
            <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          </button>

          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#B0DF94]/20 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* 2. MAIN INTERFACE (GSAP LANDING) */}
      <div
        ref={contentRef}
        className={`${!isStarted ? "h-screen overflow-hidden" : ""}`}
      >
        <SportsBookingLanding />
      </div>
    </div>
  );
}

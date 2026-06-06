import AppHeader from "../../components/Header/Header";
import { Outlet } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import ChatboxBubble from "../../page/customer/chat-box/ChatBoxBubble";
import ScrollToTop from "../../components/scoll/ScrollToTop";

export default function DefaultLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <ScrollToTop />

      <div className="shrink-0">
        <AppHeader />
      </div>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

      <div className="shrink-0 relative z-[60]">
        <Footer />
      </div>

      <ChatboxBubble />
    </div>
  );
}

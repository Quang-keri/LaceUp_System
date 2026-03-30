import AppHeader from "../../components/Header/Header";
import { Outlet } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import ChatBubble from "../../page/customer/chat/ChatBubble";
import ScrollToTop from "../../components/scoll/ScrollToTop";

export default function DefaultLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />
      <AppHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <ChatBubble />
    </div>
  );
}

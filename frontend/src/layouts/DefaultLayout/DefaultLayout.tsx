import AppHeader from "../../components/Header/Header";
import { Outlet } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import ChatBubble from "../../page/customer/chat/ChatBubble";
import ChatboxBubble from "../../page/customer/chat-box/ChatBoxBubble";

export default function DefaultLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AppHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <ChatboxBubble />
      <ChatBubble />
    </div>
  );
}

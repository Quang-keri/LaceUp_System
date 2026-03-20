import AppHeader from "../../components/Header/Header";
import { Outlet } from "react-router-dom";
import Footer from "../../components/Footer/Footer";
import ChatBubble from "../../page/customer/chat/ChatBubble"

export default function DefaultLayout() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AppHeader />
      
      <Outlet />
      
      <Footer />

      <ChatBubble />
    </div>
  );
}
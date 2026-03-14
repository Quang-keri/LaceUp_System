import AppHeader from "../../components/Header/Header";
import { Outlet } from "react-router-dom";
import Footer from "../../components/Footer/Footer";

export default function DefaultLayout() {
  return (
    <div>
      <AppHeader />
      <Outlet />
      <Footer />
    </div>
  );
}

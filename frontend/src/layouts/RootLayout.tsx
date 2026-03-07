import AppHeader from "../components/Header/Header";
import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div>
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

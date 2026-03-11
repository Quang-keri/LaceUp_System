import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import LoginPage from "../page/customer/LoginPage/LoginPage.tsx";
import PostPage from "../page/customer/post/PostPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    handle: { breadcrumb: "Trang chủ" },
    children: [
      {
        path: "/login",
        element: <LoginPage />,
        handle: { breadcrumb: "Đăng nhập" },
      },
      {
        path: "danh-sach-san",
        element: <PostPage />,
      },
    ],
  },
]);

import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import LoginPage from "../page/customer/LoginPage/LoginPage";
import PostPage from "../page/customer/post/PostPage";
import OwnerLayout from "../layouts/OwnerLayout/OwnerLayout";
import LandingPage from "../page/customer/LandingPage/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
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
  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [],
  },
]);

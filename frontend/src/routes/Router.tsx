import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";
import OwnerLayout from "../layouts/OwnerLayout/OwnerLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [],
  },
  {
    path: "/owner",
    element: <OwnerLayout />,
    children: [],
  },
]);

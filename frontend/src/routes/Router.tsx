import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout/DefaultLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
  },
]);

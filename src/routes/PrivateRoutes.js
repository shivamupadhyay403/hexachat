import React from "react";
const Dashboard = React.lazy(() => import("../pages/Auth/Dashboard"));
export const PrivateRoutes = [
  {
    key: "user-dashbpard",
    path: "/user/dashboard",
    Component: Dashboard,
  },
];

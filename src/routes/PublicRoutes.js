import React from "react";
const LoginForm = React.lazy(() => import("../pages/UnAuth/LoginForm"));
const RegisterForm = React.lazy(() => import("../pages/UnAuth/RegisterForm"));
export const PublicRoutes = [
  {
    key: "loginpage",
    path: "/",
    Component: LoginForm,
  },
  {
    key: "registerpage",
    path: "/register",
    Component: RegisterForm,
  },
];

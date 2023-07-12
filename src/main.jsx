import React from "react";
import ReactDOM from "react-dom/client";
import ErrorPage from "./pages/ErrorPage.jsx";
import App from "./App.jsx";
import LoginPage from "./pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ForgotPassword from "./pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import ResetPassword from "./pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import HomePage from "./pages/Home/HomePage.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import DashBoard from "./pages/Authentication/pages/DashBoard/DashBoard.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <ErrorPage/>
  },
  {
    path: "/login",
    element: <LoginPage />,
    // errorElement: <ErrorPage/>
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    // errorElement: <ErrorPage/>
  },  
  {
    path: "/reset-password",
    element: <ResetPassword />,
    // errorElement: <ErrorPage/>
  },  
  {
    path: "/dashboard",
    element: <DashBoard />,
    // errorElement: <ErrorPage/>
  },  
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

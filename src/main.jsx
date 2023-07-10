import React from "react";
import ReactDOM from "react-dom/client";
import ErrorPage from "./pages/ErrorPage.jsx";
import App from "./App.jsx";
import LoginPage from "./pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ForgotPassword from "./pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import ResetPassword from "./pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

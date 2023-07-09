import React from "react";
import ReactDOM from "react-dom/client";
import ErrorPage from "./pages/ErrorPage.jsx";
import App from "./App.jsx";
import LoginPage from "./pages/Authentication/pages/Login/LoginPage.jsx";
import ForgotPassword from "./pages/Authentication/pages/Login/ForgotPassword.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Authentication from "./pages/Authentication/Authentication.jsx";
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
    path: "/authentication",
    element: <Authentication />,
    children:[
      {index:true, element:LoginPage},
      {
        path:"login",
        element:<LoginPage/>
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

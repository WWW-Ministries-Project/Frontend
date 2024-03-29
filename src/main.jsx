import React from "react";
import ReactDOM from "react-dom/client";
import ErrorPage from "./pages/ErrorPage.jsx";
import App from "./App.jsx";
import LoginPage from "./pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ForgotPassword from "./pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import ResetPassword from "./pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import DashBoard from "./pages/HomePage/pages/DashBoard/DashBoard.jsx";
import HomePage from "./pages/HomePage/HomePage.jsx";
import UnderConstruction from "./pages/UnderConstruction/UnderConstruction.jsx";
import Members from "./pages/HomePage/pages/Members/Members.jsx";
import Settings from "./pages/HomePage/pages/Settings/Settings.jsx";
import AssetManagement from "./pages/HomePage/pages/AssetsManagement/AssetManagement.jsx";



const router = createBrowserRouter([
  // {
  //   path: "/",
  //   element: <LandingPage />,
  //   errorElement: <ErrorPage/>
  // },
  {
    path: "/",
    element: <LoginPage />,
    errorElement: <ErrorPage/>
  },
  {
    path: "/login",
    element: <LoginPage />,
    
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    
  },  
  {
    path: "/reset-password",
    element: <ResetPassword />,
    
  },  
  {
    path: "/home",
    element: <HomePage />,
    children: [
      {
        path: "",
        element: <DashBoard />,
      },
      {
        path: "dashboard",
        element: <DashBoard />,
      },
      {
        path: "members",
        element: <Members />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "Assets management",
        element: <AssetManagement />,
      },
      {
        path: "*",
        element: <UnderConstruction />,
      },
    ]
    
  },  
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

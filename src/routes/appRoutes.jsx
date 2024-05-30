import ForgotPassword from "../pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import LoginPage from "../pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ResetPassword from "../pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import ErrorPage from "../pages/ErrorPage.jsx";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import HomePage from "../pages/HomePage/HomePage.jsx";
import AssetManagement from "../pages/HomePage/pages/AssetsManagement/AssetManagement.jsx";
import DashBoard from "../pages/HomePage/pages/DashBoard/DashBoard.jsx";
import Members from "../pages/HomePage/pages/Members/Members.jsx";
import Settings from "../pages/HomePage/pages/Settings/Settings.jsx";
import UnderConstruction from "../pages/UnderConstruction/UnderConstruction.jsx";



export const routes = [
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
    isPrivate: true,
    
  },  
  {
    path: "/reset-password",
    element: <ResetPassword />,
    isPrivate: true,
    
  },  
  {
    path: "/home",
    element: <HomePage />,
    isPrivate: true,
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
];
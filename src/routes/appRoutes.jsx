import ProfileDetails from "/src/pages/HomePage/pages/ProfileDetails/ProfileDetails.jsx";
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
import MemberInformation from "/src/pages/HomePage/pages/ProfileDetails/pages/MemberInformation.jsx";
import MembersAssets from "/src/pages/HomePage/pages/ProfileDetails/pages/MembersAssets.jsx";



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
    
  },  
  {
    path: "/reset-password",
    element: <ResetPassword />,
    
  },  
  {
    path: "/home",
    element: <HomePage />,
    // isPrivate: true,
    children: [
      {
        path: "",
        element: <DashBoard />,
        isPrivate: true,
        permissionNeeded: "view_Dashboard",
      },
      {
        path: "dashboard",
        element: <DashBoard />,
        isPrivate: true,
        permissionNeeded: "view_Dashboard",
      },
      {
        path: "members",
        element: <Members />,
        isPrivate: true,
        permissionNeeded: "view_Members",
      },
      {
        path: "member/:id",
        element: <ProfileDetails />,
        isPrivate: true,
        permissionNeeded: "view_Members",
        children: [
          {
            path: "",
            element: <MemberInformation />,
            isPrivate: true,
            permissionNeeded: "view_Members",
          },
          {
            path: "assets",
            element: <MembersAssets />,
            isPrivate: true,
            permissionNeeded: "view_Members",
          },
        ]
      },
      {
        path: "settings",
        element: <Settings />,
        isPrivate: true,
        permissionNeeded: "view_Settings",
      },
      {
        path: "Assets management",
        element: <AssetManagement />,
        isPrivate: true,
        permissionNeeded: "view_Assets",
      },
      {
        path: "*",
        element: <UnderConstruction />,
      },
    ]
    
  },  
];
import ProfileDetails from "@/pages/HomePage/pages/Members/pages/ProfileDetails";
import ForgotPassword from "../pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import LoginPage from "../pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ResetPassword from "../pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import ErrorPage from "../pages/ErrorPage.jsx";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import CreateEvent from "@/pages/HomePage/pages//EventsManagement/pages/CreateEvent.jsx";
import EventRegister from "@/pages/HomePage/pages//EventsManagement/pages/EventRegister.jsx";
import AddAsset from "@/pages/HomePage/pages/AssetsManagement/pages/AddAssets.jsx";
import EventsManagement from "@/pages/HomePage/pages/EventsManagement/EventsManagement.jsx";
import ViewEvent from "@/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx";
import Requisitions from "@/pages/HomePage/pages/Requisitions/Requisitions.tsx";
import Request from "@/pages/HomePage/pages/Requisitions/pages/Request.tsx";
import RequestDetails from "@/pages/HomePage/pages/Requisitions/pages/RequestDetails.tsx";
import UserManagement from "@/pages/HomePage/pages/Users/UserManagement";
import HomePage from "../pages/HomePage/HomePage";
import AssetManagement from "../pages/HomePage/pages/AssetsManagement/AssetManagement.jsx";
import DashBoard from "../pages/HomePage/pages/DashBoard/DashBoard";
import Members from "../pages/HomePage/pages/Members/Members";
import AddMember from "../pages/HomePage/pages/Members/pages/AddMember";
import Settings from "../pages/HomePage/pages/Settings/Settings.jsx";
import UnderConstruction from "../pages/UnderConstruction/UnderConstruction.jsx";
import MemberInformation from "/src/pages/HomePage/pages/Members/pages/MemberInformation.jsx";
import MembersAssets from "/src/pages/HomePage/pages/Members/pages/MembersAssets.jsx";


export const routes = [
  // {
  //   path: "/",
  //   element: <LandingPage />,
  //   errorElement: <ErrorPage/>
  // },
  {
    path: "/",
    element: <LoginPage />,
    errorElement: <ErrorPage />
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
        name: "Dashboard",
        element: <DashBoard />,
        isPrivate: true,
        permissionNeeded: "view_Dashboard",
        sideTab: true,
      },
      {
        path: "members",
        name: "Members",
        element: <Members />,
        isPrivate: true,
        permissionNeeded: "view_Members",
        sideTab: true,
      },
      {
        path: "members/add-member",
        element: <AddMember />,
        isPrivate: true,
        permissionNeeded: "view_Members",
      },
      {
        path: "members/:id",
        element: <ProfileDetails />,
        isPrivate: true,
        permissionNeeded: "view_Members",
        children: [
          {
            path: "info",
            name: "Info",
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
        path: "events",
        name: "Events",
        element: <EventsManagement />,
        isPrivate: true,
        permissionNeeded: "view_Events",
        sideTab: true,
      },
      {
        path: "manage-event",
        element: <CreateEvent />,
        isPrivate: true,
        permissionNeeded: "view_Events",
      },
      {
        path: "events/view-event",
        element: <ViewEvent />,
        isPrivate: true,
        permissionNeeded: "view_Events",
      },
      
      {
        path: "requests",
        name: "Requests",
        isPrivate: true,
        permissionNeeded: "view_Events",
        sideTab: true,
        children: [
          {
            path: "",
            name: "My Requests",
            element: <Requisitions />,
            isPrivate: false,
            sideTab: true
          },
          {
            path: "my_requests/:id",
            name: "Requests Details",
            element: <RequestDetails />,
            isPrivate: false,
            sideTab: false,
          },
          {
            path: "my_requests/request",
            name: "Request",
            element: <Request />,
            isPrivate: false,
            sideTab: false
          },
          {
            path: "staff_requests",
            name: "Staff Requests",
            element: <Requisitions />,
            sideTab: true
          },
          {
            path: "suppliers",
            name: "Suppliers",
            element: <UserManagement />,
            sideTab: true
          },
        ]
      },
      
      {
        path: "Assets",
        name: "Assets",
        element: <AssetManagement />,
        isPrivate: true,
        permissionNeeded: "view_Assets",
        sideTab: true,
      },
      {
        path: "Assets/add-asset",
        element: <AddAsset />,
        isPrivate: true,
        permissionNeeded: "view_Assets",
      },
      {
        path: "users",
        name: "Users",
        element: <UserManagement />,
        isPrivate: true,
        permissionNeeded: "view_Events",
        sideTab: true,
      },
      {
        path: "settings",
        name: "Settings",
        element: <Settings />,
        isPrivate: true,
        permissionNeeded: "view_Settings",
        sideTab: true,
      },
      {
        path: "*",
        element: <UnderConstruction />,
      },
    ]

  },
  {
    path: "events/register-event",
    element: <EventRegister />,
    isPrivate: false
  },
];

// const permissions = useUserStore((state) => state.permissions);
const homePageRoute = routes?.find(route => route.path === "/home");
const homePageChildren = homePageRoute?.children || [];
export const sideTabs = homePageChildren.filter(childRoute => childRoute.sideTab && ({ name: childRoute.name, path: childRoute.path }));
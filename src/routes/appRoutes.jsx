import ProfileDetails from "@/pages/HomePage/pages/Members/pages/ProfileDetails";
import ForgotPassword from "../pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import LoginPage from "../pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ResetPassword from "../pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import ErrorPage from "../pages/ErrorPage.jsx";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import CreateEvent from "@/pages/HomePage/pages//EventsManagement/pages/CreateEvent";
import EventRegister from "@/pages/HomePage/pages//EventsManagement/pages/EventRegister.jsx";
import ManageAsset from "@/pages/HomePage/pages/AssetsManagement/pages/ManageAssets";
import EventsManagement from "@/pages/HomePage/pages/EventsManagement/EventsManagement";
import ViewEvent from "@/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx";
import Requisitions from "@/pages/HomePage/pages/Requisitions/pages/Requisitions";
import Request from "@/pages/HomePage/pages/Requisitions/pages/Request.tsx";
import RequestDetails from "@/pages/HomePage/pages/Requisitions/pages/RequestDetails.tsx";
import UserManagement from "@/pages/HomePage/pages/Users/UserManagement";
import HomePage from "../pages/HomePage/HomePage";
import AssetManagement from "../pages/HomePage/pages/AssetsManagement/AssetManagement";
import DashBoard from "../pages/HomePage/pages/DashBoard/DashBoard";
import Members from "../pages/HomePage/pages/Members/Members";
import AddMember from "../pages/HomePage/pages/Members/pages/AddMember";
import Settings from "../pages/HomePage/pages/Settings/Settings.jsx";
import UnderConstruction from "../pages/UnderConstruction/UnderConstruction.jsx";
import MemberInformation from "/src/pages/HomePage/pages/Members/pages/MemberInformation";
import MembersAssets from "/src/pages/HomePage/pages/Members/pages/MembersAssets.jsx";
import AccessRights from "@/pages/HomePage/pages/Settings/pages/AccessRights";
import CreateAccess from "@/pages/HomePage/pages/Settings/pages/CreateAccess";
import ViewUser from "@/pages/HomePage/pages/Users/pages/ViewUser";
import MyRequisitions from "@/pages/HomePage/pages/Requisitions/pages/MyRequests";
import MinistrySchool from "@/pages/HomePage/pages/MinistrySchool/MinistrySchool";
import ViewProgram from "@/pages/HomePage/pages/MinistrySchool/pages/ViewProgram";
import ViewCohort from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCohort";
import ViewClass from "@/pages/HomePage/pages/MinistrySchool/pages/ViewClass";
import ViewStudent from "@/pages/HomePage/pages/MinistrySchool/pages/ViewStudent";
import ViewCertificate from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCertificate";
import Registration from "@/pages/Registration/Registration";


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
        isPrivate: false,
        permissionNeeded: "view_dashboard",
      },
      {
        path: "dashboard",
        name: "Dashboard",
        element: <DashBoard />,
        isPrivate: false,
        permissionNeeded: "view_dashboard",
        sideTab: true,
      },
      {
        path: "members",
        name: "Members",
        element: <Members />,
        isPrivate: false,
        permissionNeeded: "view_members",
        sideTab: true,
      },
      {
        path: "members/add-member",
        element: <AddMember />,
        isPrivate: false,
        permissionNeeded: "view_members",
      },
      {
        path: "members/:id",
        element: <ProfileDetails />,
        isPrivate: false,
        permissionNeeded: "view_members",
        children: [
          {
            path: "info",
            name: "Info",
            element: <MemberInformation />,
            isPrivate: false,
            permissionNeeded: "view_members",
          },
          {
            path: "assets",
            element: <MembersAssets />,
            isPrivate: false,
            permissionNeeded: "view_members",
          },
        ]
      },
      {
        path: "events",
        name: "Events",
        element: <EventsManagement />,
        isPrivate: false,
        permissionNeeded: "view_events",
        sideTab: true,
      },
      {
        path: "manage-event",
        element: <CreateEvent />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      {
        path: "events/view-event",
        element: <ViewEvent />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },

      {
        path: "requests",
        name: "Requests",
        isPrivate: false,
        permissionNeeded: "view_events",
        sideTab: true,
        children: [
          {
            path: "",
            name: "My Requests",
            element: <MyRequisitions />,
            isPrivate: false,
            sideTab: true
          },
          {
            path: ":id",
            name: "Requests Details",
            element: <RequestDetails />,
            isPrivate: false,
            sideTab: false,
          },
          {
            path: "request",
            name: "Request",
            element: <Request />,
            isPrivate: false,
            sideTab: false
          },
          {
            path: "request/:id",
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
            sideTab: false
          },
        ]
      },

      {
        path: "assets",
        name: "Assets",
        element: <AssetManagement />,
        isPrivate: false,
        permissionNeeded: "view_assets",
        sideTab: true,
      },
      {
        path: "assets/manage-asset",
        element: <ManageAsset />,
        isPrivate: false,
        permissionNeeded: "view_assets",
      },
      {
        path: "users",
        name: "Users",
        element: <UserManagement />,
        isPrivate: false,
        permissionNeeded: "view_events",
        sideTab: true,
      },
      {
        path: "users/:id/info",
        name: "View User",
        element: <ViewUser />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      
      {
        path: "ministry-school",
        name: "School of Ministry",
        element: <MinistrySchool />,
        isPrivate: false,
        permissionNeeded: "view_events",
        sideTab: true,
      },
      {
        path: "ministry-school/programs/:id",
        name: "View Program",
        element: <ViewProgram />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      {
        path: "ministry-school/programs/:id/cohort/:id",
        name: "View Cohort",
        element: <ViewCohort />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      {
        path: "ministry-school/programs/:id/cohort/:id/class/:id",
        name: "View Class",
        element: <ViewClass />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      {
        path: "ministry-school/programs/:id/cohort/:id/class/:id/student/:id",
        name: "View Student",
        element: <ViewStudent />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      {
        path: "ministry-school/programs/cohort/class/student/certificate",
        name: "View Certificate",
        element: <ViewCertificate />,
        isPrivate: false,
        permissionNeeded: "view_events",
      },
      {
        path: "settings",
        name: "Settings",
        isPrivate: false,
        permissionNeeded: "view_departments",
        sideTab: true,
        children: [
          {
            path: "",
            alias: "departments",
            name: "General configuration",
            element: <Settings />,
            isPrivate: false,
            permissionNeeded: "view_departments",
            sideTab: true,
          },
          {
            path: "access-rights",
            name: "Access Rights",
            element: <AccessRights />,
            isPrivate: false,
            permissionNeeded: "view_access_rights",
            sideTab: true,
          },
          {
            path: "create-access",
            name: "Create Access",
            element: <CreateAccess />,
            isPrivate: false,
            permissionNeeded: "view_access_rights",
            sideTab: false,
          },
        ]
      },
      {
        path: "*",
        element: <UnderConstruction />,
      },
    ]

  },
  {
    path: "/register-member",
    element: <Registration />,
    isPrivate: false
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
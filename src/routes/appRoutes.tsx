import { ProfileDetails } from "@/pages/HomePage/pages/Members/pages/ProfileDetails";
import ForgotPassword from "../pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import LoginPage from "../pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ResetPassword from "../pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import ErrorPage from "../pages/ErrorPage.jsx";
// import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import CreateEvent from "@/pages/HomePage/pages//EventsManagement/pages/CreateEvent";
import EventRegister from "@/pages/HomePage/pages//EventsManagement/pages/EventRegister.jsx";
import ManageAsset from "@/pages/HomePage/pages/AssetsManagement/pages/ManageAssets";
import DashBoardPage from "@/pages/HomePage/pages/DashBoard/DashboardPage";
import EventsManagement from "@/pages/HomePage/pages/EventsManagement/EventsManagement";
import ViewEvent from "@/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx";
import MinistrySchool from "@/pages/HomePage/pages/MinistrySchool/MinistrySchool";
import ViewCertificate from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCertificate";
import { ViewClass } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewClass";
import ViewCohort from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCohort";
import ViewProgram from "@/pages/HomePage/pages/MinistrySchool/pages/ViewProgram";
import ViewStudent from "@/pages/HomePage/pages/MinistrySchool/pages/ViewStudent";
import MyRequisitions from "@/pages/HomePage/pages/Requisitions/pages/MyRequests";
import Request from "@/pages/HomePage/pages/Requisitions/pages/Request";
import RequestDetails from "@/pages/HomePage/pages/Requisitions/pages/RequestDetails";
import Requisitions from "@/pages/HomePage/pages/Requisitions/pages/Requisitions";
import AccessRights from "@/pages/HomePage/pages/Settings/pages/AccessRights";
import CreateAccess from "@/pages/HomePage/pages/Settings/pages/CreateAccess";
import ViewUser from "@/pages/HomePage/pages/Users/pages/ViewUser";
import UserManagement from "@/pages/HomePage/pages/Users/UserManagement";
// import VisitorDetails from "@/pages/HomePage/pages/VisitorManagement/pages/VisitorDetails";
import { MemberInformation } from "@/pages/HomePage/pages/Members/pages/MemberInformation";
import { VisitorManagement } from "@/pages/HomePage/pages/VisitorManagement/VisitorManagement";
import Registration from "@/pages/Registration/Registration";
import HomePage from "../pages/HomePage/HomePage";
import AssetManagement from "../pages/HomePage/pages/AssetsManagement/AssetManagement";
import { Members } from "../pages/HomePage/pages/Members/Members";
import { ManageMember } from "../pages/HomePage/pages/Members/pages/ManageMember";
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
    errorElement: <ErrorPage />,
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
        element: <DashBoardPage />,
        isPrivate: false,
      },
      {
        path: "dashboard",
        name: "Dashboard",
        element: <DashBoardPage />,
        isPrivate: false,
        sideTab: true,
      },
      {
        path: "members",
        name: "Members",
        element: <Members />,
        isPrivate: true,
        permissionNeeded: "view_members",
        sideTab: true,
      },
      {
        path: "members/add-member",
        element: <ManageMember />,
        isPrivate: true,
        permissionNeeded: "view_members",
      },
      {
        path: "members/:id",
        element: <ProfileDetails />,
        isPrivate: true,
        permissionNeeded: "view_members",
        children: [
          {
            path: "info",
            name: "Info",
            element: <MemberInformation />,
            isPrivate: true,
            permissionNeeded: "view_members",
          },
        ],
      },
      {
        path: "visitors",
        name: "Visitors",
        element: <VisitorManagement />,
        isPrivate: true,
        permissionNeeded: "view_members",
        sideTab: true,
      },
      // {
      //   path: "visitors/visitor/:visitorId",
      //   name: "Visitors",
      //   element: <VisitorDetails />,
      //   isPrivate: false,
      //   permissionNeeded: "view_members",
      //   sideTab: false,
      // },
      {
        path: "events",
        name: "Events",
        element: <EventsManagement />,
        isPrivate: true,
        permissionNeeded: "view_events",
        sideTab: true,
      },
      {
        path: "manage-event",
        element: <CreateEvent />,
        isPrivate: true,
        permissionNeeded: "view_events",
      },
      {
        path: "events/view-event",
        element: <ViewEvent />,
        isPrivate: true,
        permissionNeeded: "view_events",
      },

      {
        path: "requests",
        name: "Requests",
        isPrivate: true,
        permissionNeeded: "view_events",
        sideTab: true,
        children: [
          {
            path: "",
            name: "My Requests",
            element: <MyRequisitions />,
            isPrivate: true,
            sideTab: true,
          },
          {
            path: ":id",
            name: "Requests Details",
            element: <RequestDetails />,
            isPrivate: true,
            sideTab: false,
          },
          {
            path: "request",
            name: "Request",
            element: <Request />,
            isPrivate: true,
            sideTab: false,
          },
          {
            path: "request/:id",
            name: "Request",
            element: <Request />,
            isPrivate: true,
            sideTab: false,
          },
          {
            path: "staff_requests",
            name: "Staff Requests",
            element: <Requisitions />,
            sideTab: true,
          },
        ],
      },

      {
        path: "assets",
        name: "Assets",
        element: <AssetManagement />,
        isPrivate: true,
        permissionNeeded: "view_assets",
        sideTab: true,
      },
      {
        path: "assets/manage-asset",
        element: <ManageAsset />,
        isPrivate: true,
        permissionNeeded: "view_assets",
      },
      {
        path: "users",
        name: "Users",
        element: <UserManagement />,
        isPrivate: true,
        permissionNeeded: "view_users",
        sideTab: true,
      },
      {
        path: "users/:id/info",
        name: "View User",
        element: <ViewUser />,
        isPrivate: true,
        permissionNeeded: "view_events",
      },

      {
        path: "ministry-school",
        name: "School of Ministry",
        element: <MinistrySchool />,
        sideTab: true,
      },
      {
        path: "ministry-school/programs/:id",
        name: "View Program",
        element: <ViewProgram />,
      },
      {
        path: "ministry-school/programs/:id/cohort/:id",
        name: "View Cohort",
        element: <ViewCohort />,
      },
      {
        path: "ministry-school/programs/:id/cohort/:id/class/:id",
        name: "View Class",
        element: <ViewClass />,
      },
      {
        path: "ministry-school/programs/:id/cohort/:id/class/:id/student/:id",
        name: "View Student",
        element: <ViewStudent />,
      },
      {
        path: "ministry-school/programs/cohort/class/student/certificate",
        name: "View Certificate",
        element: <ViewCertificate />,
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
        ],
      },
      {
        path: "*",
        element: <UnderConstruction />,
      },
    ],
  },
  {
    path: "/register-member",
    element: <Registration />,
    isPrivate: false,
  },
  {
    path: "events/register-event",
    element: <EventRegister />,
    isPrivate: false,
  },
];

// const permissions = useUserStore((state) => state.permissions);
const homePageRoute = routes?.find((route) => route.path === "/home");
const homePageChildren = homePageRoute?.children || [];
export const sideTabs = homePageChildren.filter(
  (childRoute) =>
    childRoute.sideTab && { name: childRoute.name, path: childRoute.path }
);

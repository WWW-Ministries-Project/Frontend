import CreateEvent from "@/pages/HomePage/pages//EventsManagement/pages/CreateEvent";
import EventRegister from "@/pages/HomePage/pages//EventsManagement/pages/EventRegister.jsx";
import { ManageAsset } from "@/pages/HomePage/pages/AssetsManagement/pages/ManageAssets";
import EventsManagement from "@/pages/HomePage/pages/EventsManagement/EventsManagement";
import ViewEvent from "@/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx";
import { MemberInformation } from "@/pages/HomePage/pages/Members/pages/MemberInformation";
import { ProfileDetails } from "@/pages/HomePage/pages/Members/pages/ProfileDetails";
import ProgramDetails from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramDetails.js";
import ProgramInformation from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramInformation.js";
import { AccessRights } from "@/pages/HomePage/pages/Settings/pages/AccessRights";
import { ManageAccess } from "@/pages/HomePage/pages/Settings/pages/ManageAccess.js";
import { ViewUser } from "@/pages/HomePage/pages/Users/pages/ViewUser";
import { UserManagement } from "@/pages/HomePage/pages/Users/UserManagement";
import { VisitorDetails } from "@/pages/HomePage/pages/VisitorManagement/pages/VisitorDetails";
import { VisitorManagement } from "@/pages/HomePage/pages/VisitorManagement/VisitorManagement";
import LandingPage from "@/pages/LandingPage/LandingPage.jsx";
import { Registration } from "@/pages/Registration/Registration";
import ForgotPassword from "../pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import LoginPage from "../pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ResetPassword from "../pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import ErrorPage from "../pages/ErrorPage.jsx";
import { HomePage } from "../pages/HomePage/HomePage";
import { AssetManagement } from "../pages/HomePage/pages/AssetsManagement/AssetManagement";
import { Members } from "../pages/HomePage/pages/Members/Members";
import { ManageMember } from "../pages/HomePage/pages/Members/pages/ManageMember";
import Settings from "../pages/HomePage/pages/Settings/Settings";
import UnderConstruction from "../pages/UnderConstruction/UnderConstruction";

import { NoAccess } from "@/components/NoAccess";
import { DashBoardPage } from "@/pages/HomePage/pages/DashBoard/DashboardPage.js";
import AllEvent from "@/pages/HomePage/pages/EventsManagement/pages/AllEvent";
import { LifeCenter } from "@/pages/HomePage/pages/LifeCenter/LifeCenter";
import { LifeCenterAnalytics } from "@/pages/HomePage/pages/LifeCenter/pages/LifeCenterAnalytics";
import { LifeCenterRoles } from "@/pages/HomePage/pages/LifeCenter/pages/LifeCenterRoles";
import { ViewLifeCenter } from "@/pages/HomePage/pages/LifeCenter/pages/ViewLifeCenter";
import { MarketPlace } from "@/pages/HomePage/pages/MarketPlace/MarketPlace.js";
import { AddProduct } from "@/pages/HomePage/pages/MarketPlace/pages/AddProduct.js";
import { MarketDetails } from "@/pages/HomePage/pages/MarketPlace/pages/MarketDetail";
import { FamilyInformation } from "@/pages/HomePage/pages/Members/pages/FamilyInformation";
import ViewPageTemplate from "@/pages/HomePage/pages/MinistrySchool/Components/ViewPageTemplate";
import { MinistrySchool } from "@/pages/HomePage/pages/MinistrySchool/MinistrySchool";
import { ViewClass } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewClass";
import { ViewCohort } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCohort";
import { ViewProgram } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewProgram";
import ViewStudent from "@/pages/HomePage/pages/MinistrySchool/pages/ViewStudent";
import { relativePath } from "@/utils/const";
import { ReactNode } from "react";
import ProgramApply from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramApply.js";
import { ProtectedRoute } from "./ProtectedRoutes.js";
import MembersPage from "@/pages/MembersPage/MembersPage.js";
import Market from "@/pages/MembersPage/Pages/Market.js";
import MyLifeCenter from "@/pages/MembersPage/Pages/MyLifeCenter.js";
import SchoolOfMinistries from "@/pages/MembersPage/Pages/MyClass.js";
import MyClass from "@/pages/MembersPage/Pages/MyClass.js";
import AllPrograms from "@/pages/MembersPage/Pages/AllPrograms.js";
import { ProductDetailsPage } from "@/pages/MembersPage/Pages/ProductDetailsPage.js";
import { ViewCart } from "@/pages/MembersPage/Pages/ViewCart.js";
// import { LifeCenterRoles } from "@/pages/HomePage/pages/LifeCenter/pages/LifeCenterRoles.js";

// Define a Route type
export interface AppRoute {
  path: string;
  element?: ReactNode;
  errorElement?: ReactNode;
  name: string;
  alias?: string;
  isPrivate?: boolean;
  permissionNeeded?: string;
  sideTab?: boolean;
  children?: AppRoute[];
}

// Define the routes
export const routes: AppRoute[] = [
  {
    path: "/",
    element: <LoginPage />,
    name: "Landing",
    errorElement: <ErrorPage />,
  },
  {
    path: relativePath.login,
    name: "Landing",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    element: <ResetPassword />,
  },
  {
    path: relativePath.home.main,
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
    name: "Home",
    children: [
      {
        path: "",
        name: "Home",
        element: <DashBoardPage />,
        isPrivate: false,
      },
      {
        path: relativePath.home.dashboard,
        name: "Dashboard",
        element: <DashBoardPage />,
        isPrivate: false,
        sideTab: true,
      },
      {
        path: relativePath.home.members.main,
        name: "Members",
        element: <Members />,
        isPrivate: true,
        permissionNeeded: "view_members",
        sideTab: true,
      },
      {
        path: relativePath.home.members.manage,
        element: <ManageMember />,
        name: "Manage Member",
        isPrivate: true,
        permissionNeeded: "manage_members",
      },
      {
        path: "members/:id",
        element: <ProfileDetails />,
        isPrivate: true,
        name: "Profile Details",
        permissionNeeded: "view_members",
        children: [
          {
            path: "info",
            name: "Info",
            element: <MemberInformation />,
            isPrivate: true,
            permissionNeeded: "view_members",
          },
          {
            path: "fam-info",
            name: "fam-info",
            element: <FamilyInformation />,
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
        permissionNeeded: "view_visitors",
        sideTab: true,
      },
      {
        path: "visitors/visitor/:visitorId",
        name: "Visitors",
        element: <VisitorDetails />,
        isPrivate: false,
        permissionNeeded: "view_visitors",
      },
      {
        path: "events",
        name: "Events",
        // element: <EventsManagement />,
        isPrivate: true,
        permissionNeeded: "view_events",
        sideTab: true,
        children: [
          {
            path: "all-events",
            name: "Events",
            element: <AllEvent />,
            isPrivate: true,
            permissionNeeded: "view_events",
            sideTab: true,
          },
          {
            path: "events",
            name: "Events Schedule",
            element: <EventsManagement />,
            isPrivate: true,
            permissionNeeded: "view_events",
            sideTab: true,
          },
        ],
      },
      {
        path: "manage-event",
        element: <CreateEvent />,
        name: "Manage Event",
        isPrivate: true,
        permissionNeeded: "view_events",
      },
      {
        path: "events/events/view-event",
        element: <ViewEvent />,
        name: " View Event",
        isPrivate: true,
        permissionNeeded: "view_events",
      },
      // {
      //   path: "requests",
      //   name: "Requests",
      //   isPrivate: true,
      //   permissionNeeded: "view_events",
      //   sideTab: true,
      //   children: [
      //     {
      //       path: "",
      //       name: "My Requests",
      //       element: <MyRequisitions />,
      //       isPrivate: true,
      //       sideTab: true,
      //     },
      //     {
      //       path: ":id",
      //       name: "Requests Details",
      //       element: <RequestDetails />,
      //       isPrivate: true,
      //     },
      //     {
      //       path: "request",
      //       name: "Request",
      //       element: <Request />,
      //       isPrivate: true,
      //     },
      //     {
      //       path: "request/:id",
      //       name: "Request",
      //       element: <Request />,
      //       isPrivate: true,
      //     },
      //     {
      //       path: "staff_requests",
      //       name: "Staff Requests",
      //       element: <Requisitions />,
      //       isPrivate: true,
      //       sideTab: true,
      //     },
      //   ],
      // },
      {
        path: "assets",
        name: "Assets",
        element: <AssetManagement />,
        isPrivate: true,
        permissionNeeded: "view_asset",
        sideTab: true,
      },
      {
        path: "assets/manage-asset",
        element: <ManageAsset />,
        name: "Manage Asset",
        isPrivate: true,
        permissionNeeded: "manage_asset",
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
        path: relativePath.home.lifeCenter.main,
        name: "Life Centers",
        // element: <LifeCenter />,
        isPrivate: true,
        permissionNeeded: "view_life_center",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Life Centers",
            element: <LifeCenter />,
            sideTab: true,
          },
          {
            path: relativePath.home.lifeCenter.detail,
            name: "Life Center",
            element: <ViewLifeCenter />,
          },
          {
            path: "roles",
            name: "Life Center Roles",
            element: <LifeCenterRoles />,
            sideTab: true,
          },
          {
            path: "life-center-analytics",
            name: "Life Centers Analytic",
            element: <LifeCenterAnalytics />,
            sideTab: true,
          },
        ],
      },
      {
        path: relativePath.home.marketPlace.main,
        name: "Market Place",
        element: <MarketPlace />,
        sideTab: true,
      },
      {
        path: relativePath.home.marketPlace.details,
        name: "Market Details",
        element: <MarketDetails />,
      },
      {
        path: relativePath.home.marketPlace.addProduct,
        name: "Add Product",
        element: <AddProduct />,
      },
      {
        path: relativePath.home.marketPlace.editProduct,
        name: "Edit Product",
        element: <AddProduct />,
      },

      {
        path: relativePath.home.ministrySchool.main,
        name: "School of Ministry",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Ministry School",
            element: <MinistrySchool />,
          },
          {
            path: `${relativePath.home.ministrySchool.program}/:id`,
            name: "View Template",
            element: <ViewPageTemplate />,
            children: [
              {
                path: "",
                name: "View Program",
                element: <ViewProgram />,
              },
              {
                path: relativePath.home.ministrySchool.cohort,
                name: "View Cohort",
                element: <ViewCohort />,
              },
              {
                path: `${relativePath.home.ministrySchool.cohort}/${relativePath.home.ministrySchool.class}`,
                name: "View Class",
                element: <ViewClass />,
              },
              {
                path: `${relativePath.home.ministrySchool.cohort}/${relativePath.home.ministrySchool.class}/student/:id`,
                name: "View Student",
                element: <ViewStudent />,
              },
            ],
          },
        ],

        // {
        //   path: "ministry-school/programs/cohort/class/student/certificate",
        //   name: "View Certificate",
        //   element: <ViewCertificate />,
        // },
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
            path: "access-rights/manage-access",
            name: "Manage Access",
            element: <ManageAccess />,
            isPrivate: false,
            permissionNeeded: "view_access_rights",
          },
        ],
      },
      {
        path: "access-denied",
        name: "Access Denied",
        element: <NoAccess />,
      },
      {
        path: "*",
        name: "UnBuilt",
        element: <UnderConstruction />,
      },
    ],
  },
  //TODO: figure this out before pushing
  {
    path: "/out",
    element: <LandingPage />,
    name: "huh",
    children: [
      {
        path: "programs",
        name: "Programs",
        element: <ProgramApply />,
        isPrivate: false,
      },
      {
        path: "programs/:name",
        name: "Programs",
        element: <ProgramDetails />,
        isPrivate: false,
      },
      {
        path: "programs/:name/apply",
        name: "Programs",
        element: <ProgramInformation />,
        isPrivate: false,
      },
      {
        path: "register-member",
        element: <Registration />,
        name: "MemberRegistration",
        isPrivate: false,
      },
      {
        path: "events/register-event",
        element: <EventRegister />,
        name: "Event Registration",
        isPrivate: false,
      },
    ],
  },

  {
    path: "programs/:name",
    name: "Programs",
    element: <ProgramDetails />,
    isPrivate: false,
  },
  {
    path: "programs/:name/apply",
    name: "Programs",
    element: <ProgramInformation />,
    isPrivate: false,
  },
  {
    path: "/register-member",
    name: "register Member",
    element: <Registration />,
    isPrivate: false,
  },
  {
    path: "events/register-event",
    name: "Event Register",
    element: <EventRegister />,
    isPrivate: false,
  },
  {
    path: "/member",
    element: <MembersPage />,
    name: "member",
    children: [
      {
        path: relativePath.member.dashboard,
        name: "member_dashboard",
        element: <DashBoardPage />,
        isPrivate: false,
      },
      {
        path: relativePath.member.market,
        name: "member_market",
        element: <Market />,
        isPrivate: false,
      },
      {
        path: relativePath.member.productDetails,
        name: "product_details",
        element: <ProductDetailsPage />,
        isPrivate: false,
      },
      {
        path: relativePath.member.cart,
        name: "cart",
        element: <ViewCart />,
        isPrivate: false,
      },
      {
        path: relativePath.member.lifeCenter,
        name: "member_life_center",
        element: <MyLifeCenter />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.allPrograms,
        name: "member_school_of_ministries",
        element: <AllPrograms />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.myClass,
        name: "member_school_of_ministries",
        element: <MyClass />,
        isPrivate: false,
      },
    ],
  },
];

// Now, extract sideTabs
const homePageRoute = routes.find(
  (route) => route.path === relativePath.home.main
);
const homePageChildren = homePageRoute?.children || [];

export const sideTabs = homePageChildren.filter(
  (childRoute) => childRoute.sideTab
);

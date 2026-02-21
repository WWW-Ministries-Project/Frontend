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
import { UserManagement } from "@/pages/HomePage/pages/Users/UserManagement";
import { VisitorDetails } from "@/pages/HomePage/pages/VisitorManagement/pages/VisitorDetails";
import VisitorAnalytics from "@/pages/HomePage/pages/VisitorManagement/pages/VisitorAnalytics";
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
import { MembershipManagement } from "@/pages/HomePage/pages/MembershipManagement/MembershipManagement";
import { MemberConfirmation } from "@/pages/HomePage/pages/MembershipManagement/pages/MemberConfirmation";
import { VisitorToMembership } from "@/pages/HomePage/pages/MembershipManagement/pages/VisitorToMembership";
import MembershipAnalytics from "@/pages/HomePage/pages/MembershipManagement/pages/MembershipAnalytics";
import ViewPageTemplate from "@/pages/HomePage/pages/MinistrySchool/Components/ViewPageTemplate";
import { MinistrySchool } from "@/pages/HomePage/pages/MinistrySchool/MinistrySchool";
import MinistrySchoolAnalytics from "@/pages/HomePage/pages/MinistrySchool/pages/MinistrySchoolAnalytics";
import { ViewClass } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewClass";
import { ViewCohort } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCohort";
import ViewProgram from "@/pages/HomePage/pages/MinistrySchool/pages/ViewProgram";
import ViewStudent from "@/pages/HomePage/pages/MinistrySchool/pages/ViewStudent";
import { relativePath } from "@/utils/const";
import { ReactNode } from "react";
import { ProtectedRoute } from "./ProtectedRoutes.js";
import MembersPage from "@/pages/MembersPage/MembersPage.js";
import Market from "@/pages/MembersPage/Pages/Market.js";
import MyLifeCenter from "@/pages/MembersPage/Pages/MyLifeCenter.js";
import AllPrograms from "@/pages/MembersPage/Pages/AllPrograms.js";
import { ProductDetailsPage } from "@/pages/MembersPage/Pages/ProductDetailsPage";
import { ViewCart } from "@/pages/MembersPage/Pages/ViewCart";
import { CheckOutPage } from "@/pages/MembersPage/Pages/CheckOutPage";
import ProductsPage from "@/pages/MembersPage/Pages/ProductsPage";
import { MyOrders } from "@/pages/MembersPage/Pages/MyOrders";
import VerifyPayment from "@/pages/MembersPage/Pages/VerifyPayment.js";
import { VisitorRegistration } from "@/pages/Registration/VisitorRegistration.js";
import ViewTopic from "@/pages/HomePage/pages/MinistrySchool/Components/ViewTopic.js";
import EnrolledProgram from "@/pages/MembersPage/Pages/EnrolledProgram.js";
import MyLearning from "@/pages/MembersPage/Pages/MyLearning.js";
import InstructorProg from "@/pages/MembersPage/Pages/InstructorProg.js";
import InstructorAssMan from "@/pages/MembersPage/Pages/InstructorAssMan.js";
import Instructor from "@/pages/MembersPage/Pages/Instructor.js";
import InstructorCohort from "@/pages/MembersPage/Pages/InstructorCohort.js";
import GradingPanel from "@/pages/MembersPage/Pages/GradingPanel.js";
import ChurchAttendance from "@/pages/HomePage/pages/Attendance/ChurchAttendance.js";
import AttendanceAnalytics from "@/pages/HomePage/pages/Attendance/AttendanceAnalytics";
import AnnualThemeManager from "@/pages/HomePage/pages/ChurchCommunication/AnnualThemeManager.js";
import AppointmentManager from "@/pages/HomePage/pages/AppointmentsManagement/AppointmentManager.js";
import AppointmentsAnalytics from "@/pages/HomePage/pages/AppointmentsManagement/pages/AppointmentsAnalytics";
import ManageAvailability from "@/pages/HomePage/pages/AppointmentsManagement/pages/ManageAvailability.js";
import AssetsAnalytics from "@/pages/HomePage/pages/AssetsManagement/pages/AssetsAnalytics";
import EventsAnalytics from "@/pages/HomePage/pages/EventsManagement/pages/EventsAnalytics";
import MarketplaceAnalytics from "@/pages/HomePage/pages/MarketPlace/pages/MarketplaceAnalytics";
import MyAppointments from "@/pages/MembersPage/Pages/MyAppointments.js";
import FinanceManager from "@/pages/HomePage/pages/FinanceManagement/FinanaceManagement.js";
import FinanceDetailPage from "@/pages/HomePage/pages/FinanceManagement/pages/FinanceDetailPage.js";
import FianancialsForm from "@/pages/HomePage/pages/FinanceManagement/pages/FinancialsForm.js";
import FinanceConfiguration from "@/pages/HomePage/pages/FinanceManagement/pages/FinanceConfiguration.js";
import { Navigate } from "react-router-dom";
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
      },
      {
        path: relativePath.home.membership.main,
        name: "Membership",
        isPrivate: true,
        permissionNeeded: "view_members",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Membership Default",
            element: <Navigate to={relativePath.home.membership.churchDirectory} replace />,
            isPrivate: true,
            permissionNeeded: "view_members",
          },
          {
            path: relativePath.home.membership.churchDirectory,
            name: "Church Directory",
            element: <Members />,
            isPrivate: true,
            permissionNeeded: "view_members",
            sideTab: true,
          },
          {
            path: relativePath.home.membership.management.main,
            name: "Member Admin",
            element: <MembershipManagement />,
            isPrivate: true,
            permissionNeeded: "manage_members",
            sideTab: true,
            children: [
              {
                path: "",
                name: "Membership Management Default",
                element: (
                  <Navigate
                    to={relativePath.home.membership.management.memberConfirmation}
                    replace
                  />
                ),
                isPrivate: true,
                permissionNeeded: "manage_members",
              },
              {
                path: relativePath.home.membership.management.memberConfirmation,
                name: "Member Confirmation",
                element: <MemberConfirmation />,
                isPrivate: true,
                permissionNeeded: "manage_members",
              },
              {
                path: relativePath.home.membership.management.visitorToMembership,
                name: "Visitor-to-Membership",
                element: <VisitorToMembership />,
                isPrivate: true,
                permissionNeeded: "manage_members",
              },
            ],
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <MembershipAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_members",
            sideTab: true,
          },
        ],
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
            path: "",
            name: "Info",
            element: <MemberInformation />,
            isPrivate: true,
            permissionNeeded: "view_members",
          },
          // {
          //   path: "fam-info",
          //   name: "fam-info",
          //   element: <FamilyInformation />,
          //   isPrivate: true,
          //   permissionNeeded: "view_members",
          // },
        ],
      },
      {
        path: "visitors",
        name: "Visitors",
        isPrivate: true,
        permissionNeeded: "view_visitors",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Visitors",
            element: <VisitorManagement />,
            isPrivate: true,
            permissionNeeded: "view_visitors",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <VisitorAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_visitors",
            sideTab: true,
          },
        ],
      },
      {
        path: "visitors/visitor/:visitorId",
        name: "Visitors",
        element: <VisitorDetails />,
        isPrivate: true,
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
            path: "",
            name: "Events",
            element: <AllEvent />,
            isPrivate: true,
            permissionNeeded: "view_events",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <EventsAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_events",
            sideTab: true,
          },
          {
            path: "all-events",
            name: "Events Legacy",
            element: <Navigate to="/home/events" replace />,
            isPrivate: true,
            permissionNeeded: "view_events",
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
        permissionNeeded: "manage_events",
      },
      {
        path: "events/events/view-event",
        element: <ViewEvent />,
        name: " View Event",
        isPrivate: true,
        permissionNeeded: "view_events",
      },
      {
        path: "church-attendance",
        name: "Attendance",
        isPrivate: true,
        permissionNeeded: "view_church_attendance",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Church Attendance",
            element: <ChurchAttendance />,
            isPrivate: true,
            permissionNeeded: "view_church_attendance",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <AttendanceAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_church_attendance",
            sideTab: true,
          },
        ],
      },

      // Church Communication route
      {
        path: "communication",
        name: "Communication",
        isPrivate: true,
        permissionNeeded: "view_theme",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Communication Default",
            element: <Navigate to="theme-manager" replace />,
            isPrivate: true,
            permissionNeeded: "view_theme",
          },
          {
            path: "theme-manager",
            name: "Annual Theme Manager",
            element: <AnnualThemeManager />,
            isPrivate: true,
            permissionNeeded: "view_theme",
            sideTab: true,
          },
        ],
      },

      {
        path: "appointments",
        name: "Appointments",
        isPrivate: true,
        permissionNeeded: "view_appointments",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Appointment Manager",
            element: <AppointmentManager />,
            isPrivate: true,
            permissionNeeded: "view_appointments",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <AppointmentsAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_appointments",
            sideTab: true,
          },
          {
            path: "appointment-manager",
            name: "Appointments Legacy",
            element: <Navigate to="/home/appointments" replace />,
            isPrivate: true,
            permissionNeeded: "view_appointments",
          },
          {
            path: "manage-availability",
            name: "Manage Availability",
            element: <ManageAvailability />,
            isPrivate: true,
            permissionNeeded: "view_appointments",
            sideTab: true,
          },
          
        ],
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
        isPrivate: true,
        permissionNeeded: "view_asset",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Assets",
            element: <AssetManagement />,
            isPrivate: true,
            permissionNeeded: "view_asset",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <AssetsAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_asset",
            sideTab: true,
          },
        ],
      },
      {
        path: "assets/manage-asset",
        element: <ManageAsset />,
        name: "Manage Asset",
        isPrivate: true,
        permissionNeeded: "manage_asset",
      },
      {
        path: "finance",
        name: "Finance",
        isPrivate: true,
        permissionNeeded: "view_financials",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Finance Manager",
            element: <FinanceManager />,
            isPrivate: true,
            permissionNeeded: "view_financials",
            sideTab: true,   
          },
          {
            path: ":id",
            name: "Finance Detail",
            element: <FinanceDetailPage />,
            isPrivate: true,
            permissionNeeded: "view_financials",
          },
          {
            path: "create",
            name: "Create Financials",
            element: <FianancialsForm />,
            isPrivate: true,
            permissionNeeded: "manage_financials",
          },
          {
            path: "configuration",
            name: "Configuration",
            element: <FinanceConfiguration />,
            isPrivate: true,
            permissionNeeded: "manage_financials",
            sideTab: true,
          },
        ],
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
            isPrivate: true,
            permissionNeeded: "view_life_center",
            sideTab: true,
          },
          {
            path: relativePath.home.lifeCenter.detail,
            name: "Life Center",
            element: <ViewLifeCenter />,
            isPrivate: true,
            permissionNeeded: "view_life_center",
          },
          {
            path: "roles",
            name: "Life Center Roles",
            element: <LifeCenterRoles />,
            isPrivate: true,
            permissionNeeded: "manage_life_center",
          },
          {
            path: "life-center-analytics",
            name: "Life Centers Analytic",
            element: <LifeCenterAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_life_center",
            sideTab: true,
          },
        ],
      },
      {
        path: relativePath.home.marketPlace.main,
        name: "Market Place",
        isPrivate: true,
        permissionNeeded: "view_marketplace",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Market Place",
            element: <MarketPlace />,
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <MarketplaceAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
        ],
      },
      {
        path: relativePath.home.marketPlace.details,
        name: "Market Details",
        element: <MarketDetails />,
        isPrivate: true,
        permissionNeeded: "view_marketplace",
      },
      {
        path: relativePath.home.marketPlace.addProduct,
        name: "Add Product",
        element: <AddProduct />,
        isPrivate: true,
        permissionNeeded: "manage_marketplace",
      },
      {
        path: relativePath.home.marketPlace.editProduct,
        name: "Edit Product",
        element: <AddProduct />,
        isPrivate: true,
        permissionNeeded: "manage_marketplace",
      },

      {
        path: relativePath.home.ministrySchool.main,
        name: "School of Ministry",
        isPrivate: true,
        permissionNeeded: "view_school_of_ministry",
        sideTab: true,
        children: [
          {
            path: "",
            name: "School of Ministry",
            element: <MinistrySchool />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <MinistrySchoolAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: `${relativePath.home.ministrySchool.program}/:id`,
            name: "",
            element: <ViewPageTemplate />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            children: [
              {
                path: "",
                name: "View Program",
                element: <ViewProgram />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: `${relativePath.home.ministrySchool.topic}`,
                name: "View Topic",
                element: <ViewTopic />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: relativePath.home.ministrySchool.cohort,
                name: "View Cohort",
                element: <ViewCohort />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: `${relativePath.home.ministrySchool.cohort}/${relativePath.home.ministrySchool.class}`,
                name: "View Class",
                element: <ViewClass />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: `${relativePath.home.ministrySchool.cohort}/${relativePath.home.ministrySchool.class}/student/:id`,
                name: "View Student",
                element: <ViewStudent />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
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
        isPrivate: true,
        permissionNeeded: "view_settings",
        sideTab: true,
        children: [
          {
            path: "",
            alias: "departments",
            name: "General configuration",
            element: <Settings />,
            isPrivate: true,
            permissionNeeded: "view_departments",
            sideTab: true,
          },
          {
            path: "access-rights",
            name: "Access Rights",
            element: <AccessRights />,
            isPrivate: true,
            permissionNeeded: "view_access_rights",
            sideTab: true,
          },
          {
            path: "access-rights/manage-access",
            name: "Manage Access",
            element: <ManageAccess />,
            isPrivate: true,
            permissionNeeded: "manage_access_rights",
          },
          {
            path: "users",
            name: "Users",
            element: <UserManagement />,
            isPrivate: true,
            permissionNeeded: "manage_users",
            sideTab: true,
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
    name: "out",
    children: [
      // {
      //   path: "programs",
      //   name: "Programs",
      //   element: <ProgramApply />,
      //   isPrivate: false,
      // },
      // {
      //   path: "programs/:name",
      //   name: "Programs",
      //   element: <ProgramDetails />,
      //   isPrivate: false,
      // },
      // {
      //   path: "programs/:name/apply",
      //   name: "Programs",
      //   element: <ProgramInformation />,
      //   isPrivate: false,
      // },
      {
        path: "register-member",
        element: <Registration />,
        name: "MemberRegistration",
        isPrivate: false,
      },
      {
        path: "register-visitor",
        element: <VisitorRegistration />,
        name: "VisitorRegistration",
        isPrivate: false,
      },
      // {
      //   path: "events/register-event",
      //   element: <EventRegister />,
      //   name: "Event Registration",
      //   isPrivate: false,
      // },
      {
        path: "products",
        name: "products",
        element: <ProductsPage />,
        isPrivate: false,
      },
      {
        path: "products/:id",
        name: "ProductDetailsPage",
        element: <ProductDetailsPage />,
        isPrivate: false,
      },
      {
        path: "products/check-out",
        name: "Check Out",
        element: <CheckOutPage />,
        isPrivate: false,
      },
      {
        path: "verify-payment/:type",
        name: "Verify payment",
        element: <VerifyPayment />,
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
    element: (
      <ProtectedRoute>
        <MembersPage />
      </ProtectedRoute>
    ),
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
        name: "Member Market",
        element: <Market />,
        isPrivate: false,

        children: [
          {
            path: relativePath.member.market,
            name: "Products",
            element: <ProductsPage />,
            isPrivate: false,
          },
          {
            path: relativePath.member.productDetails,
            name: "Product Details",
            element: <ProductDetailsPage />,
            isPrivate: false,
          },

          {
            path: relativePath.member.cart,
            name: "Carts",
            element: <ViewCart />,
            isPrivate: false,
          },
          {
            path: relativePath.member.checkOut,
            name: "Check Out",
            element: <CheckOutPage />,
            isPrivate: false,
          },
          {
            path: relativePath.member.orders,
            name: "Orders",
            element: <MyOrders />,
            isPrivate: false,
          },
          {
            path: relativePath.member.verify_payment,
            name: "Verify Payment",
            element: <VerifyPayment />,
            isPrivate: false,
          },
        ],
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
        path: relativePath.member.schoolOfMinistries.myEnrolledPrograms,
        name: "member_school_of_ministries",
        element: <MyLearning />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.programDetails,
        name: "member_school_of_ministries",
        element: <EnrolledProgram />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.instructorPortal,
        name: "member_school_of_ministries",
        element: <Instructor />,
        isPrivate: false,
        children: [
          {
            path: '',
            name: "instructor_assessment_management",
            element: <InstructorProg />,
            isPrivate: false,
          },
          {
            path: relativePath.member.schoolOfMinistries.instructorCohort,
            name: "instructor_assessment_management",
            element: <InstructorCohort />,
            isPrivate: false,
          },
          {
            path: relativePath.member.schoolOfMinistries.instructorAssMan,
            name: "instructor_assessment_managementewe",
            element: <InstructorAssMan />,
            isPrivate: false,
          },
          {
            path: relativePath.member.schoolOfMinistries.InstructorGradingPanel,
            name: "instructor_assessment_managementewe",
            element: <GradingPanel />,
            isPrivate: false,
          },
        ],
      },
      {
        path: relativePath.member.appointments,
        name: "member_appointments",
        element: <MyAppointments />,
        isPrivate: false,
      }
      // {
      //       path: relativePath.member.schoolOfMinistries.instructorAssMan,
      //       name: "instructor_assessment_management",
      //       element: <InstructorAssMan />,
      //       isPrivate: false,
      //     },
      // {
      //   path: relativePath.member.schoolOfMinistries.myClass,
      //   name: "member_school_of_ministries",
      //   element: <EnrolledClass />,
      //   isPrivate: false,
      // },
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

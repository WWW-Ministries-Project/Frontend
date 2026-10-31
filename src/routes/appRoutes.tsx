import CreateEvent from "@/pages/HomePage/pages/EventsManagement/pages/CreateEvent";
import EventRegister from "@/pages/HomePage/pages/EventsManagement/pages/EventRegister";
import EventsManagement from "@/pages/HomePage/pages/EventsManagement/EventsManagement";
import ViewEvent from "@/pages/HomePage/pages/EventsManagement/pages/ViewEvents.jsx";
import { MemberInformation } from "@/pages/HomePage/pages/Members/pages/MemberInformation";
import { ProfileDetails } from "@/pages/HomePage/pages/Members/pages/ProfileDetails";
import { MemberExclusionGuard } from "@/routes/MemberExclusionGuard";
import ProgramDetails from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramDetails.js";
import ProgramInformation from "@/pages/HomePage/pages/MinistrySchool/pages/ProgramInformation.js";
import { VisitorDetails } from "@/pages/HomePage/pages/VisitorManagement/pages/VisitorDetails";
import VisitorAnalytics from "@/pages/HomePage/pages/VisitorManagement/pages/VisitorAnalytics";
import { Guests } from "@/pages/HomePage/pages/VisitorManagement/pages/Guests";
import { VisitorManagement } from "@/pages/HomePage/pages/VisitorManagement/VisitorManagement";
import LandingPage from "@/pages/LandingPage/LandingPage.jsx";
import { Registration } from "@/pages/Registration/Registration";
import ForgotPassword from "../pages/Authentication/pages/ForgotPassword/ForgotPassword.jsx";
import LoginPage from "../pages/Authentication/pages/LoginPage/LoginPage.jsx";
import ResetPassword from "../pages/Authentication/pages/ResetPassword/ResetPassword.jsx";
import ErrorPage from "../pages/ErrorPage.jsx";
import { HomePage } from "../pages/HomePage/HomePage";
import { Members } from "../pages/HomePage/pages/Members/Members";
import { ManageMember } from "../pages/HomePage/pages/Members/pages/ManageMember";
import UnderConstruction from "../pages/UnderConstruction/UnderConstruction";

import { NoAccess } from "@/components/NoAccess";
import { NotificationCenterPage } from "@/features/notifications/NotificationCenterPage";
import { DashBoardPage } from "@/pages/HomePage/pages/DashBoard/DashboardPage.js";
import AllEvent from "@/pages/HomePage/pages/EventsManagement/pages/AllEvent";
import EventSchedulesByEvent from "@/pages/HomePage/pages/EventsManagement/pages/EventSchedulesByEvent";
import {
  LifeCenterAnalytics,
  LifeCenterDetail,
  LifeCenterList,
} from "@/pages/HomePage/pages/LifeCenter/lazyPages";
import { MembershipManagement } from "@/pages/HomePage/pages/MembershipManagement/MembershipManagement";
import { DepartmentDetails } from "@/pages/HomePage/pages/MembershipManagement/pages/DepartmentDetails";
import { DepartmentsAndMinistries } from "@/pages/HomePage/pages/MembershipManagement/pages/DepartmentsAndMinistries";
import { MemberConfirmation } from "@/pages/HomePage/pages/MembershipManagement/pages/MemberConfirmation";
import { SoulwonToMembership } from "@/pages/HomePage/pages/MembershipManagement/pages/SoulwonToMembership";
import { VisitorToMembership } from "@/pages/HomePage/pages/MembershipManagement/pages/VisitorToMembership";
import { JoinDepartmentRequests } from "@/pages/HomePage/pages/MembershipManagement/pages/JoinDepartmentRequests";
import { GuestToMembership } from "@/pages/HomePage/pages/MembershipManagement/pages/GuestToMembership";
import MembershipAnalytics from "@/pages/HomePage/pages/MembershipManagement/pages/MembershipAnalytics";
import ViewPageTemplate from "@/pages/HomePage/pages/MinistrySchool/Components/ViewPageTemplate";
import AssessmentLibraryPage from "@/pages/HomePage/pages/MinistrySchool/lms/assessment/AssessmentLibraryPage";
import CohortsPage from "@/pages/HomePage/pages/MinistrySchool/lms/CohortsPage";
import ContentLibraryPage from "@/pages/HomePage/pages/MinistrySchool/lms/library/ContentLibraryPage";
import ReportsPage from "@/pages/HomePage/pages/MinistrySchool/lms/reports/ReportsPage";
import CohortWorkspace from "@/pages/HomePage/pages/MinistrySchool/lms/CohortWorkspace";
import InstructorsPage from "@/pages/HomePage/pages/MinistrySchool/lms/InstructorsPage";
import LearnersPage from "@/pages/HomePage/pages/MinistrySchool/lms/LearnersPage";
import { LegacyCohortRedirect } from "@/pages/HomePage/pages/MinistrySchool/lms/LegacyRedirect";
import ProgramsPage from "@/pages/HomePage/pages/MinistrySchool/lms/ProgramsPage";
import ProgramWorkspace from "@/pages/HomePage/pages/MinistrySchool/lms/ProgramWorkspace";
import SomDashboard from "@/pages/HomePage/pages/MinistrySchool/lms/SomDashboard";
import { SomDataProvider } from "@/pages/HomePage/pages/MinistrySchool/lms/SomDataProvider";
import MinistrySchoolAnalytics from "@/pages/HomePage/pages/MinistrySchool/pages/MinistrySchoolAnalytics";
import { ViewClass } from "@/pages/HomePage/pages/MinistrySchool/pages/ViewClass";
import ViewCertificate from "@/pages/HomePage/pages/MinistrySchool/pages/ViewCertificate";
import ViewStudent from "@/pages/HomePage/pages/MinistrySchool/pages/ViewStudent";
import { relativePath } from "@/utils/const";
import { ReactNode, Suspense } from "react";
import { ProtectedRoute } from "./ProtectedRoutes.js";
import type { PermissionRequirement } from "@/utils/accessControl";
import MembersPage from "@/pages/MembersPage/MembersPage.js";
import MyLifeCenter from "@/pages/MembersPage/Pages/MyLifeCenter.js";
import AllPrograms from "@/pages/MembersPage/Pages/AllPrograms.js";
import GivingComplete from "@/pages/MembersPage/Pages/GivingComplete.js";
import PledgeComplete from "@/pages/MembersPage/Pages/PledgeComplete.js";
import MemberGiving from "@/pages/MembersPage/Pages/MemberGiving.js";
import MemberGivingComplete from "@/pages/MembersPage/Pages/MemberGivingComplete.js";
import MemberPledges from "@/pages/MembersPage/Pages/MemberPledges.js";
import MemberPledgeComplete from "@/pages/MembersPage/Pages/MemberPledgeComplete.js";
import { VisitorRegistration } from "@/pages/Registration/VisitorRegistration.js";
import EnrolledProgram from "@/pages/MembersPage/Pages/EnrolledProgram.js";
import LearnerDashboard from "@/pages/MembersPage/Pages/school/LearnerDashboard";
import MyPrograms from "@/pages/MembersPage/Pages/school/MyPrograms";
import LearnerAssignments from "@/pages/MembersPage/Pages/school/LearnerAssignments";
import LearnerSubmission from "@/pages/MembersPage/Pages/school/LearnerSubmission";
import LearnerGrades from "@/pages/MembersPage/Pages/school/LearnerGrades";
import LearnerSchedule from "@/pages/MembersPage/Pages/school/LearnerSchedule";
import LearnerAnnouncements from "@/pages/MembersPage/Pages/school/LearnerAnnouncements";
import InstructorProg from "@/pages/MembersPage/Pages/InstructorProg.js";
import InstructorAssMan from "@/pages/MembersPage/Pages/InstructorAssMan.js";
import Instructor from "@/pages/MembersPage/Pages/Instructor.js";
import InstructorCohort from "@/pages/MembersPage/Pages/InstructorCohort.js";
import GradingPanel from "@/pages/MembersPage/Pages/GradingPanel.js";
import ChurchAttendance from "@/pages/HomePage/pages/Attendance/ChurchAttendance.js";
import EventAttendance from "@/pages/HomePage/pages/Attendance/EventAttendance";
import AttendanceAnalytics from "@/pages/HomePage/pages/Attendance/AttendanceAnalytics";
import AnnualThemeManager from "@/pages/HomePage/pages/ChurchCommunication/AnnualThemeManager.js";
import CommunityManager from "@/pages/HomePage/pages/ChurchCommunication/CommunityManager.js";
import CommunicationIndexRedirect from "@/pages/HomePage/pages/ChurchCommunication/CommunicationIndexRedirect.js";
import MessagingManager from "@/pages/HomePage/pages/ChurchCommunication/Messaging/MessagingManager.js";
import PromotionManager from "@/pages/HomePage/pages/ChurchCommunication/PromotionManager.js";
import SermonManager from "@/pages/HomePage/pages/ChurchCommunication/SermonManager.js";
import CommunityLayout from "@/pages/HomePage/pages/Community/CommunityLayout.js";
import MemberCommunityPage from "@/pages/HomePage/pages/Community/MemberCommunityPage.js";
import CommunityPostPage from "@/pages/HomePage/pages/Community/CommunityPostPage.js";
import RidesLayout from "@/pages/HomePage/pages/Rides/RidesLayout.js";
import RidesHubPage from "@/pages/HomePage/pages/Rides/RidesHubPage.js";
import RideOfferPage from "@/pages/HomePage/pages/Rides/RideOfferPage.js";
import RideFindPage from "@/pages/HomePage/pages/Rides/RideFindPage.js";
import MyRidePage from "@/pages/HomePage/pages/Rides/MyRidePage.js";
import RidesManager from "@/pages/HomePage/pages/Rides/admin/RidesManager.js";
import AppointmentManager from "@/pages/HomePage/pages/AppointmentsManagement/AppointmentManager.js";
import AppointmentsAnalytics from "@/pages/HomePage/pages/AppointmentsManagement/pages/AppointmentsAnalytics";
import ManageAvailability from "@/pages/HomePage/pages/AppointmentsManagement/pages/ManageAvailability.js";
import AppointmentSettings from "@/pages/HomePage/pages/AppointmentsManagement/pages/AppointmentSettings";
import EventsAnalytics from "@/pages/HomePage/pages/EventsManagement/pages/EventsAnalytics";
import MyAppointments from "@/pages/MembersPage/Pages/MyAppointments.js";
import {
  FinanceConfiguration,
  FinanceManager,
  FinanceRecord,
  GivingContributions,
  GivingOptions,
  PledgeDetail,
  Pledges,
} from "@/pages/HomePage/pages/FinanceManagement/lazyPages";
import {
  AllRequisitionsPage,
  LegacyRequestRedirect,
  MyRequisitionsPage,
  RequisitionDeepLinkPage,
} from "@/pages/HomePage/pages/Requisitions/RequisitionManager";
import RequisitionsAnalytics from "@/pages/HomePage/pages/Requisitions/pages/RequisitionsAnalytics";
import EventReportDetails from "@/pages/HomePage/pages/Reports/pages/EventReportDetails";
import EventReports from "@/pages/HomePage/pages/Reports/pages/EventReports";
import ExecutiveSummary from "@/pages/HomePage/pages/Reports/pages/ExecutiveSummary";
import DepartmentReports from "@/pages/HomePage/pages/Reports/pages/DepartmentReports";
import DepartmentReportDetail from "@/pages/HomePage/pages/Reports/pages/DepartmentReportDetail";
import ReportsHome from "@/pages/HomePage/pages/Reports/pages/ReportsHome";
import {
  DEPARTMENT_REPORTS_ACCESS,
  EXECUTIVE_SUMMARY_ACCESS,
  REPORTS_MENU_ACCESS,
} from "@/pages/HomePage/pages/Reports/utils/reportAccess";
import CertificateVerificationPage from "@/pages/CertificateVerification/CertificateVerificationPage";
import { Navigate } from "react-router-dom";
import {
  AccessRightsList,
  ApprovalsPage,
  GeneralConfiguration,
  RoleDetail,
  UsersPage,
  VisitorFollowUpsSettings,
} from "@/pages/HomePage/pages/Settings/lazyPages";
import {
  AssetAnalytics,
  AssetCountPage,
  AssetManager,
  AssetReconciliation,
} from "@/pages/HomePage/pages/AssetsManagement/lazyPages";
import ChangePassword from "@/pages/Authentication/pages/ChangePassword/ChangePassword";
import { AIConsole } from "@/pages/HomePage/pages/AI/AIConsole";

import {
  MarketPlace,
  AddProduct,
  MarketDetails,
  Market,
  ProductDetailsPage,
  CheckOutPage,
  ProductsPage,
  MyOrders,
  OrderDetailsPage,
  VerifyPayment,
  MarketplaceAnalytics,
  MarketplaceOverview,
  AllProducts,
  AllOrders,
  AdminOrderDetail,
} from "./lazyMarketplaceRoutes";

// Define a Route type
export interface AppRoute {
  path: string;
  element?: ReactNode;
  errorElement?: ReactNode;
  name: string;
  alias?: string;
  isPrivate?: boolean;
  permissionNeeded?: PermissionRequirement;
  sideTab?: boolean;
  /** Names this page in "Back to …" links on pages opened from it. Pages
   *  without one fall back to their nearest `sideTab` ancestor's name. */
  backLabel?: string;
  /** A pure redirect: never a navigation entry, so it does not count when
   *  deciding whether a parent has anything the user can open. */
  redirectOnly?: boolean;
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
    path: relativePath.certificateVerification,
    name: "Certificate Verification",
    element: <CertificateVerificationPage />,
  },
  {
    path: "/change-password",
    name: "ChangePassword",
    element: (
      <ProtectedRoute>
        <ChangePassword />
      </ProtectedRoute>
    ),
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
        name: "Home",
        element: <DashBoardPage />,
        isPrivate: false,
        sideTab: true,
      },
      {
        path: relativePath.home.notifications,
        name: "Notifications",
        element: <NotificationCenterPage />,
        isPrivate: true,
      },
      {
        path: relativePath.home.ai,
        name: "AI Console",
        element: <AIConsole />,
        isPrivate: true,
        permissionNeeded: { domain: "AI", action: "view" },
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
            name: "Church Directory",
            element: <Members />,
            isPrivate: true,
            permissionNeeded: "view_members",
            sideTab: true,
          },
          {
            path: relativePath.home.membership.churchDirectory,
            name: "Church Directory Legacy",
            element: (
              <Navigate
                to={`${relativePath.home.main}/${relativePath.home.membership.main}`}
                replace
              />
            ),
            isPrivate: true,
            permissionNeeded: "view_members",
          },
          {
            path: relativePath.home.membership.departments.main,
            name: "Departments and Ministries",
            element: <DepartmentsAndMinistries />,
            isPrivate: true,
            permissionNeeded: "view_departments",
            sideTab: true,
          },
          {
            path: relativePath.home.membership.management.main,
            name: "Membership manager",
            element: <MembershipManagement />,
            isPrivate: true,
            // Pipelines open at View; department heads (Departments manage)
            // reach the join requests for departments they lead.
            permissionNeeded: ["view_membership_management", "manage_departments"],
            sideTab: true,
            children: [
              {
                path: "",
                name: "Membership Management Default",
                element: (
                  <Navigate
                    to={
                      relativePath.home.membership.management.memberConfirmation
                    }
                    replace
                  />
                ),
                isPrivate: true,
                permissionNeeded: "view_membership_management",
              },
              {
                path: relativePath.home.membership.management
                  .memberConfirmation,
                name: "Member Confirmation",
                element: <MemberConfirmation />,
                isPrivate: true,
                permissionNeeded: "view_membership_management",
              },
              {
                path: relativePath.home.membership.management
                  .visitorToMembership,
                name: "Visitor-to-Membership",
                element: <VisitorToMembership />,
                isPrivate: true,
                permissionNeeded: "view_membership_management",
              },
              {
                path: relativePath.home.membership.management
                  .soulwonToMembership,
                name: "Soulwon-to-Membership",
                element: <SoulwonToMembership />,
                isPrivate: true,
                permissionNeeded: "view_membership_management",
              },
              {
                path: relativePath.home.membership.management.guestToMembership,
                name: "Guest-to-Membership",
                element: <GuestToMembership />,
                isPrivate: true,
                permissionNeeded: "view_membership_management",
              },
              {
                path: relativePath.home.membership.management.joinRequests,
                name: "Join Department Requests",
                element: <JoinDepartmentRequests />,
                isPrivate: true,
                permissionNeeded: ["view_membership_management", "manage_departments"],
              },
            ],
          },
          {
            path: relativePath.home.membership.analytics,
            name: "Analytics",
            element: <MembershipAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_members",
            sideTab: true,
          },
          {
            path: relativePath.home.membership.departments.details,
            name: "Department Details",
            backLabel: "Department",
            element: <DepartmentDetails />,
            isPrivate: true,
            permissionNeeded: "view_departments",
          },
        ],
      },
      {
        path: relativePath.home.members.manage,
        element: (
          <MemberExclusionGuard>
            <ManageMember />
          </MemberExclusionGuard>
        ),
        name: "Manage Member",
        isPrivate: true,
        permissionNeeded: "manage_members",
      },
      {
        path: "members/:id",
        element: (
          <MemberExclusionGuard>
            <ProfileDetails />
          </MemberExclusionGuard>
        ),
        isPrivate: true,
        name: "Profile Details",
        backLabel: "Member profile",
        permissionNeeded: "view_members",
        children: [
          {
            // Legacy link: the family details now live on the profile's Family tab.
            path: "fam-info",
            name: "fam-info",
            element: <Navigate to="..?tab=family" relative="path" replace />,
            isPrivate: true,
            permissionNeeded: "view_members",
          },
        ],
      },
      {
        // Top-level so the church office finds it; needs a `sidebarIcons`
        // entry keyed by this name or the sidebar skips it. The backend checks
        // Membership_Management "manage" — the same rule that picks who
        // receives ride safety reports.
        path: relativePath.home.rides,
        name: "Ride to church",
        element: <RidesManager />,
        isPrivate: true,
        // Falls back to Membership management for roles saved before Rides
        // existed; each tab is gated by its own action.
        permissionNeeded: "view_rides",
        sideTab: true,
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
            path: relativePath.home.visitors.guests,
            name: "Guests",
            element: <Guests />,
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
        backLabel: "Visitor",
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
            path: "events",
            name: "Scheduled Events",
            element: <EventsManagement />,
            isPrivate: true,
            permissionNeeded: "view_events",
            sideTab: true,
          },
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
            path: "event-schedules",
            name: "Event Schedules",
            backLabel: "Event schedules",
            element: <EventSchedulesByEvent />,
            isPrivate: true,
            permissionNeeded: "view_events",
          },
        ],
      },
      {
        path: relativePath.home.reports.main,
        name: "Reports",
        isPrivate: true,
        permissionNeeded: REPORTS_MENU_ACCESS,
        sideTab: true,
        children: [
          {
            path: "",
            name: "Reports Default",
            element: <ReportsHome />,
            isPrivate: true,
            redirectOnly: true,
          },
          {
            path: "executive-summary",
            name: "Executive summary",
            element: <ExecutiveSummary />,
            isPrivate: true,
            permissionNeeded: EXECUTIVE_SUMMARY_ACCESS,
            sideTab: true,
          },
          {
            path: "department",
            name: "Department reports",
            element: <DepartmentReports />,
            isPrivate: true,
            permissionNeeded: DEPARTMENT_REPORTS_ACCESS,
            sideTab: true,
          },
          {
            path: "department/:key",
            name: "Department Report",
            backLabel: "Department report",
            element: <DepartmentReportDetail />,
            isPrivate: true,
            permissionNeeded: DEPARTMENT_REPORTS_ACCESS,
          },
          {
            path: "event-reports",
            name: "Event reports",
            element: <EventReports />,
            isPrivate: true,
            permissionNeeded: ["view_reports", "view_events"],
            sideTab: true,
          },
          {
            path: "event-reports/:id",
            name: "Event Report Details",
            backLabel: "Event report",
            element: <EventReportDetails />,
            isPrivate: true,
            permissionNeeded: ["view_reports", "view_events"],
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
        backLabel: "Event",
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
            path: "event-attendance",
            name: "Event Attendance",
            element: <EventAttendance />,
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
            // No permissionNeeded: the redirect picks the first child the
            // user can access (each child enforces its own permission).
            path: "",
            name: "Communication Default",
            element: <CommunicationIndexRedirect />,
            isPrivate: true,
            redirectOnly: true,
          },
          {
            path: "theme-manager",
            name: "Annual Theme Manager",
            element: <AnnualThemeManager />,
            isPrivate: true,
            permissionNeeded: "view_theme",
            sideTab: true,
          },
          {
            path: "community",
            name: "Community",
            element: <CommunityManager />,
            isPrivate: true,
            permissionNeeded: "view_community",
            sideTab: true,
          },
          {
            // Community replaced Announcements; keep old bookmarks working.
            path: "announcements",
            name: "Announcements Redirect",
            element: <Navigate to="/home/communication/community" replace />,
            isPrivate: true,
            permissionNeeded: "view_community",
          },
          {
            path: "promotions",
            name: "Promotions",
            element: <PromotionManager />,
            isPrivate: true,
            permissionNeeded: "view_promotions",
            sideTab: true,
          },
          {
            path: "sermons",
            name: "Sermons",
            element: <SermonManager />,
            isPrivate: true,
            permissionNeeded: "view_sermons",
            sideTab: true,
          },
          {
            path: "messaging",
            name: "Messaging",
            element: <MessagingManager />,
            isPrivate: true,
            permissionNeeded: "view_messaging",
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
          {
            path: "settings",
            name: "Settings",
            element: <AppointmentSettings />,
            isPrivate: true,
            permissionNeeded: "manage_appointments",
            sideTab: true,
          },
        ],
      },

      {
        path: "requests",
        name: "Requisition",
        isPrivate: true,
        sideTab: true,
        children: [
          {
            path: "",
            name: "My Requisition",
            element: <MyRequisitionsPage />,
            isPrivate: true,
            sideTab: true,
          },
          {
            // Managers see every submitted requisition; approvers see the
            // ones that pass through their steps (scoped by the backend).
            // Anyone else is sent back to My Requisition.
            path: "staff_requests",
            name: "Requisitions",
            element: <AllRequisitionsPage />,
            isPrivate: true,
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <RequisitionsAnalytics />,
            isPrivate: true,
            permissionNeeded: "view_requisition",
            sideTab: true,
          },
          {
            path: "request",
            name: "New Requisition",
            element: <Navigate to="/home/requests?new=1" replace />,
            isPrivate: true,
          },
          {
            path: "request/:id",
            name: "Edit Requisition",
            element: <LegacyRequestRedirect />,
            isPrivate: true,
          },
          {
            // Notification deep links: /home/requests/{base64 id}.
            path: ":id",
            name: "Requisition Details",
            backLabel: "Requisition",
            element: <RequisitionDeepLinkPage />,
            isPrivate: true,
          },
        ],
      },
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
            element: <Suspense fallback={null}><AssetManager /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_asset",
            sideTab: true,
          },
          {
            path: "reconciliation",
            name: "Reconciliation",
            element: <Suspense fallback={null}><AssetReconciliation /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_asset",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: <Suspense fallback={null}><AssetAnalytics /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_asset",
            sideTab: true,
          },
        ],
      },
      {
        // Stock-check notification links. Department heads count their own
        // items here without needing Asset access; the server scopes the list.
        // Kept outside the Assets menu so it doesn't show for everyone.
        path: "assets/count",
        name: "Stock check",
        backLabel: "Stock check",
        element: <Suspense fallback={null}><AssetCountPage /></Suspense>,
        isPrivate: true,
      },
      {
        path: "assets/manage-asset",
        name: "Manage Asset",
        element: <Navigate to="/home/assets" replace />,
        isPrivate: true,
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
            element: <Suspense fallback={null}><FinanceManager /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_financials",
            sideTab: true,
          },
          {
            path: "create",
            name: "New weekly record",
            element: <Suspense fallback={null}><FinanceRecord /></Suspense>,
            backLabel: "Weekly record",
            isPrivate: true,
            // The page gates drafts and submitting by action.
            permissionNeeded: "view_financials",
          },
          {
            path: "configuration",
            name: "Configuration",
            element: <Suspense fallback={null}><FinanceConfiguration /></Suspense>,
            isPrivate: true,
            // The page gates each section by action (configure, configure_approvals).
            permissionNeeded: "view_financials",
            sideTab: true,
          },
          {
            path: "giving-options",
            name: "Manage Giving Options",
            element: <Suspense fallback={null}><GivingOptions /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_giving",
            sideTab: true,
          },
          {
            // Option details now live on the overview cards and contributions.
            path: "giving-options/:id",
            name: "Giving Option Detail",
            element: <Navigate to="/home/finance/giving-options" replace />,
            isPrivate: true,
            permissionNeeded: "view_giving",
          },
          {
            path: "giving-contributions",
            name: "Giving Contributions",
            element: <Suspense fallback={null}><GivingContributions /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_giving",
            sideTab: true,
          },
          {
            path: "pledges",
            name: "Pledges",
            element: <Suspense fallback={null}><Pledges /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_pledges",
            sideTab: true,
          },
          {
            // Pledges are created from a dialog on the Pledges page.
            path: "pledges/create",
            name: "Create Pledge",
            element: <Navigate to="/home/finance/pledges" replace />,
            isPrivate: true,
            permissionNeeded: "manage_pledges",
          },
          {
            path: "pledges/:id",
            name: "Pledge Detail",
            element: <Suspense fallback={null}><PledgeDetail /></Suspense>,
            backLabel: "Pledge",
            isPrivate: true,
            permissionNeeded: "view_pledges",
          },
          {
            path: "pledges/:id/edit",
            name: "Edit Pledge",
            element: <Suspense fallback={null}><PledgeDetail /></Suspense>,
            backLabel: "Pledge",
            isPrivate: true,
            permissionNeeded: "manage_pledges",
          },
          {
            path: ":id",
            name: "Weekly record",
            element: <Suspense fallback={null}><FinanceRecord /></Suspense>,
            backLabel: "Weekly record",
            isPrivate: true,
            permissionNeeded: "view_financials",
          },
        ],
      },
      {
        path: relativePath.home.lifeCenter.main,
        name: "Life Centers",
        isPrivate: true,
        permissionNeeded: "view_life_center",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Life Centers",
            element: <Suspense fallback={null}><LifeCenterList /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_life_center",
            sideTab: true,
          },
          {
            path: relativePath.home.lifeCenter.detail,
            name: "Life Center",
            element: <Suspense fallback={null}><LifeCenterDetail /></Suspense>,
            backLabel: "Life center",
            isPrivate: true,
            permissionNeeded: "view_life_center",
          },
          {
            path: "roles",
            name: "Life Center Roles",
            // Roles are managed from the list page's "Manage roles" dialog.
            element: <Navigate to=".." relative="path" replace />,
            isPrivate: true,
            permissionNeeded: "manage_life_center",
          },
          {
            path: "life-center-analytics",
            name: "Life Centers Analytic",
            element: <Suspense fallback={null}><LifeCenterAnalytics /></Suspense>,
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
            name: "Overview",
            element: (
              <Suspense fallback={null}>
                <MarketplaceOverview />
              </Suspense>
            ),
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
          {
            path: "markets",
            name: "Markets",
            element: (
              <Suspense fallback={null}>
                <MarketPlace />
              </Suspense>
            ),
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
          {
            path: "products",
            name: "Products",
            element: (
              <Suspense fallback={null}>
                <AllProducts />
              </Suspense>
            ),
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
          {
            path: "orders",
            name: "Orders",
            element: (
              <Suspense fallback={null}>
                <AllOrders />
              </Suspense>
            ),
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
          {
            path: "analytics",
            name: "Analytics",
            element: (
              <Suspense fallback={null}>
                <MarketplaceAnalytics />
              </Suspense>
            ),
            isPrivate: true,
            permissionNeeded: "view_marketplace",
            sideTab: true,
          },
        ],
      },
      {
        path: relativePath.home.marketPlace.orderDetails,
        name: "Order Details",
        backLabel: "Order",
        element: (
          <Suspense fallback={null}>
            <AdminOrderDetail />
          </Suspense>
        ),
        isPrivate: true,
        permissionNeeded: "view_marketplace",
      },
      {
        path: relativePath.home.marketPlace.details,
        name: "Market Details",
        backLabel: "Market",
        element: (
          <Suspense fallback={null}>
            <MarketDetails />
          </Suspense>
        ),
        isPrivate: true,
        permissionNeeded: "view_marketplace",
      },
      {
        path: relativePath.home.marketPlace.addProduct,
        name: "Add Product",
        element: (
          <Suspense fallback={null}>
            <AddProduct />
          </Suspense>
        ),
        isPrivate: true,
        permissionNeeded: "manage_marketplace",
      },
      {
        path: relativePath.home.marketPlace.editProduct,
        name: "Edit Product",
        element: (
          <Suspense fallback={null}>
            <AddProduct />
          </Suspense>
        ),
        isPrivate: true,
        permissionNeeded: "manage_marketplace",
      },

      {
        path: relativePath.home.ministrySchool.main,
        name: "School of Ministry",
        element: <SomDataProvider />,
        isPrivate: true,
        permissionNeeded: "view_school_of_ministry",
        sideTab: true,
        children: [
          {
            path: "",
            name: "Dashboard",
            element: <SomDashboard />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "programs",
            name: "Programs",
            element: <ProgramsPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "programs/:id",
            name: "Program",
            element: <ProgramWorkspace />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
          },
          {
            path: "cohorts",
            name: "Cohorts",
            element: <CohortsPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "cohorts/:id",
            name: "Cohort",
            element: <CohortWorkspace />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
          },
          {
            path: "learners",
            name: "Learners",
            element: <LearnersPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "instructors",
            name: "Instructors",
            element: <InstructorsPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "assessment-library",
            name: "Assessment library",
            element: <AssessmentLibraryPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "content-library",
            name: "Content library",
            element: <ContentLibraryPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: "reports",
            name: "Reports",
            element: <ReportsPage />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
          },
          {
            path: relativePath.home.ministrySchool.instructorPortal,
            name: "Grading",
            element: <Instructor isAdmin />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            sideTab: true,
            children: [
              {
                path: "",
                name: "Instructor Programs",
                element: <InstructorProg />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: relativePath.home.ministrySchool.instructorCohort,
                name: "Instructor Cohorts",
                element: <InstructorCohort />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: relativePath.home.ministrySchool.instructorAssMan,
                name: "Instructor Assignments",
                element: <InstructorAssMan />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: relativePath.home.ministrySchool.instructorGradingPanel,
                name: "Instructor Grading Panel",
                element: <GradingPanel />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
            ],
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
            path: "",
            name: "",
            element: <ViewPageTemplate />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
            children: [
              {
                path: "cohorts/:cohortId/classes/:id",
                name: "View Class",
                element: <ViewClass />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
              {
                path: "cohorts/:cohortId/classes/:classId/student/:id",
                name: "View Student",
                element: <ViewStudent />,
                isPrivate: true,
                permissionNeeded: "view_school_of_ministry",
              },
            ],
          },
          {
            path: "programs/:programId/cohort/:cohortId",
            name: "",
            element: <LegacyCohortRedirect />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
          },
          {
            path: "programs/:programId/cohort/:cohortId/class/:classId",
            name: "",
            element: <LegacyCohortRedirect />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
          },
          {
            path: "programs/:programId/cohort/:cohortId/class/:classId/student/:studentId",
            name: "",
            element: <LegacyCohortRedirect />,
            isPrivate: true,
            permissionNeeded: "view_school_of_ministry",
          },
        ],
      },
      {
        path: "ministry-school/programs/cohort/class/student/certificate",
        name: "View Certificate",
        element: <ViewCertificate />,
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
            element: <Suspense fallback={null}><GeneralConfiguration /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_settings",
            sideTab: true,
          },
          {
            path: "access-rights",
            name: "Access Rights",
            element: <Suspense fallback={null}><AccessRightsList /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_access_rights",
            sideTab: true,
          },
          {
            path: "access-rights/manage-access",
            name: "Manage Access",
            element: <Navigate to="/home/settings/access-rights" replace />,
            isPrivate: true,
            permissionNeeded: "view_access_rights",
          },
          {
            path: "access-rights/:roleId",
            name: "Role",
            element: <Suspense fallback={null}><RoleDetail /></Suspense>,
            backLabel: "Access level",
            isPrivate: true,
            permissionNeeded: "view_access_rights",
          },
          {
            path: "users",
            name: "Users",
            element: <Suspense fallback={null}><UsersPage /></Suspense>,
            isPrivate: true,
            permissionNeeded: ["manage_access_rights", "manage_members"],
            sideTab: true,
          },
          {
            path: "approvals",
            name: "Approvals",
            element: <Suspense fallback={null}><ApprovalsPage /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_settings",
            sideTab: true,
          },
          {
            path: "visitor-follow-ups",
            name: "Visitor Follow-ups",
            element: <Suspense fallback={null}><VisitorFollowUpsSettings /></Suspense>,
            isPrivate: true,
            permissionNeeded: "view_settings",
            sideTab: true,
          },
          {
            path: "ai-console",
            name: "AI Console",
            element: <AIConsole />,
            isPrivate: true,
            permissionNeeded: { domain: "AI", action: "view" },
            sideTab: true,
          },
          {
            path: "approval",
            name: "Approval",
            element: <Navigate to="/home/settings/approvals" replace />,
            isPrivate: true,
            permissionNeeded: "view_settings",
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
  {
    path: "/out",
    element: <LandingPage />,
    name: "out",
    children: [
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
        path: "register-visitor",
        element: <VisitorRegistration />,
        name: "VisitorRegistration",
        isPrivate: false,
      },
      {
        path: "products",
        name: "products",
        element: (
          <Suspense fallback={null}>
            <ProductsPage />
          </Suspense>
        ),
        isPrivate: false,
      },
      {
        path: "products/:id",
        name: "ProductDetailsPage",
        element: (
          <Suspense fallback={null}>
            <ProductDetailsPage />
          </Suspense>
        ),
        isPrivate: false,
      },
      {
        path: "products/check-out",
        name: "Check Out",
        element: (
          <Suspense fallback={null}>
            <CheckOutPage />
          </Suspense>
        ),
        isPrivate: false,
      },
      {
        path: "verify-payment/:type",
        name: "Verify payment",
        element: (
          <Suspense fallback={null}>
            <VerifyPayment />
          </Suspense>
        ),
        isPrivate: false,
      },
      {
        path: "giving-complete",
        name: "Giving Complete",
        element: <GivingComplete />,
        isPrivate: false,
      },
      {
        path: "pledge-complete",
        name: "Pledge Complete",
        element: <PledgeComplete />,
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
    // Public links from the backend point here. The page draws its own
    // header and footer, so it sits outside the /out LandingPage layout.
    path: "/out/events/register-event",
    name: "Event Registration",
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
        backLabel: "Home",
        element: <DashBoardPage />,
        isPrivate: false,
      },
      {
        path: relativePath.member.profile,
        name: "member_profile",
        backLabel: "My profile",
        element: <ProfileDetails />,
        isPrivate: false,
        children: [
          {
            path: "",
            name: "member_profile_info",
            element: <MemberInformation />,
            isPrivate: false,
          },
        ],
      },
      {
        path: relativePath.member.market,
        name: "Member Market",
        backLabel: "Marketplace",
        element: (
          <Suspense fallback={null}>
            <Market />
          </Suspense>
        ),
        isPrivate: false,

        children: [
          {
            path: relativePath.member.market,
            name: "Products",
            element: (
              <Suspense fallback={null}>
                <ProductsPage />
              </Suspense>
            ),
            isPrivate: false,
          },
          {
            path: relativePath.member.productDetails,
            name: "Product Details",
            element: (
              <Suspense fallback={null}>
                <ProductDetailsPage />
              </Suspense>
            ),
            isPrivate: false,
          },

          {
            path: relativePath.member.checkOut,
            name: "Check Out",
            element: (
              <Suspense fallback={null}>
                <CheckOutPage />
              </Suspense>
            ),
            isPrivate: false,
          },
          {
            path: relativePath.member.orders,
            name: "Orders",
            backLabel: "My orders",
            element: (
              <Suspense fallback={null}>
                <MyOrders />
              </Suspense>
            ),
            isPrivate: false,
          },
          {
            path: relativePath.member.orderDetails,
            name: "Order Details",
            backLabel: "Order",
            element: (
              <Suspense fallback={null}>
                <OrderDetailsPage />
              </Suspense>
            ),
            isPrivate: false,
          },
          {
            path: relativePath.member.verify_payment,
            name: "Verify Payment",
            element: (
              <Suspense fallback={null}>
                <VerifyPayment />
              </Suspense>
            ),
            isPrivate: false,
          },
        ],
      },

      {
        // Sections (meetings, souls-won, members, analytics) are picked from the header's More menu.
        path: `${relativePath.member.lifeCenter}/:section?`,
        name: "member_life_center",
        backLabel: "My life center",
        element: <MyLifeCenter />,
        isPrivate: false,
      },
      {
        path: relativePath.member.giving,
        name: "member_giving",
        backLabel: "Giving",
        element: <MemberGiving />,
        isPrivate: false,
      },
      {
        // Must be declared before nothing else claims it — Paystack returns the
        // browser here, so the path is part of the payment contract with the
        // backend (GIVING_WEB_CALLBACK_PATH).
        path: relativePath.member.givingComplete,
        name: "member_giving_complete",
        element: <MemberGivingComplete />,
        isPrivate: false,
      },
      {
        path: relativePath.member.pledges,
        name: "member_pledges",
        backLabel: "Pledges",
        element: <MemberPledges />,
        isPrivate: false,
      },
      {
        // Paired with PLEDGE_WEB_CALLBACK_PATH on the backend.
        path: relativePath.member.pledgesComplete,
        name: "member_pledges_complete",
        element: <MemberPledgeComplete />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.main,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <LearnerDashboard />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.allPrograms,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <AllPrograms />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.myEnrolledPrograms,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <MyPrograms />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.assignments,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <LearnerAssignments />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.assignmentDetails,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <LearnerSubmission />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.grades,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <LearnerGrades />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.schedule,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <LearnerSchedule />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.announcements,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <LearnerAnnouncements />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.programDetails,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <EnrolledProgram />,
        isPrivate: false,
      },
      {
        path: relativePath.member.schoolOfMinistries.instructorPortal,
        name: "member_school_of_ministries",
        backLabel: "School of Ministry",
        element: <Instructor />,
        isPrivate: false,
        children: [
          {
            path: "",
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
        backLabel: "Appointments",
        element: <MyAppointments />,
        isPrivate: false,
      },
      {
        path: relativePath.member.notifications,
        name: "member_notifications",
        backLabel: "Notifications",
        element: <NotificationCenterPage />,
        isPrivate: false,
      },
      {
        path: relativePath.member.community,
        name: "member_community",
        backLabel: "Community",
        element: <CommunityLayout />,
        isPrivate: false,
        children: [
          {
            path: "",
            name: "member_community",
            backLabel: "Community",
            element: <MemberCommunityPage />,
            isPrivate: false,
          },
          {
            path: relativePath.member.communityPost,
            name: "member_community",
            element: <CommunityPostPage />,
            backLabel: "Post",
            isPrivate: false,
          },
        ],
      },
      {
        path: relativePath.member.rides,
        name: "member_rides",
        backLabel: "Rides",
        element: <RidesLayout />,
        isPrivate: false,
        children: [
          {
            path: "",
            name: "member_rides",
            backLabel: "Rides",
            element: <RidesHubPage />,
            isPrivate: false,
          },
          {
            path: relativePath.member.rideOffer,
            name: "member_rides",
            backLabel: "Rides",
            element: <RideOfferPage />,
            isPrivate: false,
          },
          {
            path: relativePath.member.rideFind,
            name: "member_rides",
            backLabel: "Rides",
            element: <RideFindPage />,
            isPrivate: false,
          },
          {
            path: relativePath.member.myRide,
            name: "member_rides",
            backLabel: "Rides",
            element: <MyRidePage />,
            isPrivate: false,
          },
        ],
      },
      {
        // Community replaced Announcements; old links and push actionUrls
        // still land in the right place.
        path: "/member/announcements/*",
        name: "member_community",
        backLabel: "Community",
        element: <Navigate to={relativePath.member.community} replace />,
        isPrivate: false,
      },
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
  (route) => route.path === relativePath.home.main,
);
const homePageChildren = homePageRoute?.children || [];

export const sideTabs = homePageChildren.filter(
  (childRoute) => childRoute.sideTab,
);

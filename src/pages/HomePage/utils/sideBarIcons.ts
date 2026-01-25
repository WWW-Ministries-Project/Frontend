import { MembersIcon } from "@/assets";
import AppointmentIcon from "@/assets/sidebar/AppointmentIcon";
import AttendanceIcon from "@/assets/sidebar/AttendanceIcon";
import CommunicationIcon from "@/assets/sidebar/CommunicationIcon";
import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import FinanceIcon from "@/assets/sidebar/FinanceIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";
import LifeCenterIcon from "@/assets/sidebar/LifeCenterIcon";
import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import { MarketIcon } from "@/assets/sidebar/MarketIcon";
import MinistrySchoolIcon from "@/assets/sidebar/MinistrySchoolIcon";
import RequestIcon from "@/assets/sidebar/RequestIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import UsersIcon from "@/assets/sidebar/UsersIcon";
import VisitorIcon from "@/assets/sidebar/VisitorIcon";
export const sidebarIcons: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
  Visitors: VisitorIcon,
  Users: UsersIcon,
  Events: ManagementIcon,
  Attendance: AttendanceIcon,
  Communication: CommunicationIcon,
  Appointments: AppointmentIcon,
  Assets: InstrumentIcon,
  Finance: FinanceIcon,
  "School of Ministry": MinistrySchoolIcon,
  Settings: SettingsIcon,
  Requests: RequestIcon,
  "Life Centers": LifeCenterIcon,
  "Market Place": MarketIcon,
};

import DashboardIcon from "@/assets/sidebar/DashboardIcon";
import InstrumentIcon from "@/assets/sidebar/InstrumentIcon";

import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import MembersIcon from "@/assets/sidebar/MembersIcon";
import SettingsIcon from "@/assets/sidebar/SettingIcon";
import PropTypes from "prop-types";
// import { sideTabs } from "../utils/helperFunctions";
import NavigationLink from "./NavigationLink";
import SideBarSubMenu from "./SidebarSubmenu";
import { sideTabs } from "/src/routes/appRoutes";
import RequestIcon from "@/assets/sidebar/RequestIcon";
import MinistrySchoolIcon from "@/assets/sidebar/MinistrySchoolIcon";
import VisitorIcon from "@/assets/sidebar/VisitorIcon";
const icons = {
  Dashboard: DashboardIcon,
  Members: MembersIcon,
  Visitors: VisitorIcon,
  "Users": MembersIcon, // TODO: replace this
  // Attendance: AttendanceIcon,
  Events: ManagementIcon,
  // Finance: FinanceIcon,
  Assets: InstrumentIcon,
  Settings: SettingsIcon,
  Requests: RequestIcon,
  "School of Ministry": MinistrySchoolIcon,
};

const SideBarMobile = ({ show, ...props }) => {
  const items = sideTabs;
 

  return (
    <div
      className={`absolute  top-14 left-0 h-full bg-white transition-transform duration-300 ease-in-out transform overflow-auto ${
        show ? "translate-x-0" : "-translate-x-full"
      } z-50`}

    >
      <div className="h-full w-[250px] p-4">
        {/* navigation links */}
        <div className=" overflow-y-auto">
          {items.map((item, index) => {
            const IconComponent = icons[item.name];

            if (!IconComponent) {
              console.error(`Icon component for ${item.name} not found`);
              return null;
            }
            // return permissions["view_" + item["key"]] && (
            return (
              <div key={item.name}>
                {item.children ? (
                  <SideBarSubMenu
                    item={item}
                    parentPath={item.path}
                    show={show}
                  >
                    {" "}
                    <IconComponent
                      className={`${
                        show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`}
                    />{" "}
                  </SideBarSubMenu>
                ) : (
                  <NavigationLink item={item} index={index} show={show}>
                    <IconComponent
                      className={`${
                        show ? "mr-2" : "min-w-[1rem] min-h-[20px]"
                      }`}
                    />{" "}
                    {show && item.name}
                  </NavigationLink>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

SideBarMobile.propTypes = {
  onClick: PropTypes.func,
  style: PropTypes.object,
  show: PropTypes.bool,
  className: PropTypes.string,
};

export default SideBarMobile;

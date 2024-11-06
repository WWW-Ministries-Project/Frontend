import ManagementIcon from "@/assets/sidebar/ManagementIcon";
import { Children, ReactNode, useState } from "react";
// import NavigationLink from "./NavigationLink";
import { NavLink } from "react-router-dom";

interface ChildItem {
  key: string;
  name: string;
  path: string;
  sideTab?: boolean;
}

interface SideBarSubMenuProps {
  item: {
    name: string;
    children: ChildItem[];
    show: boolean;
  };
  parentPath: string;
  children: ReactNode;
  show: boolean;
}

const icons = {
  "My Requests": ManagementIcon, // TODO: replace this
  "Staff Requests": ManagementIcon, // TODO: replace this
  Suppliers: ManagementIcon, // TODO: replace this
};

const SideBarSubMenu = ({
  item,
  parentPath,
  children,
  show,
}: SideBarSubMenuProps) => {
  const [showChildren, setShowChildren] = useState(false);
  const returnChild = (child: ChildItem) => {
    return {
      path: `${parentPath}/${child.path}`,
      name: child.name,
    };
  };
  return (
    <div className="flex flex-col transition z-10 p-2 ml-3 whitespace-nowrap ">
      <NavLink
        to={`${parentPath}/${item.children[0].path}`}
        onClick={() => setShowChildren(!showChildren)}
        className={({ isActive }) =>`hover:border-[#6539C3] hover:border hover:border-1 hover:shadow-inner hover:shadow-xl  transition h-10 z-10 flex items-center py-7 lg:my-3 my-2 rounded-xl ${isActive || showChildren
              ? "bg-[#6539C310] border-[#6539C3] text-[#6539C3] border border-1 shadow-inner drop-shadow shadow-xl transition"
              : "hover:text-primaryViolet"}`}
      >
        {children}
        <p className="cursor-pointer">{show && item.name}</p>
        <p className={`${showChildren ? "rotate-[270deg]" : "rotate-90"}`}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.43469 13.4183C6.1799 13.1525 6.18882 12.7305 6.45461 12.4757L10.0569 9.0224L6.60367 5.42006C6.34888 5.15427 6.35779 4.73226 6.62359 4.47747C6.88938 4.22267 7.31139 4.23159 7.56618 4.49738L11.4808 8.58098C11.7356 8.84677 11.7267 9.26878 11.4609 9.52358L7.37729 13.4382C7.1115 13.693 6.68949 13.6841 6.43469 13.4183Z"
              fill="#000"
            />
          </svg>
        </p>
      </NavLink>

      <div className={`${showChildren ? "" : "hidden"}`}>
        {item.children.map((child, index) => {
          return (
            child.sideTab ?

              
            <NavigationLink
              item={returnChild(child)}
              show={show}
            >
            </NavigationLink> :<></>
          );
        })}
      </div>
    </div>
  );
};

export default SideBarSubMenu;

const NavigationLink = ({
  item,show
}: {
  item: { path: string; name: string };
  show: boolean;
}) => {
  return (
    <div key={item.path}>
      <NavLink to={item.path}className={({ isActive }) =>
          `hover:border-[#6539C3] hover:border hover:border-1 hover:shadow-inner hover:shadow-xl hover:bg-primaryViolet  transition h-10 z-10 flex items-center py-4 lg:my-3 px-4 my-1 rounded-xl ${
            isActive
              ? "bg-primaryViolet text-white border border-1 shadow-inner drop-shadow shadow-xl transition"
              : "hover:text-white"
          } `
        }>{item.name}</NavLink>
    </div>
  );
};
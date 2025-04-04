import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import NavigationLink from "./NavigationLink";

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
    path: string;
  };
  parentPath: string;
  children: ReactNode;
  show: boolean;
  showChildren: boolean;
  toggleSubMenu: () => void; // 🔥 Toggle function passed from `SideBar`
}

const SideBarSubMenu = ({ item, parentPath, children, show, showChildren, toggleSubMenu }: SideBarSubMenuProps) => {
  const location = useLocation();

  const returnChild = (child: ChildItem) => {
    return {
      path: `${parentPath}${child.path ? "/" + child.path : ""}`,
      name: child.name,
    };
  };

  // ✅ Corrected Active Route Detection
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(item.path) ||
    location.pathname.includes(item.path);

  return (
    <div>
      {show ? (
        <div>
          {/* Main Parent Menu */}
          <div
            onClick={toggleSubMenu} // 🔥 Toggle submenu on click
            className={`text-primary transition z-10  cursor-pointer  ${
              (showChildren || isActive) ? "text-primary bg-lightGray transition rounded-tl-xl" : "rounded-s-xl"
            }
            ${
              (!showChildren && isActive) ? "text-primary bg-lightGray transition rounded-s-xl" : ""
            }
            
            `}
          >
            <div className="flex items-center mx-2 justify-between gap-1">
              <div className="flex items-center gap-2 transition py-4 rounded-xl">
                {children}
                <p className="cursor-pointer">{item.name}</p>
              </div>
              {/* Dropdown Arrow */}
              <p className={`${showChildren ? "rotate-180" : "rotate-0"} transition-transform`}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.43469 13.4183C6.1799 13.1525 6.18882 12.7305 6.45461 12.4757L10.0569 9.0224L6.60367 5.42006C6.34888 5.15427 6.35779 4.73226 6.62359 4.47747C6.88938 4.22267 7.31139 4.23159 7.56618 4.49738L11.4808 8.58098C11.7356 8.84677 11.7267 9.26878 11.4609 9.52358L7.37729 13.4382C7.1115 13.693 6.68949 13.6841 6.43469 13.4183Z"
                    fill="currentColor"
                  />
                </svg>
              </p>
            </div>
          </div>

          {/* 🔥 Submenu Items (Only Show When `showChildren` is true) */}
          {showChildren && (
            <div className={`  pl-3 ${(showChildren ) ? "rounded-bl-xl bg-lightGray" : ""}
            ${(showChildren && isActive) ? "rounded-bl-xl" : ""}
            `}>
              {item.children.map((child) => (
                child.sideTab ? (
                  <NavigationLinks
                    key={child.name + child.path}
                    item={returnChild(child)}
                  />
                ) : null
              ))}
            </div>
          )}
        </div>
      ) : (
        <NavigationLink item={item} show={show}>
          {children}
        </NavigationLink>
      )}
    </div>
  );
};

export default SideBarSubMenu;

const NavigationLinks = ({ item }: { item: { path: string; name: string } }) => {
  return (
    <div key={item.path + item.name}>
      <NavLink
        end
        to={item.path}
        className={({ isActive }) =>
          `hover:border-[#6539C310] hover:border hover:shadow-inner hover:bg-[#6539C310] transition h-10 z-10 flex items-center py-4 px-4 ${
            isActive ? "bg-[#6539C310] text-primary transition" : "hover:text-primary"
          }`
        }
      >
        {item.name}
      </NavLink>
    </div>
  );
};

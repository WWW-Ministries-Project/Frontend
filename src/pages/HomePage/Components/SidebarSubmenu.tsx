import { AppRoute } from "@/routes/appRoutes";
import { ReactNode, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import { NavigationLink } from "./NavigationLink";

interface IProps {
  item: {
    name: string;
    children: AppRoute[];
    path: string;
  };
  parentPath: string;
  children: ReactNode;
  show: boolean;
  showChildren: boolean;
  toggleSubMenu: () => void;
}

export const SideBarSubMenu = ({
  item,
  parentPath,
  children,
  show,
  showChildren,
  toggleSubMenu,
}: IProps) => {
  const location = useLocation();
  const {
    user: { permissions },
  } = useAuth();

  // Compute active state for parent
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(item.path) ||
    location.pathname.includes(item.path);

  // Filter children by permissions and sideTab
  const filteredChildren = useMemo(
    () =>
      item.children.filter(
        (child) =>
          child.sideTab &&
          (!child.isPrivate ||
            !child.permissionNeeded ||
            permissions[child.permissionNeeded])
      ),
    [item.children, permissions]
  );

  // Build child route path
  const getChildPath = (child: AppRoute) =>
    `${parentPath}${child.path ? "/" + child.path : ""}`;

  return (
    <div>
      {show ? (
        <div>
          {/* Active indicator shape - top */}
          {(isActive || showChildren) && (
            <div className="flex justify-end">
              <div className="shape"></div>
            </div>
          )}

          {/* Main Parent Menu */}
          <div
            onClick={toggleSubMenu}
            className={`text-primary transition z-10 cursor-pointer ${
              showChildren || isActive
                ? "text-primary bg-lightGray rounded-tl-xl"
                : "rounded-s-xl"
            }
            ${
              !showChildren && isActive
                ? "text-primary bg-lightGray rounded-s-xl"
                : ""
            }`}
          >
            <div className="flex items-center mx-2 justify-between gap-1">
              <div className="flex items-center gap-2 transition py-4 rounded-xl">
                {children}
                <p className="cursor-pointer">{item.name}</p>
              </div>
              {/* Dropdown Arrow */}
              <span
                className={`${
                  showChildren ? "rotate-180" : "rotate-0"
                } transition-transform`}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.43469 13.4183C6.1799 13.1525 6.18882 12.7305 6.45461 12.4757L10.0569 9.0224L6.60367 5.42006C6.34888 5.15427 6.35779 4.73226 6.62359 4.47747C6.88938 4.22267 7.31139 4.23159 7.56618 4.49738L11.4808 8.58098C11.7356 8.84677 11.7267 9.26878 11.4609 9.52358L7.37729 13.4382C7.1115 13.693 6.68949 13.6841 6.43469 13.4183Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </div>
          </div>

          {/* Submenu Items */}
          {showChildren && filteredChildren.length > 0 && (
            <div
              className={`pl-3 ${
                showChildren ? "rounded-bl-xl bg-lightGray" : ""
              } ${showChildren && isActive ? "rounded-bl-xl" : ""}`}
            >
              {filteredChildren.map((child) => (
                <div key={child.name + child.path}>
                  <NavLink
                    end
                    to={getChildPath(child)}
                    className={({ isActive }) =>
                      ` hover:font-semibold transition h-10 z-10 flex items-center py-4 px-4 ${
                        isActive
                          ? "font-extrabold text-primary transition"
                          : "hover:text-primary"
                      }`
                    }
                  >
                    {child.name}
                  </NavLink>
                </div>
              ))}
            </div>
          )}

          {/* Active indicator shape - bottom */}
          {(isActive || showChildren) && (
            <div className="flex justify-end">
              <div className="Bshape"></div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Navigation link rendering */}
          {isActive && (
            <div className="flex justify-end">
              <div className="shape"></div>
            </div>
          )}
          <NavigationLink item={item} show={show}>
            {children}
          </NavigationLink>
          {isActive && (
            <div className="flex justify-end">
              <div className="Bshape"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { AppRoute } from "@/routes/appRoutes";
import { hasRequiredAccess } from "@/utils/accessControl";
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

const HOME_ROUTE_BASE = "/home";

const normalizePath = (path: string) => {
  const trimmed = path.replace(/\/+$/, "");
  if (!trimmed) return "/";
  return trimmed.replace(/\/{2,}/g, "/");
};

const resolveHomePath = (path: string) => {
  if (!path) return HOME_ROUTE_BASE;
  if (path.startsWith("/")) return normalizePath(path);
  return normalizePath(`${HOME_ROUTE_BASE}/${path}`);
};

const isPathActive = (pathname: string, path: string) => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedPath = normalizePath(path);
  return (
    normalizedPathname === normalizedPath ||
    normalizedPathname.startsWith(`${normalizedPath}/`)
  );
};

const joinRelativePaths = (base: string, child?: string) => {
  const normalizedBase = base.replace(/\/+$/, "");
  if (!child) return normalizedBase;
  return `${normalizedBase}/${child.replace(/^\/+/, "")}`;
};

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
    user: { permissions, access_permissions },
  } = useAuth();

  const parentRoutePath = useMemo(
    () => resolveHomePath(item.path),
    [item.path]
  );

  // Compute active state for parent using normalized absolute paths.
  const isActive = isPathActive(location.pathname, parentRoutePath);

  // Filter children by permissions and sideTab
  const filteredChildren = useMemo(
    () =>
      item.children.filter(
        (child) =>
          child.sideTab &&
          (!child.isPrivate ||
            hasRequiredAccess(
              child.permissionNeeded,
              access_permissions,
              permissions
            ))
      ),
    [access_permissions, item.children, permissions]
  );

  // Build child route path
  const getChildPath = (child: AppRoute) =>
    joinRelativePaths(parentPath, child.path);

  const collapsedLinkPath =
    filteredChildren.length > 0
      ? joinRelativePaths(parentPath, filteredChildren[0].path)
      : item.path;

  return (
    <div>
      {show ? (
        <div>
          {/* Active indicator shape - top */}
          {(isActive || showChildren) && (
            <div className="flex justify-end relative">
              <div className="scrollable-shape-top"></div>
            </div>
          )}

          {/* Main Parent Menu */}
          <div
            onClick={toggleSubMenu}
            className={`text-primary transition z-10 cursor-pointer ${
              showChildren || isActive
                ? "text-primary sidebar-active-surface rounded-tl-xl rounded-tr-xl lg:rounded-tr-none"
                : "rounded-s-xl"
            }
            ${
              !showChildren && isActive
                ? "text-primary sidebar-active-surface rounded-s-xl"
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
                showChildren ? "rounded-bl-xl rounded-br-xl lg:rounded-br-none sidebar-active-surface" : ""
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
            <div className="flex justify-end relative">
              <div className="scrollable-shape-bottom"></div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Navigation link rendering */}
          {isActive && (
            <div className="flex justify-end relative">
              <div className="scrollable-shape-top"></div>
            </div>
          )}
          <NavigationLink
            item={{ name: item.name, path: collapsedLinkPath }}
            show={show}
          >
            {children}
          </NavigationLink>
          {isActive && (
            <div className="flex justify-end relative">
              <div className="scrollable-shape-bottom"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

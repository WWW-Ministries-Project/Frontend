import { ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
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
  justifyCenter: boolean;
}

const SideBarSubMenu = ({
  item,
  parentPath,
  children,
  show,
}: SideBarSubMenuProps) => {
  const [showChildren, setShowChildren] = useState(false);
  const returnChild = (child: ChildItem) => {
    return {
      path: `${parentPath}${child.path ? "/" + child.path : ""}`,
      name: child.name,
    };
  };
  const isActive = false;
  return (
    <div className="">
      {show ? (
        <div
          onClick={() => setShowChildren(!showChildren)}
          className={`hover:border-[#6539C3] hover:border hover:border-1 hover:shadow-inner hover:shadow-xl text-dark900 px-2  transition  z-10 py- lg:my-3 my-2 rounded-xl ${
            showChildren
              ? " border-[#6539C3] text-[#6539C3]  border border-1 shadow-inner drop-shadow shadow-xl transition"
              : ""
          } `}
        >
          <>
            <div className="flex items-center mx-2 justify-between">
              <div
                className={`text-dark900  transition flex items-center py-4 justify-between  rounded-xl `}
              >
                {children}
                <p className="cursor-pointer">{item.name}</p>
              </div>
              {/*  dirxn icon */}
              <p
                className={`${showChildren ? "rotate-[270deg]" : "rotate-90"} `}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.43469 13.4183C6.1799 13.1525 6.18882 12.7305 6.45461 12.4757L10.0569 9.0224L6.60367 5.42006C6.34888 5.15427 6.35779 4.73226 6.62359 4.47747C6.88938 4.22267 7.31139 4.23159 7.56618 4.49738L11.4808 8.58098C11.7356 8.84677 11.7267 9.26878 11.4609 9.52358L7.37729 13.4382C7.1115 13.693 6.68949 13.6841 6.43469 13.4183Z"
                    fill="currentColor"
                  />
                </svg>
              </p>
            </div>
            <div className={`${showChildren ? "" : "hidden"}`} onClick={(e) => {e.stopPropagation()}}>
              {item.children.map((child) => {
                return child.sideTab ? (
                  <NavigationLinks
                    item={returnChild(child)}
                    key={child.name + child.path}
                  ></NavigationLinks>
                ) : (
                  <div key={child.name + child.path}></div>
                );
              })}
            </div>
          </>
        </div>
      ) : (
        <NavigationLink item={item} show={show} key={parentPath}>
          {children}
        </NavigationLink>
      )}
    </div>
  );
};

export default SideBarSubMenu;

const NavigationLinks = ({
  item,
}: {
  item: { path: string; name: string };
}) => {
  return (
    <div key={item.path + item.name}>
      <NavLink
        end
        to={item.path}
        className={({ isActive }) =>
          `hover:border-[#6539C310] hover:border  hover:shadow-inner hover:shadow-xl hover:bg-[#6539C310] transition h-10 z-10 flex items-center py-4 lg:my-3 px-4 my-1  ${
            isActive
              ? "bg-[#6539C310] text-primaryViolet     transition"
              : "hover:text-primaryViolet"
          } `
        }
      >
        {item.name}
      </NavLink>
    </div>
  );
};

import { ReactNode, useState } from "react";
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
  justifyCenter:boolean
}


const SideBarSubMenu = ({
  item,
  parentPath,
  children,
  show,
  justifyCenter=true
}: SideBarSubMenuProps) => {
  const [showChildren, setShowChildren] = useState(false);
  const returnChild = (child: ChildItem) => {
    return {
      path: `${parentPath}${child.path ? "/" + child.path : ""}`,
      name: child.name,
    };
  };
  return (
    <div className="">
     
      <NavLink
        to={`${parentPath}`}
        
        className={({ isActive }) =>
          `hover:border-[#6539C3] hover:border hover:border-1 hover:shadow-inner hover:shadow-xl text-dark900  transition  z-10 flex items-center py- lg:my-3 ${
            !show ? ( justifyCenter ? "justify-center" :'') : " py- mx-2"
          } my-2 rounded-xl ${
            isActive
              ? " border-[#6539C3] text-[#6539C3]  border border-1 shadow-inner drop-shadow shadow-xl transition"
              : ""
          } `
        }
      >
        <div className="grid w-full ">
          <NavLink to={`${parentPath}`} 
          className={({ isActive }) =>
            `  text-dark900  transition flex items-center py-4 justify-between  rounded-xl     ${
              isActive
                ? "bg-[#6539C320]  text-[#6539C3] transition"
                : "hover:text-primaryViolet "
            } ${show ? 'px-2' :''}`
          }
          >
            <div className={`${show ?"flex ":"mx-auto"}`}>
          {children}
        <p className="cursor-pointer">{show && item.name}</p>
        </div>
        {show &&<p className={`${showChildren ? "rotate-[270deg]" : "rotate-90"}`} onClick={(e) => {
          e.preventDefault()
          setShowChildren(!showChildren)
        }}>
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
        </p>}
          </NavLink >
          <div>
          {show && <div className={`${showChildren ? "" : "hidden"}`}>
        {item.children.map((child) => {
          return child.sideTab ? (
            <NavigationLink
              item={returnChild(child)}
              show={show}
              key={child.name}
            ></NavigationLink>
          ) : (
            <div key={child.name}></div>
          );
        })}
      </div>}
          </div>
        </div>
      </NavLink>

    </div>
  );
};

export default SideBarSubMenu;

const NavigationLink = ({
  item,
  show,
}: {
  item: { path: string; name: string };
  show: boolean;
}) => {
  return (
    <div key={item.path}>
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

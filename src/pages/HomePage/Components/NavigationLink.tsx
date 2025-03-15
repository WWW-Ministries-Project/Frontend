import React from "react";
import { NavLink } from "react-router-dom";

interface INavigationLinkProps {
  item: { path: string; name: string };
  show: boolean;
  children: React.ReactNode;
  justifyCenter?:boolean
}

export default function NavigationLink({
  item,
  show,
  children,
  justifyCenter=true
}: INavigationLinkProps) {
  return (
    <div>
      <NavLink
        to={item["path"]}
        className={({ isActive }) =>
          `hover:border-[#6539C3] hover:border hover:border-1 hover:shadow-inner  text-dark900  transition h-10 z-10 flex items-center py-7 lg:my-3 ${
            !show ? ( justifyCenter ? "justify-center" :'') : "px-2 py-7 mx-2"
          } my-2 rounded-xl ${
            isActive
              ? "bg-[#6539C310] border-[#6539C3] text-[#6539C3]  border border-1 shadow-inner drop-shadow  transition"
              : "hover:text-primaryViolet "
          } `
        }
        key={item.path + item.name}
      >
        {children}
      </NavLink>
    </div>
  );
}

import React from "react";
import { NavLink } from "react-router-dom";

interface INavigationLinkProps {
  item: { path: string; name: string };
  show: boolean;
  children: React.ReactNode;
  justifyCenter?: boolean;
}



export default function NavigationLink({
  item,
  show,
  children,
  justifyCenter = true,
}: INavigationLinkProps) {
  return (
    <div>
      

      <NavLink
        to={item.path}
        key={item.path + item.name}
        className={({ isActive }) =>
          `gap-2 text-dark900 transition h-10 z-10  flex items-center py-7 rounded-s-xl
           ${!show ? (justifyCenter ? "justify-center" : "") : "px-2 py-7"} 
           ${isActive ? "bg-lightGray text-dark900 " : "hover:text-dark900"}`
        }
      >
        {children}
      </NavLink>
      
    </div>
  );
}

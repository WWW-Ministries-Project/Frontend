import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface IProps {
  item: { path: string; name: string };
  show: boolean;
  children: ReactNode;
  justifyCenter?: boolean;
}

export function NavigationLink({
  item,
  show,
  children,
  justifyCenter = true,
}: IProps) {
  return (
    <div>
      <NavLink
        to={item.path}
        key={item.path + item.name}
        className={({ isActive }) =>
          `gap-2 text-primary transition h-10 z-10  flex items-center py-7 rounded-s-xl
           ${!show ? (justifyCenter ? "justify-center" : "") : "px-2 py-7"} 
           ${isActive ? "bg-lightGray text-primary " : "hover:text-primary"}`
        }
      >
        {children}
      </NavLink>
    </div>
  );
}

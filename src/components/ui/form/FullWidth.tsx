import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  $justify?: "left" | "center" | "right";
}
export const FullWidth = ({ children, $justify = "left" }: IProps) => {
  const justifyClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };
  return (
    <div className={`col-span-2 flex ${justifyClasses[$justify]}`}>
      {children}
    </div>
  );
};

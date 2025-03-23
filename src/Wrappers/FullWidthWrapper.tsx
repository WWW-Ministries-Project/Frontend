import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  $justify?: "left" | "center" | "right";
}
const FullWidthWrapper = ({ children, $justify = "left" }: IProps) => {
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

export default FullWidthWrapper;

import { ReactNode } from "react";

export const FormHeader = ({
  children,
  className = "bg-primary text-white p-6",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={` ${className} space-y-2  col-span-full`}>{children}</div>
  );
};

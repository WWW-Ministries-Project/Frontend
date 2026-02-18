import { ReactNode } from "react";

export const FormHeader = ({
  children,
  className = "rounded-t-2xl border-b border-lightGray bg-primary px-6 py-5 text-white",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`col-span-full space-y-1 ${className}`}>{children}</div>
  );
};

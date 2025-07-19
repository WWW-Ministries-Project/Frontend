import { ReactNode } from "react";

export const FormHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div className=" bg-primary text-white p-6 space-y-2  col-span-full">{children}</div>
  );
};

import { ReactNode } from "react";

export const FormHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div className=" text-primary H600 font-extrabold my-3 col-span-full">{children}</div>
  );
};

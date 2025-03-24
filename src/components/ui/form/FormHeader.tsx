import { ReactNode } from "react";

export const FormHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div className=" text-dark900 H600 font-extrabold my-5 col-span-full">{children}</div>
  );
};

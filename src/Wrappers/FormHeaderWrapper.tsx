import { ReactNode } from "react";

const FormHeaderWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className=" text-dark900 H600 font-extrabold my-5 col-span-2">{children}</div>
  );
};

export default FormHeaderWrapper;

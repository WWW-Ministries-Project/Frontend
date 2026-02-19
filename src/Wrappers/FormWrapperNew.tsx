import React from "react";

const FormWrapperNew = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return <div className="grid gap-4 md:grid-cols-2 md:gap-5">{children}</div>;
};

export default FormWrapperNew;

import React from "react";

const FormWrapperNew = ({ children }: { children: React.ReactNode }): JSX.Element => {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
};

export default FormWrapperNew;

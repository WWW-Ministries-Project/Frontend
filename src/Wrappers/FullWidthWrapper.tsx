import { ReactNode } from "react";

const FullWidthWrapper = ({ children }: { children: ReactNode }) => {
  return <div className="col-span-2">{children}</div>;
};

export default FullWidthWrapper;

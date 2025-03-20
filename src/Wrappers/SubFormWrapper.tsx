import { ReactNode } from "react";

const SubFormWrapper = ({ children }: { children: ReactNode }) => {
  return <div className="w-full grid tablet:grid-cols-2 gap-4">{children}</div>;
};

export default SubFormWrapper;

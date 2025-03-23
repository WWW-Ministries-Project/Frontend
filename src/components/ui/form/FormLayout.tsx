import { ReactNode } from "react";

export const FormLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full flex flex-col gap-4 lg:gap-6 md:grid md:grid-cols-2">
      {children}
    </div>
  );
};

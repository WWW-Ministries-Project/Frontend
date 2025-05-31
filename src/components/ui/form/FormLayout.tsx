import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  $columns?: number;
}

export const FormLayout = ({ children, $columns = 2 }: IProps) => {
  return (
    <div
      className={`w-full flex flex-col gap-4 lg:gap-6 md:grid md:grid-cols-${$columns}`}
    >
      {children}
    </div>
  );
};

import { ReactNode } from "react";

interface IProps {
  children: ReactNode;
  $columns?: number;
}

export const FormLayout = ({ children, $columns = 2 }: IProps) => {
  const columnClass =
    $columns === 1 ? "md:grid-cols-1" : $columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div
      className={`w-full flex flex-col gap-4 md:grid ${columnClass} md:gap-5`}
    >
      {children}
    </div>
  );
};

import { Button } from "@/components";
import { ReactNode } from "react";


interface IPageHeader {
  title?: string;
  buttonValue?: string;
  onClick?: (e?: unknown) => void;
  children?: ReactNode;
  
  className?: string;
}
const PageHeader: React.FC<IPageHeader> = ({
  title,
  buttonValue,
  onClick,
  children,
  className = "text-xl font-semibold text-primary md:text-2xl",
}) => {
  return (
    <div className="my-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className={className}>{title}</h3>
      </div>
      {buttonValue && (
        <Button
          value={buttonValue}
          onClick={onClick}
        />
      )}
      {children && <div>{children}</div>}
    </div>
  );
};

export default PageHeader;

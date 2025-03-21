import Button from "@/components/Button";
import { ReactNode } from "react";


interface IPageHeader {
  title?: string;
  buttonValue?: string;
  onClick?: (e: HTMLButtonElement) => void;
  children?: ReactNode;
  
  className?: string;
}
const PageHeader: React.FC<IPageHeader> = ({
  title,
  buttonValue,
  onClick,
  children,
  className = 'text-2xl font-semibold',
}) => {
  return (
    <div className="flex items-center justify-between my-3">
      <div className="">
      <h3 className={className}>{title}</h3>
      </div>
      {buttonValue && (
        <Button
          value={buttonValue}
          className="primary text-white px-5 min-h-12 max-h-14 p-3 bg-primary whitespace-nowrap"
          onClick={onClick}
        />
        
      )}
      {children && <div>{children}</div>}
    </div>
  );
};

export default PageHeader;

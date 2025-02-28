import Button from "@/components/Button";
import { ReactNode } from "react";
interface IPageHeader {
  title?: string;
  buttonValue?: string;
  onClick?: (e: HTMLButtonElement) => void;
  children?: ReactNode;
}
const PageHeader: React.FC<IPageHeader> = ({
  title,
  buttonValue,
  onClick,
  children,
}) => {
  return (
    <div className="flex justify-between my-3">
      <h3 className="font-bold">{title}</h3>
      {buttonValue && (
        <Button
          value={buttonValue}
          className="primary"
          onClick={onClick}
        />
      )}
      {children && <div>{children}</div>}
    </div>
  );
};

export default PageHeader;

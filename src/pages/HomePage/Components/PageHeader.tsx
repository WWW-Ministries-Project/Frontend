import Button from "@/components/Button";
interface IPageHeader {
  title?: string;
  buttonValue: string;
  onClick: (e: HTMLButtonElement) => void;
}
const PageHeader: React.FC<IPageHeader> = ({ title, buttonValue, onClick }) => {
  return (
    <div className="flex justify-between my-3">
      <div>{title}</div>
      <Button
        value={buttonValue}
        className="p-2 text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 "
        onClick={onClick}
      />
    </div>
  );
};

export default PageHeader;

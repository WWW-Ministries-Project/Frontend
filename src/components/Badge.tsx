interface IProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge = ({ children, className, style }: IProps) => {
  return (
    <div>
      <div
        style={style}
        className={` ${
          className
            ? className
            : "bg-blue-50  text-blue-700 border-blue-200 text-xs"
        }  font-semibold  rounded-full  px-2 border inline-flex items-center justify-center`}
      >
        <div className="">{children}</div>
      </div>
    </div>
  );
};

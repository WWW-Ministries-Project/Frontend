interface IPageOutline {
  children: React.ReactNode;
  className?: string;
}
const PageOutline = ({ children, className }: IPageOutline): JSX.Element => {
  return (
    <section className={`${className? className: "p-4"} bg-white rounded-xl  min-h-[calc(100vh-9rem)] drop-shadow flex flex-col gap-4 m-4`}>
      {children}
    </section>
  );
};

export default PageOutline;

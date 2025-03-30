interface IPageOutline {
  children: React.ReactNode;
  className?: string;
}
const PageOutline = ({ children, className }: IPageOutline): JSX.Element => {
  return (
    <section className={`${className? className: "p-4"} bg-white rounded-xl  min-h-screen`}>
      {children}
    </section>
  );
};

export default PageOutline;

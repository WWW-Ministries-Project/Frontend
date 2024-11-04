interface IPageOutline {
  children: React.ReactNode;
}
const PageOutline = ({ children }: IPageOutline): JSX.Element => {
  return (
    <section className="bg-white rounded-xl min-h-[90vh] p-4">
      {children}
    </section>
  );
};

export default PageOutline;

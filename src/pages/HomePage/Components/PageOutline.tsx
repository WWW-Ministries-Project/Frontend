interface IPageOutline {
  children: React.ReactNode;
}
const PageOutline = ({ children }: IPageOutline): JSX.Element => {
  return (
    <section className="bg-white rounded-xl p-4 min-h-screen">
      {children}
    </section>
  );
};

export default PageOutline;

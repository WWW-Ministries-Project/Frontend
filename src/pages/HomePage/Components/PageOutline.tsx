interface PageOutlineProps {
  children: React.ReactNode;
  className?: string;
}

const PageOutline = ({ children, className = "" }: PageOutlineProps): JSX.Element => {
  return (
    <section
      role="main"
      className={`p-4 bg-white w-[calc(100%-2rem)] rounded-xl min-h-[calc(100vh-9rem)] drop-shadow flex flex-col gap-4 mx-auto ${className}`}
    >
      {children}
    </section>
  );
};

export default PageOutline;

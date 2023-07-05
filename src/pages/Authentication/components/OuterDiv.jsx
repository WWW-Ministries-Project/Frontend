import Footer from "./Footer";

const OuterDiv = (props) => {
  return (
    <>
      <main className="flex flex-col justify-between h-screen">
        <div></div>
        {props.children}
        <Footer/>
      </main>
    </>
  );
};

export default OuterDiv;

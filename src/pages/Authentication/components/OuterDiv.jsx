import Footer from "./Footer";
import PropTypes from "prop-types";

const OuterDiv = (props) => {
  return (
    <>
      <main className="flex flex-col justify-between h-screen">
        <div></div>
        <div className="">
        {props.children}
        </div>
        <Footer/>
      </main>
    </>
  );
};

OuterDiv.propTypes = {
  children: PropTypes.node,
};

export default OuterDiv;

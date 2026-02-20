import Footer from "./Footer";
import PropTypes from "prop-types";

const OuterDiv = (props) => {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="flex flex-1 items-center justify-center px-4 py-10">
        {props.children}
      </section>
      <Footer />
    </main>
  );
};

OuterDiv.propTypes = {
  children: PropTypes.node,
};

export default OuterDiv;

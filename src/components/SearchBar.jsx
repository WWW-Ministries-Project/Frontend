import search from "/src/assets/search.svg";
import PropTypes from "prop-types";
function SearchBar(props) {
  return (
    <>
      <div className={"flex items-center bg-white rounded-md py-1 opacity-50 border border-[#f2f2f2] "+props.className}>
        <form className="w-full text-dark900 flex items-center  px-2 text-sma font-normal leading-6">
          <img
            role="submit button"
            src={search}tab
            alt="search"
            className="inline mr-2"
          />

          <input
            type="text"
            placeholder= {props.placeholder}
            name="search"
            className="bg-inherit border-0 focus:outline-none focus:border-2 w-full px-2"
          />
        </form>
      </div>
    </>
  );
}
SearchBar.propTypes = {
    // type: PropTypes.string.isRequired,
    // id: PropTypes.string.isRequired,
    // name: PropTypes.string.isRequired,
    // value: PropTypes.string,
    // valid: PropTypes.bool,
    // isRequired: PropTypes.bool,
    // inputClass: PropTypes.string,
    placeholder: PropTypes.string,
    // label: PropTypes.string.isRequired,
    // pattern: PropTypes.string,
    // handleBlur: PropTypes.func,
    // onChange: PropTypes.func,
    className: PropTypes.string,
  };

export default SearchBar;

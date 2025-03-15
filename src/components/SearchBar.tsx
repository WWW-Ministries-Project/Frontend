import search from "/src/assets/search.svg";
import PropTypes from "prop-types";

interface ISearchBar {
  id?:string,
  placeholder?:string,
  value?:string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?:string
}
function SearchBar(props: ISearchBar): JSX.Element {
  return (
    <>
      <div className={"flex items-center bg-white  "+props.className}>
        <form className="w-full text-dark900 flex items-center   font-normal leading-6">
          <img
            role="submit button"
            src={search}
            alt="search"
            className="inline text-lightGray border p-3 rounded-l-lg"
          />

          <input
            id={props.id||"search"}
            type="text"
            placeholder= {props.placeholder}
            name="search"
            className="bg-inherit rounded-r-lg p-2 border  border-lightGray focus:outline-none w-[25rem]"
            value={props.value}
            onChange={props.onChange}
            autoComplete="off"
          
          />
        </form>
      </div>
    </>
  );
}
SearchBar.propTypes = {
    // type: PropTypes.string.isRequired,
    id: PropTypes.string,
    // name: PropTypes.string.isRequired,
    value: PropTypes.string,
    // valid: PropTypes.bool,
    // isRequired: PropTypes.bool,
    // inputClass: PropTypes.string,
    placeholder: PropTypes.string,
    // label: PropTypes.string.isRequired,
    // pattern: PropTypes.string,
    // handleBlur: PropTypes.func,
    onChange: PropTypes.func,
    className: PropTypes.string,
  };

export default SearchBar;

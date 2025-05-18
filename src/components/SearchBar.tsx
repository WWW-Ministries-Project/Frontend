import PropTypes from "prop-types";
import search from "/src/assets/search.svg";

interface IProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}
export const SearchBar = (props: IProps): JSX.Element => {
  return (
    <>
      <div className={"flex items-center bg-white  " + props.className}>
        <form className="w-full text-primary flex items-center   font-normal leading-6">
          <img
            role="submit button"
            src={search}
            alt="search"
            className="inline text-lightGray border p-3 rounded-l-lg"
          />

          <input
            id={props.id || "search"}
            type="text"
            placeholder={props.placeholder}
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
};
SearchBar.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
};

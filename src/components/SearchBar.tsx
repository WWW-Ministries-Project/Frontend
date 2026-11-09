import PropTypes from "prop-types";
import search from "/src/assets/search.svg";
import { useEffect, useRef } from "react";

interface IProps {
  id?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  onSubmit?: () => void;
}
export const SearchBar = (props: IProps): JSX.Element => {
   const { className, id, onChange, onSubmit, placeholder, value } = props;
   const onSubmitRef = useRef(onSubmit);
   const previousValueRef = useRef(value ?? "");

   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     onSubmit?.();
   };

   useEffect(() => {
     onSubmitRef.current = onSubmit;
   }, [onSubmit]);

   useEffect(() => {
     const currentValue = (value ?? "").trim();
     const previousValue = previousValueRef.current.trim();

     // Only trigger reset search when user clears a previously non-empty value.
     if (currentValue === "" && previousValue !== "") {
       onSubmitRef.current?.();
     }

     previousValueRef.current = value ?? "";
   }, [value]);
  return (
    <>
      <div className={"flex w-full max-w-xl items-center bg-white " + className}>
        <form
          onSubmit={handleSubmit}
          role="search"
          className="flex w-full items-center font-normal leading-6 text-primary"
        >
          <span className="inline-flex items-center rounded-l-lg border border-lightGray bg-lightGray/30 p-3">
            <img src={search} alt="" className="h-4" />
          </span>

          <input
            id={id || "search"}
            type="text"
            placeholder={placeholder}
            name="search"
            className="app-input rounded-none border-l-0 border-r-0"
            value={value ?? ""}
            onChange={onChange}
            autoComplete="off"
          />

          <button
            type="submit"
            className="h-full flex-shrink-0 rounded-r-lg bg-primary px-4 text-sm font-semibold text-white outline-none transition hover:bg-primary/90"
          >
            Search
          </button>
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
  onSubmit: PropTypes.func,
};

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
          className="flex w-full items-center font-normal leading-6 text-primary"
        >
          <img
            role="submit button"
            src={search}
            alt="search"
            className="inline rounded-l-lg border border-lightGray bg-lightGray/30 p-3 text-lightGray"
          />

          <input
            id={id || "search"}
            type="text"
            placeholder={placeholder}
            name="search"
            className="app-input rounded-l-none border-l-0"
            value={value ?? ""}
            onChange={onChange}
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
  onSubmit: PropTypes.func,
};

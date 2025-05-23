import PropTypes from "prop-types";
import React from "react";

interface Option {
  value: string | number;
  name: string;
}

interface IProps {
  type?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClass?: string;
  id: string;
  value?: string | number;
  onChange: (name: string, value: string | number) => void;
  options: Option[];
  disabled?: boolean;
  error?: string;
}

export const SelectField = (props: IProps) => {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    const name = e.target.name;
    props.onChange(name, e.target.value);
  }

  return (
    <div>
      <div className={"flex text-primary  flex-col gap-1 " + props.className}>
        <label className="font-semibold" htmlFor={props.id}>
          {props.label}
        </label>
        <select
          name={props.id}
          id={props.id}
          className={`p-2.5 rounded-lg border border-primary  ${
            props.inputClass
          } ${props.error ? " !border-error !outline-error" : " "} ${
            props.disabled
              ? "bg-gray-100 border-none text-gray-500 cursor-not-allowed"
              : ""
          }`}
          onChange={handleChange}
          value={props.value}
          disabled={props.disabled}
        >
          <option value="">{props.placeholder}</option>
          {props.options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>

        {props.error && <p className="text-error text-sma">{props.error}</p>}
      </div>
    </div>
  );
};

SelectField.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  inputClass: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

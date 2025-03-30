import PropTypes from "prop-types";
import React, { forwardRef } from "react";

export interface InputDivProps {
  type?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClass?: string;
  id: string;
  value?: string | number;
  onChange: (name: string, value: string | number) => void;
  onBlur?: (e: React.FocusEvent<any>) => void;
  onClick?: () => void;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  autocomplete?: string;
  ariaLabel?: string;
  required?: boolean;
  pattern?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const InputDiv = forwardRef<HTMLDivElement, InputDivProps>((props, ref) => {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name;
    props.onChange(name, e.target.value);
  }

  function handleBlur(e: React.FocusEvent<HTMLAreaElement | HTMLInputElement>) {
    props.onBlur && props.onBlur(e);
  }

  return (
    <div
      className={`flex text-dark900 flex-col gap-1 ${props.className}`}
      ref={ref}
      onClick={props.onClick}
      style={{ cursor: props.onClick ? "pointer" : "default" }}
    >
      <label className="font-semibold " htmlFor={props.id}>
        {props.label}
      </label>
      {props.type === "textarea" ? (
        <textarea
          className={`input rounded-xl !h-[150px] ${props.inputClass} ${
            props.error ? "!border-error !outline-error" : ""
          }`}
          id={props.id}
          name={props.id}
          value={props.value}
          onChange={handleChange}
          placeholder={props.placeholder}
          disabled={props.disabled}
        />
      ) : (
        <input
          className={`   ${
            props.inputClass
              ? props.inputClass
              : "rounded-lg p-2 border border-dark900 focus:outline-none"
          }  ${
            props.error ? "!border-error focus:outline-none !outline-error" : ""
          }`}
          id={props.id}
          name={props.id}
          type={props.type || "text"}
          value={props.value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={props.placeholder}
          disabled={props.disabled}
          min={props.min}
          max={props.max}
          autoComplete={props.autocomplete || "off"}
          aria-label={props.ariaLabel}
          required={props.required}
          pattern={props.pattern}
          aria-labelledby={props.ariaLabelledBy}
          aria-describedby={props.ariaDescribedBy}
        />
      )}
      {props.error && <div className="text-error text-sma">{props.error}</div>}
    </div>
  );
});

InputDiv.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  inputClass: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  min: PropTypes.string,
  max: PropTypes.string,
};

InputDiv.displayName = "InputDiv";

export default InputDiv;

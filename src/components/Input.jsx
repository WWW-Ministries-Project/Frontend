import PropTypes from "prop-types";

const Input = (props) => {
  const errorMessage = props.error || (props.isRequired ? "This field is required" : "");
  const errorId = errorMessage ? `${props.id}-error` : undefined;
  const describedBy = [props["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`inputBox w-full rounded-lg ${props.className || ""}`}>
      {props.label && (
        <label
          className={`mb-1 block text-left text-sm font-medium text-primary ${props.labelClassName || ""}`}
          htmlFor={props.id}
        >
          {props.label}
          {props.required && <span className="ml-0.5 text-error">*</span>}
        </label>
      )}
      <input
        className={`app-input ${props.inputClass || ""}`}
        type={props.type}
        id={props.id}
        name={props.name}
        value={props.value || ""}
        pattern={props.pattern}
        onChange={props.onChange}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
        onKeyDown={props?.onKeyDown}
        autoComplete={props.autoComplete || "off"}
        disabled={props.disabled}
        required={props.required}
        aria-required={props.required}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={describedBy}
        aria-label={props["aria-label"]}
      />
      {errorMessage ? (
        <p id={errorId} className="mt-1 text-xs text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  valid: PropTypes.bool,
  isRequired: PropTypes.bool,
  required: PropTypes.bool,
  inputClass: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  pattern: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  autoComplete: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  "aria-label": PropTypes.string,
  "aria-describedby": PropTypes.string,
};

export default Input;

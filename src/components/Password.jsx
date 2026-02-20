import { useMemo, useState } from "react";
import Input from "./Input";
import PropTypes from "prop-types";

const InputPassword = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  const showMismatchError = props.name === "password2" && props.samePassword === false;

  const errorMessage = useMemo(() => {
    if (props.error) return props.error;
    if (showMismatchError) return "Passwords do not match";
    if (props.isRequired) return "This field is required";
    return "";
  }, [props.error, props.isRequired, showMismatchError]);
  const togglePosition = props.label ? "top-8" : "top-2";

  return (
    <div className="relative z-10">
      <Input
        type={showPassword ? "text" : "password"}
        inputClass={props.inputClass}
        className={props.className}
        placeholder={props.placeholder}
        id={props.id}
        name={props.name}
        label={props.label}
        onChange={props.onChange}
        value={props.value}
        onBlur={props.onBlur}
        pattern={props.pattern}
        autoComplete={props.autoComplete}
        required={props.required}
        error={errorMessage}
        isRequired={false}
      />

      <button
        type="button"
        className={`absolute right-3 ${togglePosition} rounded px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25`}
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-controls={props.id}
        aria-pressed={showPassword}
      >
        {showPassword ? "Hide" : "Show"}
      </button>
    </div>
  );
};

InputPassword.propTypes = {
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  pattern: PropTypes.string,
  isRequired: PropTypes.bool,
  samePassword: PropTypes.bool,
  error: PropTypes.string,
  id: PropTypes.string.isRequired,
  handleChange: PropTypes.func,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  inputClass: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  autoComplete: PropTypes.string,
  required: PropTypes.bool,
};

export default InputPassword;

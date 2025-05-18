import React from "react";
import Input from "./Input";
import PropTypes from "prop-types";
import Alert from "../pages/Authentication/components/Alerts";

const InputPassword = (props) => {
  function handleClick(e) {
    let input = document.getElementById(props.id);
    let node = e.target.nextSibling || e.target.previousSibling;
    node.style.display = "block";
    e.target.style.display = "none";
    if (input.type == "password") {
      input.type = "text";
    } else input.type = "password";
  }

  return (
    <>
      <div className="relative z-1">
        <Input
          type="password"
          inputClass={props.inputClass}
          className={props.className}
          placeholder={props.placeholder}
          id={props.id}
          isRequired={props.isRequired}
          name={props.name}
          label={props.label}
          onChange={props.onChange}
          value={props.value}
          onBlur={props.onBlur}
          pattern={props.pattern}
        />
        {/* <i className="fas fa-eye-slash absolute top-6 right-2 text-fontGrayW hidden" onClick={handleClick} ></i>
                    <i className="fas fa-eye absolute top-6 right-2 text-fontGrayW" onClick={handleClick} ></i> */}
        <span
          className="fas fa-eye-slash absolute top-10 right-[5%] text-primary  hidden cursor-pointer" role="hide password"
          onClick={handleClick}>
          {" "}
          Hide
        </span>
        <span
          className="fas fa-eye absolute top-10 right-[5%] text-primary  cursor-pointer"
          onClick={handleClick}>
          Show
        </span>
        {props.name == 'password2' && !props.samePassword ? <Alert text="passwords do not match" /> : null}
      </div>
    </>
  );
};

InputPassword.propTypes = {
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  pattern: PropTypes.string,
  isRequired: PropTypes.bool,
  samePassword: PropTypes.bool,
  id: PropTypes.string.isRequired,
  handleChange: PropTypes.func,
  inputClass: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

export default InputPassword;

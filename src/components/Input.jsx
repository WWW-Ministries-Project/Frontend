// import React from "react";
import PropTypes from "prop-types";
import { useRef } from "react";

const Input = (props) => {
  const emailInputRef = useRef();
  return (
    <div className={"inputBox bg-white rounded-lg W px-5 " + props.className}>
      <label
        className=" text-left text-primary p-2  "
        htmlFor={props.id}>
        {props.label}
      </label>
      <br />
      <input
        className={
          "w-[98%] border p-2 rounded-md focus:border focus:outline-none invalid:border-error placeholder:text-gray  " +
          props.inputClass
        }
        type={props.type}
        id={props.id}
        name={props.name}
        value={props.value ? props.value : ""}
        pattern={props.pattern}
        onChange={props.onChange}
        onBlur={props.onBlur}
        placeholder={props.placeholder}
        ref={emailInputRef}
      />
      <br />
      {props.isRequired ? (
        <p className="text-error text-sm ">This field is required</p>
      ) : null}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  valid: PropTypes.bool,
  isRequired: PropTypes.bool,
  inputClass: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string.isRequired,
  pattern: PropTypes.string,
  handleBlur: PropTypes.func,
  onChange: PropTypes.func,
  className: PropTypes.string,
};

export default Input;

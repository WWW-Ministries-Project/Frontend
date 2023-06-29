// import React from "react";
import PropTypes from "prop-types";

const Input = (props) => {
  return (
    <div className={"inputBox bg-white rounded-lg W px-5 " + props.className}>
      <label
        className="font-light text-left text-fontGrayW p-2 text-sm "
        htmlFor={props.id}>
        {props.label}
      </label>
      <br />
      <input
        className={
          "w-[98%] border border-inherit focus:border focus:outline-none invalid:border-error " +
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

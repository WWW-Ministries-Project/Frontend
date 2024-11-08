import React from 'react';
import PropTypes from 'prop-types';

interface Option {
  value: string | number;
  name: string;
}

interface SelectFieldProps {
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
  error?:string;
}

function SelectField(props: SelectFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    const name = e.target.name;
    props.onChange(name, e.target.value);
  }

  return (
    <div>
      <div className={"flex text-dark900  flex-col gap-1 " + props.className}>
        <label className='font-semibold' htmlFor={props.id}>{props.label}</label>
        <select
          name={props.id}
          id={props.id}
          className={`input rounded-xl border  ${props.inputClass} ${props.error? " !border-error !outline-error": " "}` }
          onChange={handleChange}
          value={props.value}
          disabled={props.disabled}
        >
          <option  value="">{props.placeholder}</option>
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
}

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

export default SelectField;

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
  id: string;
  value?: string | number;
  onChange: (name: string, value: string | number) => void;
  options: Option[];
  disabled?: boolean;
}

function SelectField(props: SelectFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    const name = e.target.name;
    props.onChange(name, e.target.value);
  }

  return (
    <div>
      <div className={"flex flex-col gap-1 " + props.className}>
        <label htmlFor={props.id}>{props.label}</label>
        <select
          name={props.id}
          id={props.id}
          className="input"
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
      </div>
    </div>
  );
}

SelectField.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

export default SelectField;

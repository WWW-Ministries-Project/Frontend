import PropTypes from "prop-types";

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
  disabled?: boolean;
  error?:string
}
function InputDiv(props: InputDivProps) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const name = e.target.name;
    props.onChange(name, e.target.value);
  }

  function handleBlur (e:React.FocusEvent<HTMLAreaElement | HTMLInputElement >)
  {
    props.onBlur && props.onBlur(e)
  }
  return (
    <>
      <div className={"flex flex-col gap-1  " + props.className}>
        <label htmlFor={props.id}>{props.label}</label>
        {props.type == "textarea" ? (
          <textarea
            className={"input rounded-xl h-[150px] " + props.inputClass}
            id={props.id}
            name={props.id}
            value={props.value}
            onChange={handleChange}
            placeholder={props.placeholder}
            disabled={props.disabled}
          />
        ) : (
          <input
            className={`input rounded-xl border ${props.inputClass} ${props.error? " !border-error !outline-error": " "}` }
            id={props.id}
            name={props.id}
            type={props.type || "text"}
            value={props.value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={props.placeholder}
            disabled={props.disabled}
          />
          )}
        {props.error &&<div className="text-error text-sma">{props.error}</div>}
      </div>
    </>
  );
}

InputDiv.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  inputClass: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default InputDiv;

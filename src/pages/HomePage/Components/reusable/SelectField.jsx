import PropTypes from 'prop-types';

const SelectField = (props) => {

    function handleChange(e) {
        e.preventDefault();
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }
    return (
        <div>
            <div className={"flex flex-col gap-1 "+props.className}>
                <label htmlFor={props.id}>{props.label}</label>
                <select name={props.id} id={props.id} className="input" onChange={handleChange} value={props.value} disabled={props.disabled}>
                    <option value="">{props.placeholder}</option>
                    {props.options.map((option, index) => (
                        <option key={index} value={(option.value)}>{option.name}</option>
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
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
    onChange: PropTypes.func,
    options: PropTypes.array,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool
}
export default SelectField;

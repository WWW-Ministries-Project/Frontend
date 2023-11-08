import PropTypes from 'prop-types';

const SelectField = (props) => {

    function handleChange(e) {
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }
    return (
        <div>
            <div className={"flex flex-col "+props.className}>
                <label htmlFor={props.id}>{props.label}</label>
                <select name={props.id} id={props.id} className="input" onChange={handleChange}>
                    {props.options.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

SelectField.propTypes = {
    label: PropTypes.string,
    className: PropTypes.string,   
    id: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    options: PropTypes.array
}
export default SelectField;

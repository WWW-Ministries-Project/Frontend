import PropTypes from 'prop-types';

function InputDiv (props) {

    function handleChange(e) {
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }
    return (
        <>
            <div className={"flex flex-col gap-1  "+props.className}>
              <label htmlFor={props.id}>{props.label}</label>
              <input className={'input rounded-xl' + ' ' + props.inputClass} id={props.id} name={props.id} type={props.type || 'text'} value={props.value} onChange={handleChange} placeholder={props.placeholder} disabled={props.disabled}/>
          </div>
        </>
    )
}

InputDiv.propTypes = {
    type: PropTypes.string,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    inputClass: PropTypes.string,   
    id: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    onChange: PropTypes.func,
    disabled: PropTypes.bool
}

export default InputDiv
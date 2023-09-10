import PropTypes from 'prop-types';

function InputDiv (props) {


    return (
        <>
            <div className={"flex flex-col  "+props.className}>
              <label htmlFor={props.id}>{props.label}</label>
              <input className={'input'} id={props.id} name={props.id} type={props.type || 'text'}/>
          </div>
        </>
    )
}

InputDiv.propTypes = {
    type: PropTypes.string,
    label: PropTypes.string,
    className: PropTypes.string,   
    id: PropTypes.string,
}

export default InputDiv
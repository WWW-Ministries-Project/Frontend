

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


export default InputDiv
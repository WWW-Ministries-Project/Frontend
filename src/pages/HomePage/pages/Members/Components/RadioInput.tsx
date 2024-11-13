
interface RadioInputProps {
    value: boolean;
    onChange: (name: string, value: boolean) => void;
}
const RadioInput: React.FC<RadioInputProps> = (props) => {


  const handleChange = (event:React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value == "true"
    props.onChange("is_user",value);
  };

  return (
    <div className="flex gap-12">
      <label>
        <input 
          type="radio" 
          value="true" 
          checked={props.value === true}
          onChange={handleChange} 
          className="mr-2"
        />
        Yes
      </label>
      <label>
        <input 
          type="radio" 
          value="false" 
          checked={props.value === false} 
          onChange={handleChange} 
          className="mr-2"
        />
        No
      </label>
    </div>
  );
};

export default RadioInput;

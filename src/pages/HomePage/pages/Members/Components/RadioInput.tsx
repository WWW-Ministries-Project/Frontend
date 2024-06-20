
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
    <div className="flex gap-4">
      <label>
        <input 
          type="radio" 
          value="true" 
          checked={props.value === true}
          onChange={handleChange} 
        />
        Yes
      </label>
      <label>
        <input 
          type="radio" 
          value="false" 
          checked={props.value === false} 
          onChange={handleChange} 
        />
        No
      </label>
    </div>
  );
};

export default RadioInput;

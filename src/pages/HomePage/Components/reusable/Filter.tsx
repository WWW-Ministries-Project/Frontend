import { ISelectOption } from "../../utils/homeInterfaces";

interface FilterProps {
  className?: string;
  options: ISelectOption[];
  onChange: (name: string, value: string) => void;
  name: string;
  placeholder?: string;
  size?: number;
}

const Filter: React.FC<FilterProps> = (props) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    props.onChange(value, name);
  };

  return (
    <div className={props.className || ""}>
      <select
        name={props.name}
        id={props.name}
        size={props.size}
        className={`h-10 border border-[#dcdcdc] bg-white rounded-lg p-1 ${
          props.className || ""
        }`}
        onChange={handleChange}
        aria-label={props.placeholder || "Filter options"}
      >
        <option value="">{props.placeholder || "Select an option"}</option>
        {props.options.map((option) => (
          <option
            key={props.name + option.value + option.label}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Filter;

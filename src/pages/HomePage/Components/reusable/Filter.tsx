import { ISelectOption } from "../../utils/homeInterfaces";

interface FilterProps {
  className?: string;
  options: ISelectOption[];
  onChange: (name: string, value: string) => void;
  name: string;
  placeholder?: string;
  size?: number;
  label?: string;
  value?: string;
}

const Filter: React.FC<FilterProps> = (props) => {
  const hasEmptyOption = props.options.some((option) => option.value === "");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    props.onChange(name, value);
  };

  return (
    <div className={props.className || ""}>
      {props.label ? (
        <label className="mb-1 block text-sm">{props.label}</label>
      ) : null}
      <select
        name={props.name}
        id={props.name}
        size={props.size}
        value={props.value}
        className="h-10 w-full rounded-lg border border-[#dcdcdc] bg-white px-3 text-sm text-primary"
        onChange={handleChange}
        aria-label={props.placeholder || "Filter options"}
      >
        {!hasEmptyOption ? (
          <option value="">{props.placeholder || "Select an option"}</option>
        ) : null}
        {props.options.map((option, index) => (
          <option key={props.name + option.value + index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Filter;

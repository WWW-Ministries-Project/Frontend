import PropTypes from "prop-types";
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
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.name;
    props.onChange(e.target.value, name);
  }
  return (
    <div className="">
      <select
        name={props.name || "filter"}
        id={props.name}
        size={props.size || 0}
        className={
          "h-10 border border-[#dcdcdc] bg-white rounded-lg p-1   " +
          props.className
        }
        onChange={handleChange}
      >
        <option value="">{props.placeholder || "Filter"}</option>
        {props.options.map((option) => (
          <option key={Math.random()} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

Filter.propTypes = {
  className: PropTypes.string,
  options: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
};

export default Filter;

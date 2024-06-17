import PropTypes from 'prop-types';
interface FilterProps {
    className?: string;
    options: any[];
    onChange: (name: string, value: string) => void;
    name: string;
    size?: number;
}
const Filter:React.FC<FilterProps> = (props) => {
    function handleChange(e : React.ChangeEvent<HTMLSelectElement>) {
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }
    return (
        <div className=''>
            <select name={props.name || "filter"} id={props.name} size={props.size || 0}  className={"h-10 border border-[#dcdcdc] bg-white rounded-lg p-1   "+props.className} onChange={handleChange}>
                <option value="">{props.name}</option>
                {props.options.map((option) => <option key={option.name || option} value={option.value || option}>{option.name || option}</option>)}
             </select>
        </div>
    );
}

Filter.propTypes = {
    className: PropTypes.string,
    options: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired
};

export default Filter;

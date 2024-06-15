import PropTypes from 'prop-types';
const Filter = (props) => {
    function handleChange(e) {
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }
    return (
        <div className=''>
            <select name={props.name || "filter"} id="filter" placeholder={props.placeholder || "Filter"}  className={"h-10 border border-[#dcdcdc] bg-white rounded-lg p-1   "+props.className} onChange={handleChange}>
                <option value="">{props.name}</option>
                {props.options.map((option) => <option key={option.name || option} value={option.value || option}>{option.name || option}</option>)}
             </select>
        </div>
    );
}

Filter.propTypes = {
    placeholder: PropTypes.string,
    className: PropTypes.string,
    options: PropTypes.array.isRequired,
    onChange: PropTypes.func,
    name: PropTypes.string
};

export default Filter;

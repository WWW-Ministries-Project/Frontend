import React from 'react';
import PropTypes from 'prop-types';

const TextField = (props) => {

    function handleChange(e) {
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }

    return (
        <div>
            <div>
                <label htmlFor="description">{props.label ||"Description</"}</label>
                <textarea onChange={handleChange} value={props.value} name="description" id="description" placeholder={props.placeholder} className="w-full mt-1 px-1 border border-[#EEF2F4] py-1 placeholder:text-xs" cols="30" rows="10"></textarea>
            </div>
        </div>
    );
}

TextField.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    label: PropTypes.string,
    placeholder: PropTypes.string,

}

export default TextField;

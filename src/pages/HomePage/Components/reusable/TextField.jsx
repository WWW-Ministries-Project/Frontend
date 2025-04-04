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
                <label className='text-dark900 font-semibold' htmlFor="description">{props.label ||"Description"}</label>
                <textarea onChange={handleChange} value={props.value} name="description" id="description" placeholder={props.placeholder} className="w-full mt-1 px-1 rounded-lg border border-primary py-1 placeholder:text-xs" cols="30" rows="5"></textarea>
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

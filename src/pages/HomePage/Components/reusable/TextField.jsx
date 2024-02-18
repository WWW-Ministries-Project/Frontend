import React from 'react';

const TextField = (props) => {

    function handleChange(e) {
        const name = e.target.name;
        props.onChange(name, e.target.value);
      }

    return (
        <div>
            <div>
                <label htmlFor="description">Description</label>
                <textarea onChange={handleChange} value={props.value} name="description" id="description" className="w-full mt-1 px-3 border border-[#EEF2F4] py-1" cols="30" rows="10"></textarea>
            </div>
        </div>
    );
}

export default TextField;

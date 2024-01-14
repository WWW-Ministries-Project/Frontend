import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ToggleSwitch = (props) => {
    const [isChecked, setIsChecked] = useState(props.isChecked || false);

    const toggleSwitch = () => {
        props.onChange(props.name, !isChecked);
        setIsChecked(!isChecked);

    };

    return (
        <label className="flex items-center cursor-pointer w-full">
            <div className="relative flex items-center justify-between w-10/12">
                <div
                    className={`toggle-switch-label mb-2 P100 dark900`}
                >
                    {props.label}
                </div>
                <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={toggleSwitch}
                />
                <div>
                    <div className={`toggle-switch-toggle-waiting absolute bottom-0 w-12 h-6 p-1 rounded-full shadow-md transition-transform !transition duration-1000 ease-in-out ${isChecked ? 'bg-primaryViolet' : 'bg-[#E6E8F0]'}`}>
                        <div
                            className={`toggle-switch-toggle absolute ${isChecked ? 'translate-x-6' : 'translate-x-0'
                                } w-4 h-4 bg-white rounded-full shadow-md duration-300 ease-in-out`}
                        ></div>
                    </div>
                </div>
            </div>
        </label>
    );
};

ToggleSwitch.propTypes = {
    isChecked: React.PropTypes.bool,
    onChange: React.PropTypes.func,
}

export default ToggleSwitch;

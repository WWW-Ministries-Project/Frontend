import React, { useState } from 'react';

const ToggleSwitch = (props) => {
    const [isChecked, setIsChecked] = useState(false);

    const toggleSwitch = () => {
        props.onChange(props.name, !isChecked);
        setIsChecked(!isChecked);

    };

    return (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={toggleSwitch}
                />
                <div>
                    <div className={`toggle-switch-toggle-waiting absolute bottom-0 w-12 h-6 p-1 rounded-full shadow-md transition-transform !transition duration-1000 ease-in-out ${isChecked ? 'bg-primaryViolet' : 'bg-white'}`}>
                        <div
                            className={`toggle-switch-toggle absolute ${isChecked ? 'translate-x-6' : 'translate-x-0'
                                } w-4 h-4 bg-gray rounded-full shadow-md duration-300 ease-in-out`}
                        ></div>
                    </div>
                </div>
                <div
                    className={`toggle-switch-label ml-20 mb-2 text-gray-700 ${isChecked ? 'font-semibold' : 'font-normal'
                        }`}
                >
                    {props.label}
                </div>
            </div>
        </label>
    );
};

export default ToggleSwitch;

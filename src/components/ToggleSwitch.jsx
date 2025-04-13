import PropTypes from 'prop-types';

export const ToggleSwitch = (props) => {
    const toggleSwitch = ({ target: { checked } }) => {
        props.onChange(props.name, checked);

    };

    return (

        // <label class="inline-flex items-center cursor-pointer">
        //     <div className="relative   flex items-center justify-between w-full">
        //         <div
        //             className={`toggle-switch-label mb-2 P100 primary`}
        //         >
        //             {props.label}
        //         </div>
        //         <input
        //             type="checkbox"
        //             className="hidden"
        //             checked={props.isChecked}
        //             onChange={toggleSwitch}
        //             disabled={props.disabled}
        //         />
        //         <div>
        //             <div className={`toggle-switch-toggle-waiting absolute bottom-0 w-12 h-6 p-1 rounded-full shadow-md transition-transform !transition duration-1000 ease-in-out ${props.isChecked ? 'bg-primary' : 'bg-[#E6E8F0]'}`}>
        //                 <div
        //                     className={`toggle-switch-toggle absolute ${props.isChecked ? 'translate-x-6' : 'translate-x-0'
        //                         } w-4 h-4 bg-white rounded-full shadow-md duration-300 ease-in-out`}
        //                 ></div>
        //             </div>
        //         </div>
        //     </div>
        // </label>


        <label className="inline-flex items-center cursor-pointer">
            <span className="me-3 text-sm font-medium text-gray-900 ">{"Deactivate"}</span>
            <input
                type="checkbox"
                className="sr-only peer"
                checked={props.isChecked}
                onChange={toggleSwitch}
                disabled={props.disabled}
            />
            <div className="relative w-11 h-6 bg-lightGray rounded-full peer  peer-focus:none  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all  peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 ">{"Activate"}</span>
        </label>

    );
};

ToggleSwitch.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    isChecked: PropTypes.bool,
    onChange: PropTypes.func,
    disabled: PropTypes.bool
}


import React from 'react';
import InputDiv from '../../../Components/reusable/InputDiv';
import ToggleSwitch from '../../../../../components/ToggleInput';
import PropTypes from 'prop-types';

const AccessForm = ({ handleChange, selectedTab, inputValue }) => {
    const topOptions = ["Dashboard", "Members", "Departments", "Positions", "Access Rights"];
    return (
        <div>
            <form className="mt-5">
                <InputDiv onChange={handleChange} type="text" id={"name"} label={"Access name"} value={inputValue.name} className="w-full" />
                <div className="border border-[#F5F5F5] rounded-md p-5 my-6">
                    <div className="py-5  text-lighterBlack text-[17px]">
                        Access rights
                    </div>
                    {/* <div className="flex flex-col gap-3 "> */}
                        {topOptions.map((option) => {
                            return (
                                <div className="flex flex-col gap-3 my-7" key={option}>
                                    <div  className='flex justify-between P100 font-semibold text-primaryViolet'>
                                        <div>{option}</div>
                                        <img src="/src/assets/down.svg" alt="" />
                                    </div>
                                    <ToggleSwitch onChange={handleChange} name={`create_${option}`} label="Create" />
                                    <ToggleSwitch onChange={handleChange} name={`edit_${option}`} label="Edit" />
                                    <ToggleSwitch onChange={handleChange} name={`delete_${option}`} label="Delete" />
                                    <ToggleSwitch onChange={handleChange} name={`view_${option}`} label="View" />
                                </div>
                            )
                        })}

                    {/* </div> */}
                </div>

            </form>
        </div>
    );
}

AccessForm.propTypes = {
    handleChange: PropTypes.func,
    selectedTab: PropTypes.string,
    inputValue: PropTypes.object
}

export default AccessForm;

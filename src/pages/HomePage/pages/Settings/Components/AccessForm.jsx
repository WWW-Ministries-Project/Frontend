import React from 'react';
import InputDiv from '../../../Components/reusable/InputDiv';
import ToggleSwitch from '../../../../../components/ToggleInput';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button';

const AccessForm = ({ handleChange,handleNameChange, permissionsValues, inputValue, onSubmit, loading, CloseForm }) => {
    function handleSubmit() {
        onSubmit();
    }
    const topOptions = ["Dashboard", "Members", "Departments", "Positions", "Access Rights"];
    return (
        <div>
            <form className="mt-5">
                <InputDiv onChange={handleNameChange} type="text" id={"name"} label={"Access name"} value={inputValue.name} className="w-full" />
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
                                    <ToggleSwitch onChange={handleChange} name={`create_${option}`} label="Create" isChecked={permissionsValues[`create_${option}`]}   />
                                    <ToggleSwitch onChange={handleChange} name={`edit_${option}`} label="Edit" isChecked={permissionsValues[`edit_${option}`]} />
                                    <ToggleSwitch onChange={handleChange} name={`delete_${option}`} label="Delete" isChecked={permissionsValues[`delete_${option}`]} />
                                    <ToggleSwitch onChange={handleChange} name={`view_${option}`} label="View" isChecked={permissionsValues[`view_${option}`]} />
                                </div>
                            )
                        })}

                    {/* </div> */}
                </div>
                <div className="flex gap-2 justify-end mt-10">
                        <Button
                            value="Close"
                            className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
                            onClick={CloseForm}
                        />
                        <Button value="Save" className={" p-3 text-white"} onClick={handleSubmit} loading={loading} />
                    </div>
            </form>
        </div>
    );
}

AccessForm.propTypes = {
    handleChange: PropTypes.func,
    handleNameChange: PropTypes.func,
    selectedTab: PropTypes.string,
    inputValue: PropTypes.object,
    onSubmit: PropTypes.func,
}

export default AccessForm;

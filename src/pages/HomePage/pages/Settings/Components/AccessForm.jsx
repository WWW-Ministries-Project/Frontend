import PropTypes from 'prop-types';
import Button from '../../../../../components/Button';
import ToggleSwitch from '../../../../../components/ToggleInput';
import InputDiv from '../../../Components/reusable/InputDiv';
import arrowDown from '/src/assets/down.svg';
import rightArrow from '/src/assets/rightArrow.svg';
import SearchMembersCard from '/src/components/SearchMembersCard';
import TextField from '/src/pages/HomePage/Components/reusable/TextField';

const AccessForm = ({ handleChange,handleNameChange, permissionsValues, inputValue, onSubmit, loading, CloseForm, buttonText,...props }) => {
    function handleSubmit() {
        onSubmit();
    }
    const topOptions = ["Dashboard", "Members", "Departments", "Positions", "Access Rights"];


    const handleHideBlock = ({currentTarget}) => {
        currentTarget.parentElement.nextSibling.className="hidden";
        currentTarget.className="hidden";
        currentTarget.nextSibling.className="block cursor-pointer text-gray";
    }
    const handleShowBlock = ({currentTarget}) => {
        currentTarget.parentElement.nextSibling.className="flex flex-col gap-3";
        currentTarget.className="hidden";
        currentTarget.previousSibling.className="block cursor-pointer text-gray";
    }
    return (
        <div>
            <form className="mt-5">
                <InputDiv onChange={handleNameChange} type="text" id={"name"} label={"Access name"} value={inputValue.name} className="w-full" />
                <TextField onChange={handleNameChange} value={inputValue.description} />
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
                                        {/* <img src="/src/assets/down.svg" alt="down arrow" aria-roledescription='down' className="cursor-pointer" ref={permissionBlock} onClick={handleHideBlock} /> */}
                                        <div className="cursor-pointer text-gray down" onClick={handleHideBlock}><img src={arrowDown} alt="arrow down" /></div>
                                        <div className="cursor-pointer hidden text-gray right" onClick={handleShowBlock}><img src={rightArrow} alt="right arrow" className='w-4 h-4 bg-gray rounded' /></div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <ToggleSwitch onChange={handleChange} name={`create_${option}`} label="Create" isChecked={permissionsValues[`create_${option}`]}   />
                                        <ToggleSwitch onChange={handleChange} name={`edit_${option}`} label="Edit" isChecked={permissionsValues[`edit_${option}`]} />
                                        <ToggleSwitch onChange={handleChange} name={`delete_${option}`} label="Delete" isChecked={permissionsValues[`delete_${option}`]} />
                                        <ToggleSwitch onChange={handleChange} name={`view_${option}`} label="View" isChecked={permissionsValues[`view_${option}`]} />
                                    </div>
                                </div>
                            )
                        })}

                    {/* </div> */}
                </div>
                <SearchMembersCard users={props.members}/>
                <div className="flex gap-2 justify-end mt-10">
                        <Button
                            value="Close"
                            className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
                            onClick={CloseForm}
                        />
                        <Button value={buttonText} className={" p-3 text-white"} onClick={handleSubmit} loading={loading} />
                    </div>
            </form>
        </div>
    );
}

AccessForm.propTypes = {
    handleChange: PropTypes.func,
    handleNameChange: PropTypes.func,
    CloseForm: PropTypes.func,
    selectedTab: PropTypes.string,
    inputValue: PropTypes.object,
    permissionsValues: PropTypes.object,
    onSubmit: PropTypes.func,
    buttonText: PropTypes.string,
    members: PropTypes.array,
    loading: PropTypes.bool
}

export default AccessForm;

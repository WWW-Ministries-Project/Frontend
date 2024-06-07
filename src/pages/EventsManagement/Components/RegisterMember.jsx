import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import Button from "/src/components/Button";
import PropTypes from 'prop-types';
import SelectField from "/src/pages/HomePage/Components/reusable/SelectField";

const RegisterMember = ({memberDetails, name, loading,handleChange,onSubmit}) => {
    const handleSubmit=() =>{
        onSubmit()
    }
    return (
        <div className="">
            <h2 className="H400">Welcome to {name}</h2>
            <p className='text-sma text-mainGray'>Member is new Please fill in the form below to capture attendance</p>
            <div className="mt-4 flex flex-col gap-4">
                <InputDiv type='text' id='first_name' label="First Name" placeholder='Enter first name' value={memberDetails.first_name} onChange={handleChange}  />
                <InputDiv type='text' id='last_name' label="Last Name" placeholder='Enter last name' value={memberDetails.last_name} onChange={handleChange}  />
                <InputDiv type='text' id='other_name' label="Other Name" placeholder='Enter other name' value={memberDetails.other_name} onChange={handleChange}  />
                <InputDiv type='text' id='phone_number' label="Phone Number" placeholder='Enter phone number' value={memberDetails.name} onChange={handleChange}  />
                {/* <InputDiv type='text' id='other_name' label="Other Name" placeholder='Enter other name' value=""  /> */}
                <SelectField options={[{name:'Male',value:"Male"},{name:'Female',value:"Female"}]} id='gender' label='Gender' placeholder="Select Gender" onChange={handleChange} />
                {/* <SelectField options={[{name:'Male',value:"male"},{name:'females',value:"female"}]} label='Memebership status' placeholder="Select Membership status" /> */}
                <div className="flex justify-between my-4">
                    <Button value="Cancel" className="text-primaryViolet bg-transparent w-40 py-1 border rounded-sm" />
                    <Button value="Save" className="text-white w-40 py-1 border rounded-sm" loading={loading} onClick={handleSubmit}  disabled={!memberDetails.first_name || !memberDetails.phone_number || loading} />
                </div>
            </div>
        </div>
    );
}
RegisterMember.propTypes = {
    memberDetails: PropTypes.object,
    name: PropTypes.string,
    loading: PropTypes.bool,
    handleChange: PropTypes.func,
    onSubmit: PropTypes.func,
}

export default RegisterMember;

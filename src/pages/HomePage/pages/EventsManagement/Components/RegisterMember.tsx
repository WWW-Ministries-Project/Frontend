import Button from "@/components/Button";
import InputDiv from "@/pages/HomePage/Components/reusable/InputDiv";
import SelectField from "@/pages/HomePage/Components/reusable/SelectField";
import ContactInput from "@/components/ContactInput";

interface RegisterMemberProps {
    memberDetails: {
        first_name: string,
        last_name: string,
        other_name: string,
        gender: string,
        new_member: boolean
        phone_number: string
    }
    name: string
    loading: boolean
    handleChange: (name: string, value: string|number) => void
    onSubmit: () => void
}

const RegisterMember:React.FC<RegisterMemberProps> = ({memberDetails, name, loading,handleChange,onSubmit}) => {
    const handleSubmit=() =>{
        onSubmit()
    }
    const handleCancel = () => {
        window.location.reload();
    }
    return (
        <div className="">
            <h2 className="H400">Welcome to {name}</h2>
            <p className='text-sma text-mainGray'>Member is new Please fill in the form below to capture attendance</p>
            <div className="mt-4 flex flex-col gap-4">
                <InputDiv type='text' id='first_name' label="First Name" placeholder='Enter first name' value={memberDetails.first_name} onChange={handleChange}  />
                <InputDiv type='text' id='last_name' label="Last Name" placeholder='Enter last name' value={memberDetails.last_name} onChange={handleChange}  />
                <InputDiv type='text' id='other_name' label="Other Name" placeholder='Enter other name' value={memberDetails.other_name} onChange={handleChange}  />
                {/* <InputDiv type='text' id='phone_number' label="Phone Number" placeholder='Enter phone number' value={memberDetails.phone_number} onChange={handleChange}  /> */}
                {/* @ts-ignore */}
                <ContactInput label="Phone number" inputClass="border border-2" type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} />
                {/* <InputDiv type='text' id='other_name' label="Other Name" placeholder='Enter other name' value=""  /> */}
                <SelectField options={[{name:'Male',value:"Male"},{name:'Female',value:"Female"}]} id='gender' label='Gender' placeholder="Select Gender" onChange={handleChange} />
                {/* <SelectField options={[{name:'Male',value:"male"},{name:'females',value:"female"}]} label='Memebership status' placeholder="Select Membership status" /> */}
                <div className="flex justify-between my-4">
                    <Button value="Cancel" className="text-primaryViolet bg-transparent w-40 p-1 border rounded-lg"onClick={handleCancel} />
                    <Button value="Save" className="text-white w-40 p-2 bg-primaryViolet border rounded-lg" loading={loading} onClick={handleSubmit}  disabled={!memberDetails.first_name || !memberDetails.phone_number || loading} />
                </div>
            </div>
        </div>
    );
}


export default RegisterMember;

import FormWrapper from '/src/Wrappers/FormWrapper';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import InputDiv from '/src/pages/HomePage/Components/reusable/InputDiv';
import Button from '/src/components/Button';
import success from '/src/assets/images/success.png';
// import axios from 'axios';
import axios from "/src/axiosInstance.js"

const EventRegister = () => {
    const [memberDetails, setMemberDetails] = useState({ phone_number: '' });
    const [memberFound, setMemberFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleFindMember = () => {
        setLoading(true)
        axios.get("/event/search-user", { phone_number: memberDetails.phone_number }).then((res) => {
            setLoading(false)
            setMemberDetails(res.data.data)
            setMemberFound("found");
        })
    }
    const handleConfirm = () => {
        setLoading(true)
        axios.post(`/event/sign-attendance?event_id=${memberDetails.user_id}`, { phone_number: memberDetails.primary_number, new_member: false }).then(() => {
            setLoading(false)
            setMemberFound("confirmed");
        }).catch(()=>{})
    }

    const handleChange = (name, value) => {
        setMemberDetails((prev) => ({ ...prev, [name]: value }));
    }

    return (
        <FormWrapper >
            {!memberFound && <div>
                <h2 className='H400'>Welcome to {"props.event.name"}</h2>
                <p className='text-sma text-mainGray'>Fill the form below to capture your attendance</p>
                <div className='w-full mt-10'>
                    <InputDiv label="Phone number" inputClass="border border-2" type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} />
                    <Button value="Next" className="w-full mt-8 text-white mt-10 h-8 border border-primaryViolet " disabled={!memberDetails.phone_number} onClick={handleFindMember} loading={loading} />
                </div>
            </div>}
            {memberFound == "found" &&
                <div>
                    <h2 className='H400'>Confirmation</h2>
                    <p className='text-sma text-mainGray'>Confirm if the details below are yours</p>
                    <div className='w-full mt-10'>
                        <InputDiv label="Name" inputClass="border border-2 mb-4" value={memberDetails.name} type="tel" id="phone_number" disabled={true} />
                        <InputDiv label="Phone number" inputClass="border border-2" value={memberDetails.primary_number} type="tel" id="phone_number" disabled={true} />
                        <Button value="Confirm" className="w-full mt-8 text-white mt-10 h-8 border border-primaryViolet " onClick={handleConfirm} />
                    </div>
                </div>}
            {memberFound == "confirmed" &&
                <div>
                    <div className='w-full flex flex-col items-center gap-4'>
                        <img src={success} alt="" />
                        <h2 className='H400 text-primaryViolet'>Attendance recorded successfully</h2>
                    </div>
                </div>}


        </FormWrapper>
    );
}


export default EventRegister;

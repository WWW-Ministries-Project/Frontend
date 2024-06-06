import FormWrapper from '/src/Wrappers/FormWrapper';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import InputDiv from '/src/pages/HomePage/Components/reusable/InputDiv';
import Button from '/src/components/Button';
import success from '/src/assets/images/success.png';

const EventRegister = () => {
    const [memberFound, setMemberFound] = useState(false);
    const handleFindMember = () => {
        setMemberFound("found");
    }
    const handleConfirm = () => {
        setMemberFound("confirmed");
    }

    return (
        <FormWrapper >
            {!memberFound && <div>
                <h2 className='H400'>Welcome to {"props.event.name"}</h2>
                <p className='text-sma text-mainGray'>Fill the form below to capture your attendance</p>
                <div className='w-full mt-10'>
                    <InputDiv label="Phone number" inputClass="border border-2" type="tel" id="phone_number" placeholder="Enter your phone number" value="" onChange={() => { }} />
                    <Button value="Next" className="w-full mt-8 text-white mt-10 h-8 border border-primaryViolet " onClick={handleFindMember} />
                </div>
            </div>}
            {memberFound=="found" &&
                <div>
                    <h2 className='H400'>Confirmation</h2>
                    <p className='text-sma text-mainGray'>Confirm if the details below are yours</p>
                    <div className='w-full mt-10'>
                        <InputDiv label="Name" inputClass="border border-2 mb-4" type="tel" id="phone_number" value="" disabled={true} />
                        <InputDiv label="Phone number" inputClass="border border-2" type="tel" id="phone_number" value="" disabled={true} />
                        <Button value="Confirm" className="w-full mt-8 text-white mt-10 h-8 border border-primaryViolet " onClick={handleConfirm} />
                    </div>
                </div>}
            {memberFound=="confirmed" &&
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

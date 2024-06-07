import FormWrapper from '/src/Wrappers/FormWrapper';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import InputDiv from '/src/pages/HomePage/Components/reusable/InputDiv';
import Button from '/src/components/Button';

import axios from 'axios';
import { baseUrl } from '/src/pages/Authentication/utils/helpers';
import SearchMember from '../Components/SearchMember';
import MemberConfirmation from '../Components/MemberConfirmation';
import MemberConfirmed from '../Components/MemberConfirmed';
// import axios from "/src/axiosInstance.js"

const EventRegister = () => {
    const [memberDetails, setMemberDetails] = useState({ phone_number: '' });
    const [memberFound, setMemberFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const query = location.search;
    const params = new URLSearchParams(query);
    const name = params.get('event_name');
    const id = params.get('event_id')
    const handleFindMember = () => {
        setLoading(true)
        axios.get(`${baseUrl}/event/search-user?phone=${memberDetails.phone_number}`).then((res) => {
            setLoading(false)
            setMemberDetails(res.data.data)
            setMemberFound("found");
        }).catch(()=>{
            setLoading(false)
        })
    }
    const handleConfirm = () => {
        setLoading(true)
        axios.post(`${baseUrl}/event/sign-attendance?event_id=${id}`, { phone_number: memberDetails.primary_number, new_member: false }).then(() => {
            setLoading(false)
            setMemberFound("confirmed");
        }).catch(()=>{setLoading(false)})
    }

    const handleChange = (name, value) => {
        setMemberDetails((prev) => ({ ...prev, [name]: value }));
    }

    return (
        <FormWrapper >
            {!memberFound && <>
            <SearchMember memberDetails={memberDetails} handleFindMember={handleFindMember} handleChange={handleChange} loading={loading} name={name} />
            </>}
            {memberFound == "found" &&
                <MemberConfirmation memberDetails={memberDetails} handleConfirm={handleConfirm} loading={loading}/>}
            {memberFound == "confirmed" &&
                <MemberConfirmed/>}


        </FormWrapper>
    );
}


export default EventRegister;

import { useState } from 'react';
import FormWrapper from '/src/Wrappers/FormWrapper';

import axios from 'axios';
import MemberConfirmation from '../Components/MemberConfirmation';
import MemberConfirmed from '../Components/MemberConfirmed';
import RegisterMember from '../Components/RegisterMember';
import SearchMember from '../Components/SearchMember';
import { baseUrl } from '/src/pages/Authentication/utils/helpers';
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
            if (res.status == 200) {
                setMemberDetails(res.data.data)
                setMemberFound("found");
            }else if(res.status==204){
                setMemberDetails({phone_number:"",first_name:"",last_name:"",other_name:"",gender:"",new_member:true})
                setMemberFound("not_found")
            }
        }).catch(() => {
            setMemberFound("not_found")
            setLoading(false)
        })
    }
    const handleConfirm = () => {
        setLoading(true)
        axios.post(`${baseUrl}/event/sign-attendance?event_id=${id}`, { phone_number: memberDetails.primary_number, new_member: false }).then(() => {
            setLoading(false)
            setMemberFound("confirmed");
        }).catch(() => { setLoading(false) })
    }

    const handleChange = (name, value) => {
        setMemberDetails((prev) => ({ ...prev, [name]: value }));
    }
    const handleNewAttendee = () => {
        setLoading(true);
        axios.post(`${baseUrl}/event/sign-attendance?event_id=${id}`, memberDetails).then((res) => {
            setLoading(false)
            setMemberFound('confirmed')
        }).catch(() => {
            setLoading(false)
        })
    }

    return (
        <FormWrapper >
            {!memberFound && <>
                <SearchMember memberDetails={memberDetails} handleFindMember={handleFindMember} handleChange={handleChange} loading={loading} name={name} />
            </>}
            {memberFound == "found" &&
                <MemberConfirmation memberDetails={memberDetails} handleConfirm={handleConfirm} loading={loading} />}
            {memberFound == "not_found" &&
                <RegisterMember memberDetails={memberDetails} loading={loading} name={name} handleChange={handleChange} onSubmit={handleNewAttendee} />}
            {memberFound == "confirmed" &&
                <MemberConfirmed />}


        </FormWrapper>
    );
}


export default EventRegister;

import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import Button from "/src/components/Button";
import PropTypes from 'prop-types';

const SearchMember = ({memberDetails,handleChange,loading,handleFindMember,name}) => {
    return (
        <div>
                <h2 className='H400'>Welcome to {name}</h2>
                <p className='text-sma text-mainGray'>Fill the form below to capture your attendance</p>
                <div className='w-full mt-10'>
                    <InputDiv label="Phone number" inputClass="border border-2" type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} />
                    <Button value="Next" className="w-full mt-8 text-white mt-10 h-8 border border-primaryViolet " disabled={!memberDetails.phone_number} onClick={handleFindMember} loading={loading} />
                </div>
            </div>
    );
}

SearchMember.propTypes ={
    memberDetails: PropTypes.object,
    handleChange: PropTypes.func,
    handleFindMember: PropTypes.func,
    loading: PropTypes.bool,
    name:PropTypes.string
}

export default SearchMember;

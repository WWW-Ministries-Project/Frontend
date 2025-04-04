import {ContactInput} from "@/components/ContactInput";
import PropTypes from 'prop-types';
import Button from "/src/components/Button";

const SearchMember = ({ memberDetails, handleChange, loading, handleFindMember, name }) => {
    return (
        <div className="space-y-4">
            <div>
            <h2 className='H400'>Welcome to {name}</h2>
            <p className='text-sma text-dark900'>Fill the form below to capture your attendance</p>
            </div>
            <div className=' '>
                {/* <InputDiv label="Phone number" inputClass="border border-2" type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} /> */}
                <ContactInput label="Phone number"   type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} />
                
            </div>
            <div>
            <Button value="Next" className="w-full  text-white  border bg-primary  " disabled={!memberDetails.phone_number} onClick={handleFindMember} loading={loading} />
            </div>
        </div>
    );
}

SearchMember.propTypes = {
    memberDetails: PropTypes.object,
    handleChange: PropTypes.func,
    handleFindMember: PropTypes.func,
    loading: PropTypes.bool,
    name: PropTypes.string
}

export default SearchMember;

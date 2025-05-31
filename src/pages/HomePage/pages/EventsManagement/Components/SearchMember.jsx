import PropTypes from 'prop-types';
import { Button } from "/src/components";

const SearchMember = ({ memberDetails, handleChange, loading, handleFindMember, name }) => {
    return (
        <div className="space-y-4">
            <div>
                <h2 className='H400 text-white'>Welcome to {name}</h2>
                <p className='text-sma text-white'>Fill the form below to capture your attendance</p>
            </div>
            <div className=' '>
                {/* <InputDiv label="Phone number" inputClass="border border-2" type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} /> */}
                {/* <ContactInput label="Phone number" type="tel" id="phone_number" placeholder="Enter your phone number" value={memberDetails.phone_number} onChange={handleChange} /> */}
                <div className="mb-4">
                    <label htmlFor={"phone_number"} className="block text-sm font-medium text-white mb-1">
                        Phone number
                    </label>
                    <input
                        type={"tel"}
                        id={"phone_number *"}
                        name={"phone_number"}
                        placeholder={"Enter your phone number"}
                        value={memberDetails.phone_number}
                        onChange={(e) => {handleChange("phone_number",e.target.value)}}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

            </div>
            <div>
                <Button value="Next" variant="primary" disabled={!memberDetails.phone_number} onClick={handleFindMember} loading={loading} />
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

import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import Button from "/src/components/Button";
import PropTypes from "prop-types";

const MemberConfirmation = ({ memberDetails, handleConfirm, loading }) => {
  return (
    <div>
      <h2 className="H400">Confirmation</h2>
      <p className="text-sma text-mainGray">
        Confirm if the details below are yours
      </p>
      <div className="w-full mt-10">
        <InputDiv
          label="Name"
          inputClass="border border-2 mb-4"
          value={memberDetails.name}
          type="tel"
          id="phone_number"
          disabled={true}
        />
        <div className="w-full flex gap-2">
          <InputDiv
            label="Code"
            inputClass="border border-2 mb-4 w-[63px]"
            value={memberDetails.country_code}
            type="tel"
            id="country_code"
            disabled={true}
          />
          <InputDiv
            label="Phone number"
            inputClass="border border-2 "
            value={memberDetails.primary_number}
            type="tel"
            id="phone_number"
            disabled={true}
          />
        </div>
        <Button
          value="Confirm"
          className="w-full mt-8 text-white mt-10 h-8 border border-primaryViolet "
          onClick={handleConfirm}
          loading={loading}
        />
      </div>
    </div>
  );
};

MemberConfirmation.propTypes = {
  memberDetails: PropTypes.object,
  handleConfirm: PropTypes.func,
  loading: PropTypes.bool,
};
export default MemberConfirmation;

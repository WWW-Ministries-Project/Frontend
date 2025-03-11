import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import MembersForm from "../Components/MembersForm";
import MemberInformationViewMode from "../Components/MembersInformationViewMode";
const MemberInformation = () => {
  const { edit, handleCancel, details, handleChange, handleSubmit, loading } =
    useOutletContext<{
      edit: boolean;
      handleCancel: () => void;
      details: any;
      handleChange: (name: string, value: string | boolean) => void;
      handleSubmit: (val: any) => void;
      loading: boolean;
    }>();
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-3 bg-white p-4 rounded-b-xl">
      {edit?<MembersForm
      edit={edit}
      user={details}
      department={[]}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />:
    <div>
      <MemberInformationViewMode 
      user={details}
      />
    </div>}
      </div>

    <div className="space-y-4">
      <div className="bg-white p-4 h-[20rem] rounded-b-xl space-y-4">
        <div className="flex justify-between ">
        <div className="font-semibold">
        Membership school
        </div>
        <div>
          icon
        </div>
        </div>
        {/* List of programs */}
        <div>
          
        </div>
      </div>
      <div className="bg-white p-4 h-[20rem] rounded-xl">
        Children
      </div>
    </div>
    </div>
  );
};
MemberInformation.propTypes = {
  user: PropTypes.object,
  department: PropTypes.array,
  positions: PropTypes.array,
};

export default MemberInformation;

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
    <div>
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
  );
};
MemberInformation.propTypes = {
  user: PropTypes.object,
  department: PropTypes.array,
  positions: PropTypes.array,
};

export default MemberInformation;


import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import MembersForm from "../Components/MembersForm";
const MemberInformation = () => {
    const { edit, handleCancel,details, handleChange, handleSubmit, loading } = useOutletContext();
    return (
        <MembersForm edit={edit} user={details} department={[]} positions={[]} onChange={handleChange} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    );
}
MemberInformation.propTypes = {
    user: PropTypes.object,
    department: PropTypes.array,
    positions: PropTypes.array
}

export default MemberInformation;

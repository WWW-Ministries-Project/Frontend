
import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import MembersForm from "../Components/MembersForm";
const MemberInformation = () => {
    const { edit, handleEdit,details } = useOutletContext();
    return (
        <MembersForm edit={edit} user={details} department={[]} positions={[]} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />
    );
}
MemberInformation.propTypes = {
    user: PropTypes.object,
    department: PropTypes.array,
    positions: PropTypes.array
}

export default MemberInformation;

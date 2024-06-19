
import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import MembersForm from "../Components/MembersForm";
import { useUserStore } from "@/store/userStore";
const MemberInformation = () => {
    const { edit, handleEdit } = useOutletContext();
    const {selectedMember} = useUserStore();
    return (
        <MembersForm edit={edit} user={selectedMember.userInfo} />
    );
}
MemberInformation.propTypes = {
    user: PropTypes.object,
    department: PropTypes.array,
    positions: PropTypes.array
}

export default MemberInformation;

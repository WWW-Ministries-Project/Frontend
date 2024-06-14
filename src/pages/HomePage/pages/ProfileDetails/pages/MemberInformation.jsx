
import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import InputDiv from "../../../Components/reusable/InputDiv";
import SelectField from "../../../Components/reusable/SelectField";
import Button from "/src/components/Button";
import MembersForm from "../Components/MembersForm";
const MemberInformation = (props) => {
    const { edit, handleEdit } = useOutletContext();
    return (
        <MembersForm edit={edit}  />
    );
}
MemberInformation.propTypes = {
    user: PropTypes.object,
    department: PropTypes.array,
    positions: PropTypes.array
}

export default MemberInformation;

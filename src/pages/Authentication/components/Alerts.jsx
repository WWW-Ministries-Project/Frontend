import { PropTypes } from "prop-types";
import important from "../../../assets/important.svg";

const Alert = (props) => {
  return (
    <>
      <p
        role="alert"
        className={"text-error text-xs bg-errorBG rounded-md flex items-center font-fontRoboto " + props.className}>
        <img src={important} alt="" className="inline-block mr-1"/>
        {props.text}
      </p>
    </>
  );
};

Alert.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default Alert;

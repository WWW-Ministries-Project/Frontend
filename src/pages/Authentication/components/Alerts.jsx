import PropTypes from "prop-types";
import important from "../../../assets/important.svg";

const Alert = (props) => {
  return (
    <p
      id={props.id}
      role="alert"
      aria-live="assertive"
      className={`flex items-center gap-2 rounded-md border border-error/35 bg-errorBG px-3 py-2 text-xs text-error ${props.className || ""}`}
    >
      <img src={important} alt="" className="h-4 w-4" aria-hidden="true" />
      <span>{props.text}</span>
    </p>
  );
};

Alert.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
  id: PropTypes.string,
};

export default Alert;

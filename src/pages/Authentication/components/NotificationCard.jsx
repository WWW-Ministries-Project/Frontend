import PropTypes from "prop-types";

const NotificationCard = (props) => {
  return (
    <>
      <div className={"flex rounded-lg flex-col justify-center h-full "+props.className}>
        <div className="authForm p-10 rounded-lg shadow-lg mx-auto">
          <div className="mx-auto">
            <div className="flex justify-center mb-8">
              <img src={props.src} alt="" />
            </div>
            <div className="">
              <div className="text-center">{props.header}</div>
              <div className="text-center text-wwwGrey mb-8">
                {props.text}
              </div>
              {props.bottomText ? <div className="text-center">{props.bottomText}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

NotificationCard.propTypes = {
    //   response: PropTypes.object,
      header: PropTypes.string,
      text: PropTypes.string,
      src: PropTypes.string,
      bottomText: PropTypes.string,
      className: PropTypes.string,
      
    };

export default NotificationCard;

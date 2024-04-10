import PropTypes from "prop-types";
import ChurchLogo from "../../../components/ChurchLogo";
import Alert from "./Alerts";

const AuthenticationForm = (props) => {


  return (
    <>
      <div className="">
        <form>
          <div className="authForm pt-1 rounded-lg shadow-lg mx-auto bg-primaryViolet">
            <div className="bg-white shadow-sm rounded-lg py-12 px-10 ">
              <ChurchLogo className={' mb-5'} />
              <div className="flex justify-center text-dark900 text-2xl mb-2">{props.header}</div>
              <div className="text-center text-sma text-gray">{props.text}</div>
              <div className="gap-4">
                {props.response?.status === 401 || props.response?.status === 404 ? (
                  <Alert
                    className="  text-left px-2 my-6 h-6"
                    text={"incorrect email or password please try again "}
                  />
                ) : null}
                {/* {props.response.status === 404 ? (
                  <Alert
                    className="  text-left px-2 my-6 h-6"
                    text={"no user"}
                  />
                ) : null} */}
                {props.children}
                
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
AuthenticationForm.propTypes = {
  response: PropTypes.object,
  header: PropTypes.string,
  text: PropTypes.string,
};

export default AuthenticationForm;

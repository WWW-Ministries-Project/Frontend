import PropTypes from "prop-types";
import ChurchLogo from "../../../components/ChurchLogo";
import Alert from "./Alerts";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const AuthenticationForm = (props) => {


  return (
    <>
      <div className=" md:w-2/3  max-w-[500px] h-full mx-auto ">
      <div className="flex ">
                <ChurchLogo show className={'text-white mb-5'} />
              </div>
        <form>
          <div className="authForm pt-1 rounded-xl shadow-lg mx-auto bg-primary/50">
            <div className="bg-white/15 shadow-sm rounded-lg py-8 px-10 ">
              
              <div className="flex  font-bold text-white text-2xl gap-x-4">
                <ArrowLeftIcon className="w-4"/>
                <div>{props.header}</div>
              </div>
              <div className="text-center  text-white">{props.text}</div>
              <div className="gap-4">
                {props.response?.status >= 400 ? (
                  <Alert
                    className="  text-left px-2 my-6 h-6"
                    text={props.errorText ||"incorrect email or password please try again "}
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
  children: PropTypes.node,
};

export default AuthenticationForm;

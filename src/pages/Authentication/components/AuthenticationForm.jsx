import PropTypes from "prop-types";

const AuthenticationForm = (props) => {


  return (
    <>
      <div className="">
        <form>
          <div className="authForm pt-1 rounded-lg shadow-lg mx-auto bg-primaryViolet">
            <div className="bg-white shadow-sm rounded-lg py-12 px-10 ">
              <div className="flex items-center justify-center mb-10">
                <div className="w-[90px]">
                  <img src="/logo/main-logo.svg" alt="logo" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#080808] text-bold">
                    Worldwide Word
                  </span>
                  <span className="text-black">MINISTRIES</span>
                </div>
              </div>
              <div className="flex justify-center ">{props.header}</div>
              <div className="text-center text-sm">{props.text}</div>
              <div className="gap-4">
                {props.response.status === 401 ? (
                  <Alert
                    className=" bg-errorBG text-left px-2 my-6 h-6"
                    text={"incorrect username or password please try again "}
                  />
                ) : null}
                {props.response.status === 404 ? (
                  <Alert
                    className=" bg-errorBG text-left px-2 my-6 h-6"
                    text={"email not verified"}
                  />
                ) : null}
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
//   buttonValue: PropTypes.string,
  // error: PropTypes.object,
  // onChange: PropTypes.func.isRequired,
  // onBlur: PropTypes.func,
  // handleSubmit: PropTypes.func.isRequired,
};

export default AuthenticationForm;

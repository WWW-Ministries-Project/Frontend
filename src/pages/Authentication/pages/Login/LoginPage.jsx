import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import InputPassword from "../../../../components/Password";
import Alert from "../../components/Alerts";
import PropTypes from "prop-types";

function LoginPage(props) {
  return (
    <>
      <main className="flex flex-col justify-center h-screen">
        <form>
          <div className="authForm pt-2 rounded-lg shadow-lg mx-auto bg-primaryViolet">
            <div className="bg-white shadow-sm rounded-lg py-12 px-12 ">
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
              <div className="flex justify-center">Welcome back!</div>
              <div className="text-center">
                Login to your account to continue.
              </div>
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
                <Input
                  label="Email"
                  type="email "
                  id="mail"
                  name="email"
                  value={props.inputValue.email}
                  isRequired={props.error.status && !props.inputValue.email}
                  onChange={props.onChange}
                  onBlur={props.onBlur}
                  placeholder={"Enter Email Address"}
                  inputClass={
                    props.error.status
                      ? " h-8 rounded-md px-4 mt-2 border-error"
                      : " h-8 rounded-md px-4 mt-2"
                  }
                  className="my-4 !p-0"
                />
                <InputPassword
                  label="Password"
                  id="password"
                  name="password"
                  value={props.inputValue.password}
                  isRequired={props.error.status && !props.inputValue.password}
                  onChange={props.onChange}
                  onBlur={props.onBlur}
                  placeholder={"Password"}
                  inputClass={
                    props.error.status
                      ? " h-8 rounded-md px-4 mt-2 border-error"
                      : " h-8 rounded-md px-4 mt-2"
                  }
                  className=" !p-0"
                />
                <Button
                  value="Login"
                  onClick={props.handleSubmit}
                  className={"w-full h-[38px] bg-primaryViolet my-8 text-white"}
                />
              </div>
              <div>
                <div className="text-mainGray">
                  Forgot Password <span className="text-wwmBlue">Reset</span>
                </div>
                <div className="text-mainGray">
                  Don't have an account{" "}
                  <span className="text-wwmBlue">Register</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}

LoginPage.propTypes = {
  inputValue: PropTypes.object,
  error: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  handleSubmit: PropTypes.func.isRequired,
};

export default LoginPage;

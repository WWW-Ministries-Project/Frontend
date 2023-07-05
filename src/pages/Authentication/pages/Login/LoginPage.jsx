import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import InputPassword from "../../../../components/Password";
import AuthenticationForm from "../../components/AuthenticationForm";
import OuterDiv from "../../components/OuterDiv";
import PropTypes from "prop-types";

function LoginPage(props) {
  return (
    <>
      <OuterDiv>
        <AuthenticationForm
          response={props.response}
          header={"Welcome!"}
          text={"Login to your account to continue."}
          buttonValue={"Login"}
          handleSubmit={props.handleSubmit}>
          {/* <div className="gap-4"> */}

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
            value={"Login"}
            onClick={props.handleSubmit}
            className={"w-full h-[38px] bg-primaryViolet my-8 text-white"}
          />
          <div>
            <div className="text-mainGray">
              Forgot Password <span className="text-wwmBlue">Reset</span>
            </div>
            <div className="text-mainGray">
              Don't have an account{" "}
              <span className="text-wwmBlue">Register</span>
            </div>
          </div>

          {/* </div> */}
        </AuthenticationForm>
      </OuterDiv>
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

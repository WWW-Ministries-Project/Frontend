import axios from "axios";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../../../../components/Button";
import InputPassword from "../../../../components/Password";
import AuthenticationForm from "../../components/AuthenticationForm";
import OuterDiv from "../../components/OuterDiv";
import { baseUrl, validate } from "../../utils/helpers";
import NotificationCard from "../../components/NotificationCard";

function ResetPassword() {
  const [passwordValues, setPasswordValues] = useState({});
  const [response, setResponse] = useState({});
  const [error, setError] = useState({});
  const [samePassword, setSamePassword] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");
  function handleSubmit(e) {
    e.preventDefault();
    if (passwordValues.password2 && samePassword) {
      const body = { newpassword: passwordValues.password1, token };
      console.log(body, "token");
      (async () => {
        try {
          const endpoint = baseUrl + "/user/change-password";
          const response = await axios.post(endpoint, body);
          console.log(response, "res");
        } catch (error) {
          console.log(error, "error");
        }
      })();
    }
  }

  function handleBlur(e) {
    const name = e.target.name;
    const isValid = validate(name, passwordValues);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    !isValid && e.target.setCustomValidity("Invalid format");
    // console.log(e.target, "tag");
    // console.log(error, name, "err", validate(name, passwordValues));

    //checks if confirm password is already populated and then checks passwords equality if it is
    if (passwordValues.password2) checkPassword();
  }
  function checkPassword(e) {
    if (passwordValues.password1 === passwordValues.password2) {
      setSamePassword(true);
    } else {
      setSamePassword(false);
      e.target.setCustomValidity("Invalid format");
    }
  }

  function handleInputChange(e) {
    setResponse({});
    const name = e.target.name;
    setPasswordValues((prev) => ({ ...prev, [name]: e.target.value }));
    // to remove error msg
    if (error[name]) {
      if (validate(name, passwordValues)) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
    //checks if confirm password contains values and if user is done typing once before
    if (passwordValues.password2 && !samePassword) checkPassword();
  }

  return (
    <>
      <OuterDiv>
        {response.status == 200 ? (
          <div className="pt-1 authForm rounded-lg mx-auto bg-wwmBlue">
            <NotificationCard
              className={"bg-white"}
              header="New Password Set"
              text="Your new password has been set successfully. Proceed to login with your new password"
              src={"/assets/authentication/successIcon.svg"}
            />
          </div>
        ) : (
          <AuthenticationForm
            response={response}
            header={"Set new password!"}
            text={"Enter a new password for your account."}
            buttonValue={"Login"}>
            {/* <div className="gap-4"> */}

            {/* <Input
                label="Email"
                type="email "
                id="mail"
                name="email"
                value={passwordValues.email}
                isRequired={error.status && !passwordValues.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={"Enter Email Address"}
                inputClass={
                  error.status
                    ? " h-8 rounded-md px-4 mt-2 border-error"
                    : " h-8 rounded-md px-4 mt-2"
                }
                className="my-4 !p-0"
              /> */}
            <InputPassword
              label="New Password"
              id="password1"
              name="password1"
              value={passwordValues.password1}
              isRequired={error.status && !passwordValues.password1}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder={"New Password"}
              inputClass={
                error.status
                  ? " h-8 rounded-md px-4 mt-2 border-error"
                  : " h-8 rounded-md px-4 mt-2"
              }
              className=" !p-0 my-4"
            />
            <InputPassword
              label="Confirm New Password"
              id="password2"
              name="password2"
              value={passwordValues.password2}
              isRequired={error.status && !passwordValues.password2}
              samePassword={samePassword}
              onChange={handleInputChange}
              onBlur={checkPassword}
              placeholder={"Confirm Password"}
              inputClass={
                error.status
                  ? " h-8 rounded-md px-4 mt-2 border-error"
                  : " h-8 rounded-md px-4 mt-2"
              }
              className=" !p-0"
            />
            <Button
              value={"Set New Password"}
              onClick={handleSubmit}
              className={"w-full h-[38px] bg-primaryViolet my-8 text-white"}
            />
            <div>
              <div className="text-mainGray text-center">
                <Link to="/login" className="text-wwmBlue">
                  Return to Login
                </Link>
              </div>
            </div>

            {/* </div> */}
          </AuthenticationForm>
        )}
      </OuterDiv>
    </>
  );
}

export default ResetPassword;

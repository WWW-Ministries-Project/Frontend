import PropTypes from "prop-types";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import InputPassword from "../../../../components/Password";
import AuthenticationForm from "../../components/AuthenticationForm";
import OuterDiv from "../../components/OuterDiv";
import { validate } from "../../utils/helpers";
import { baseUrl } from "../../utils/helpers";
import axios from "axios";
import { setToken } from "../../../../utils/helperFunctions";

function LoginPage() {
  const [loginValues, setLoginValues] = useState({  });
  const [response, setResponse] = useState({});
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate=useNavigate();
  function handleSubmit() {

    // console.log("login");
    setLoading(true);
    if (error.email){

    }
    (async () => {
      try {
        const endpoint = baseUrl + "/user/login";
        const response = await axios.post(endpoint, loginValues);
        setLoading(false);
        const token = response.data.token;
        // Set the Authorization header for future requests
        setToken(token);
        response.status == 200 && navigate('/home/dashboard')
      } catch (error) {
        console.log(error, "error");
        setResponse(error.response);
        setLoading(false);
      }
    })();
  }

  function handleBlur(e) {
    const name = e.target.name;
    const isValid = validate(name, loginValues);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    !isValid && e.target.setCustomValidity("Invalid format");
    // console.log(e.target, "tag");
    console.log(error, "err", validate(name, loginValues));
  }

  function handleInputChange(e) {
    setResponse({});
    const name = e.target.name;
    setLoginValues((prev) => ({ ...prev, [name]: e.target.value }));
    // to remove error msg
    if (error[name]) {
      if (validate(name, loginValues)) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
  }
  return (
    <>
      <OuterDiv>
        <AuthenticationForm
          response={response}
          header={"Welcome back!"}
          text={"Login to your account to continue."}
          buttonValue={"Login"}>
          {/* <div className="gap-4"> */}

          <Input
            label="Email"
            type="email "
            id="mail"
            name="email"
            value={loginValues.email}
            isRequired={error.status && !loginValues.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={"Enter email address"}
            inputClass={
              error.status
                ? " h-8 rounded-md px-4 mt-2 border-error"
                : " h-8 rounded-md px-4 mt-2"
            }
            className="my-4 !p-0"
          />
          <InputPassword
            label="Password"
            id="password"
            name="password"
            value={loginValues.password}
            isRequired={error.status && !loginValues.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={"Enter password"}
            inputClass={
              error.status
                ? " h-8 rounded-md px-4 mt-2 border-error"
                : " h-8 rounded-md px-4 mt-2"
            }
            className=" !p-0"
          />
          <Button
            value={"Login"}
            loading={loading}
            onClick={handleSubmit}
            className={"w-full h-[38px] bg-primaryViolet my-8 text-white"}
          />
          <div className="text-lightGray text-sm">
            <div className="mb-4">
              Forgot Password?{" "}
              <Link to="/forgot-password" className="text-primaryViolet">
                Reset
              </Link>
            </div>
            <div className="">
              Don't have an account?{" "}
              <span className="text-primaryViolet">Register</span>
            </div>
          </div>

          {/* </div> */}
        </AuthenticationForm>
      </OuterDiv>
    </>
  );
}

LoginPage.propTypes = {
  error: PropTypes.object,
};

export default LoginPage;

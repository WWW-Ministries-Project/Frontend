import { useState } from "react";
import LoginPage from "./pages/Login/LoginPage";

const Authentication = () => {
  const [response, setResponse] = useState({ });
  const [error, setError] = useState({});
  const [inputValue, setInputValue] = useState({});

  const validateEmail = (email) => {
    // Regular expression pattern for email validation
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    // Perform validation
    return emailPattern.test(email);
  };

  function handleInputChange(e) {
    setResponse({})
    const name = e.target.name;
    setInputValue((prev) => ({ ...prev, [name]: e.target.value }));
    // to remove error msg
    if (error[name]) {
      if (validate(name)) {
        setError((prev) => ({ ...prev, [name]: false }));
        e.target.setCustomValidity("");
      }
    }
  }
  function validate(name) {
    if (name == "email") {
      return validateEmail(inputValue.email);
    }
    if (name == "password") {
      return inputValue.password?.length >0;
    }
    return false;
  }

  function handleBlur(e) {
    const name = e.target.name;
    const isValid = validate(name);
    setError((prev) => ({ ...prev, [name]: !isValid }));
    !isValid && e.target.setCustomValidity("Invalid format");
    console.log(e.target, "tag");
    console.log(error,'err',validate(name));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if(!inputValue.email|| inputValue?.password?.length<1){
        setError(prev=>({...prev,status:true}))
    }
    console.log(inputValue);
  }

  return (
    <>
      <LoginPage
        inputValue={inputValue}
        error={error}
        handleSubmit={handleSubmit}
        response={response}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
    </>
  );
};

export default Authentication;

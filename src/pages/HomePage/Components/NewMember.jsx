// import Input from "../../components/Input";
import InputDiv from "./reusable/InputDiv";
import Button from "../../../components/Button";
import ProfilePicture from "../../../components/ProfilePicture";
import editIcon from "/assets/home/edit.svg";
import { useState } from "react";
import axios from "axios";
import { baseUrl } from "../../Authentication/utils/helpers";
import PropTypes from 'prop-types';

function NewMember(props) {
  const [profilePic, setProfilePic] = useState({});
  const [value, setValue] = useState({});
  function changePic(pic) {
    console.log(pic);
    setProfilePic((prev) => pic);
    // const endpoint='/dashboard/profile/img';
    // const path=`https://storefront-dpqh.onrender.com${endpoint}?uid=${userRef.current.id}`;
    // onSubmit(pic,value) //handleSubmit function in homepage
    const data = new FormData();
    data.append("tag", pic.picture);
    console.log(pic.picture);
    // console.log(data);
    // console.log(path);
    // (async()=>{
    //     try {
    //         const response = await axios.post(path,data);
    //         if (response.status===200)
    //             setProfilePic(prev=> response.data ? ({...prev,src:response.data}) : prev)

    //         console.log(response)
    //     } catch (error) {
    //         console.log(error)

    //     }
    // })()
  }

  // axios.post(`${baseUrl}/member/create-member`,value).then((response) => {
  //   console.log(response);
  // })
  function onSubmit() {
    console.log('submit');
    axios
      .post(`${baseUrl}/member/create-member`, value)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
    // console.log(value);
  }

  /*SET VALID VALUES IN FORM INPUT*/
  function handleChange(name, value) {
    setValue((prev) => ({ ...prev, [name]: value }));
  }
  return (
    <>
      <div className={"userInfo fixed right-0 top-0 h-full z-10 text-mainGray bg-white p-5 text-sma overflow-y-scroll "+props.className }>
        <div className="py-5 border-b border-[#F5F5F5]">
          {/* <div className="w-[176px] h-[176px] bg-[#F5F5F5] mx-auto rounded-full">
              <img src="/assets/images/profilePic.png" alt="profile pic" />
            </div> */}
          {/* <ProfilePicture  id="profilePic" alt="profile pic" imageId="uploadedPic" icon={editIcon}  /> */}
          <ProfilePicture
            src={profilePic.src}
            template={true}
            text={""}
            alt="profile pic"
            icon={editIcon}
            name={"firstname"}
            alternative="edit button"
            className="h-[120px] w-[120px] profilePic transition-all duration-1000 mx-auto"
            textClass={"text-[32px] leading-[36px] mx-8 "}
            onChange={changePic}
            id={"pic"}
          />
        </div>
        <form className="mt-5">
          <div className="flex flex-col gap-6 mb-5 border-b border-[#F5F5F5]">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <label htmlFor="title">Title</label>
                <select name="title" id="title" className="input" onChange={e=>handleChange("title",e.target.value)}>
                  <option value="Mr">Mr.</option>
                  <option value="Miss">Ms.</option>
                  <option value="Mrs">Mrs.</option>
                </select>
              </div>
              <InputDiv onChange={handleChange} label="Full name" id="name" className="w-[244px]" />
            </div>
            <InputDiv onChange={handleChange} type="date" id="date_of_birth" label="Date of birth" className="w-full" />
            <div className="flex flex-col">
              <label htmlFor="gender">Gender</label>
              <select name="gender" id="gender" className="input" onChange={e=>handleChange("title",e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
            <InputDiv onChange={handleChange} type="text" id="country" label="Country" className="w-full" />
            <InputDiv onChange={handleChange} type="tel" id="phone_number_1" label="Phone number 1" className="w-full" />
            <InputDiv onChange={handleChange} type="tel" id="phone_number_2" label="Phone number 2" className="w-full" />
            <InputDiv onChange={handleChange} type="email" id="email" label="Email" className="w-full" />
            <InputDiv onChange={handleChange} type="text" id="address" label="Address" className="w-full" />
            <InputDiv onChange={handleChange} type="text" id="occupation" label="Occupation" className="w-full" />
            <InputDiv onChange={handleChange} type="text" id="department" label="Department" className="w-full mb-5" />
          </div>
          <div className="flex gap-2 justify-end mt-10">
            <Button
              value="Close"
              className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
              onClick={props.CloseForm}
            />
            <Button value="Save" className={" p-3 text-white"} onClick={onSubmit}/>
          </div>
        </form>
      </div>
    </>
  );
}
NewMember.propTypes = {
  className: PropTypes.string,
}
export default NewMember;

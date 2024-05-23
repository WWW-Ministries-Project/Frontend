// import Input from "../../components/Input";
import PropTypes from 'prop-types';
import { useState } from "react";
import Button from "../../../components/Button";
import ProfilePicture from "../../../components/ProfilePicture";
import InputDiv from "./reusable/InputDiv";
import editIcon from "/assets/home/edit.svg";
import ToggleSwitch from '../../../components/ToggleInput';
import SelectField from './reusable/SelectField';
import axios from 'axios';
import { baseUrl } from '/src/pages/Authentication/utils/helpers';

function NewMember(props) {
  const [profilePic, setProfilePic] = useState({});
  // const [userValue, setUserValue] = useState({"password": "123456","department_id": "","name": "","email": "","primary_number": "","date_of_birth": "","gender": "","is_active": true,"address": "","occupation": "","company": "","department_head": 0,"country": ""});
  function changePic(pic) {
    setProfilePic(() => pic);
  }

  // function onSubmit() {
  //   // props.onSubmit(userValue) MOVED TO PARENT
  //   // props.onSubmit()
  //   const data = new FormData();
  //   data.append("file", profilePic.picture);
  //   const baseUrl = "https://jack.greatsohis.online"
  //   const endpoint = "/upload";
  //   const path= `${baseUrl}${endpoint}`;
  //   (async()=>{
  //       try {
  //           const response = await axios.post(path,data);
  //           if (response.status===200)
  //               // setProfilePic(prev=> response.data ? ({...prev,src:response.data}) : prev)
  //           console.log(response.data.result.link)
  //           new Promise (props.handlePictureUpdate(response.data.result.link)).then(()=>props.onSubmit());
  //           // props.onSubmit();m- 
  //       } catch (error) {
  //           console.log(error)

  //       }
  //   })()
    
  // }
  async function onSubmit() {
    const data = new FormData();
    data.append("file", profilePic.picture);
    const endpoint = "/upload";
    const path = `${baseUrl}${endpoint}`;
  
    try {
      const response =profilePic.picture && await axios.post(path, data);
      if (profilePic.picture && response.status === 200) {
        const link = response.data.result.link;
        await props.handlePictureUpdate(link);
      }
        setProfilePic({});
        props.onSubmit(); // Call onSubmit after handlePictureUpdate completes
    } catch (error) {
      console.log(error);
    }
  }

  function handleCloseForm (){
    setProfilePic({});
    props.CloseForm();
  }
  

  /*SET VALID VALUES IN FORM INPUT*/
  // function handleChange(name, value) {
  //   if(name === "department_id"){
  //     setUserValue((prev) => ({ ...prev, [name]: parseInt(value) }));
  //   }
  //   else
  //   setUserValue((prev) => ({ ...prev, [name]: value }));
  // }
  function handleChange(name, value) {
    props.onChange(name, value)
  }
  return (
    <>
      <div className={"userInfo fixed right-0 top-10 h-full z-10 text-mainGray bg-white p-5 text-sma overflow-y-scroll shadow-xl "+props.className }>
        <div className="py-5 border-b border-[#F5F5F5]">
          {/* <div className="w-[176px] h-[176px] bg-[#F5F5F5] mx-auto rounded-full">
              <img src="/assets/images/profilePic.png" alt="profile pic" />
            </div> */}
          {/* <ProfilePicture  id="profilePic" alt="profile pic" imageId="uploadedPic" icon={editIcon}  /> */}
          <ProfilePicture
            src={profilePic.src}
            template={true}
            editable={true}
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
              <InputDiv onChange={handleChange} value={props.userValue.name} label="Full name" id="name" className="w-[244px]" />
            </div>
            <InputDiv onChange={handleChange} type="date" id="date_of_birth" label="Date of birth" className="w-full" />
            <div className="flex flex-col">
              <label htmlFor="gender">Gender</label>
              <select name="gender" id="gender" className="input" onChange={e=>handleChange("gender",e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
            <InputDiv onChange={handleChange} value={props.userValue.country} type="text" id="country" label="Country" className="w-full" />
            <InputDiv onChange={handleChange} value={props.userValue.primary_number} type="tel" id="primary_number" label="Phone number 1" className="w-full" />
            {/* <InputDiv onChange={handleChange} type="tel" id="phone_number_2" label="Phone number 2" className="w-full" /> */}
            <InputDiv onChange={handleChange} value={props.userValue.email} type="email" id="email" label="Email" className="w-full" />
            <InputDiv onChange={handleChange} value={props.userValue.address} type="text" id="address" label="Address" className="w-full" />
            <InputDiv onChange={handleChange} value={props.userValue.occupation} type="text" id="occupation" label="Occupation" className="w-full" />
            <InputDiv onChange={handleChange} value={props.userValue.company} type="text" id="company" label="Company" className="w-full" />
            {/* <InputDiv onChange={handleChange} type="text" id="department" label="Department" className="w-full mb-5" /> */}
            <SelectField onChange={handleChange} value={+props.userValue.department_id} label={"Department"} id={"department_id"} options={props.selectOptions} placeholder={"Select a department"} />
            <InputDiv onChange={handleChange} value={props.userValue.member_since} type="date" id="member_since" label="Member since" className="w-full mb-5" />
            {/* <InputDiv onChange={handleChange} value={userValue.last_visited} type="number" id="last_visited" label="Last Visited" className="w-full mb-5" /> */}
            <ToggleSwitch onChange={handleChange} name="is_user" label="Can Login" isChecked={props.userValue.is_user} />
          </div>
          <div className="flex gap-2 justify-end mt-10">
            <Button
              value="Close"
              className={" p-3 bg-white border border-[#F5F5F5] text-dark900"}
              onClick={handleCloseForm}
            />
            <Button value="Save" className={" p-3 text-white"} onClick={onSubmit} loading={props.loading} disabled={props.disabled} />
          </div>
        </form>
      </div>
    </>
  );
}
NewMember.propTypes = {
  className: PropTypes.string,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  CloseForm: PropTypes.func,
  handlePictureUpdate: PropTypes.func,
  userValue: PropTypes.object,
  selectOptions: PropTypes.array,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
}
export default NewMember;

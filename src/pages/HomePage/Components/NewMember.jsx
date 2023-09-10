// import Input from "../../components/Input";
import InputDiv from "./InputDiv";
import Button from "../../../components/Button";
import ProfilePicture from "../../../components/ProfilePicture";
import editIcon from "/assets/home/edit.svg";
import { useState } from "react";

function NewMember (props) {

  const [profilePic,setProfilePic] = useState({});
  function changePic (pic) {

    console.log(pic);                  
    setProfilePic(prev=>(pic));  
    // const endpoint='/dashboard/profile/img';
    // const path=`https://storefront-dpqh.onrender.com${endpoint}?uid=${userRef.current.id}`;
    // onSubmit(pic,value) //handleSubmit function in homepage
    const data = new FormData() 
    data.append('tag',pic.picture);
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
  };
    return (
        <>
        <div className="w-[353px] userInfo fixed right-0 top-0 h-full z-10 text-mainGray bg-white p-5 text-sma overflow-y-scroll">
          <div className="py-5 border-b border-[#F5F5F5]">
            {/* <div className="w-[176px] h-[176px] bg-[#F5F5F5] mx-auto rounded-full">
              <img src="/assets/images/profilePic.png" alt="profile pic" />
            </div> */}
            {/* <ProfilePicture  id="profilePic" alt="profile pic" imageId="uploadedPic" icon={editIcon}  /> */}
            <ProfilePicture src={profilePic.src} template={true} text={""} alt='profile pic' icon={editIcon}  name={   'firstname'} alternative='edit button' className='h-[120px] w-[120px] profilePic transition-all duration-1000 mx-auto' textClass={'text-[32px] leading-[36px] mx-8 '} onChange={changePic} id={'pic'}  /> 
          </div>
          <form className="mt-5">
            <div className="flex flex-col gap-6 mb-5 border-b border-[#F5F5F5]">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <label htmlFor="title">Title</label>
                  <select name="title" id="title" className="input">
                    <option value="Mr">Mr.</option>
                    <option value="Miss">Ms.</option>
                    <option value="Mrs">Mrs.</option>
                  </select>
                </div>
                <InputDiv label="Full name" id="name" className="w-[244px]" />
              </div>
              <InputDiv type="date" label="Date of birth" className="w-full" />
              <div className="flex flex-col">
                <label htmlFor="gender">Gender</label>
                <select name="gender" id="gender" className="input">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>
              <InputDiv type="text" label="Country" className="w-full" />
              <InputDiv type="tel" label="Phone number 1" className="w-full" />
              <InputDiv type="tel" label="Phone number 2" className="w-full" />
              <InputDiv type="email" label="Email" className="w-full" />
              <InputDiv type="text" label="Address" className="w-full" />
              <InputDiv type="text" label="Occupation" className="w-full" />
              <InputDiv type="text" label="Department" className="w-full mb-5" />
            </div>
            <div className="flex gap-2 justify-end mt-10">
              <Button value="Close" className={' p-3 bg-white border border-[#F5F5F5] text-dark900'} onClick={props.CloseForm} />
              <Button value="Save" className={' p-3 text-white'}/>
            </div>
          </form>
        </div>
        </>
    )
}


export default NewMember
import Button from "/src/components/Button";
import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import SelectField from "/src/pages/HomePage/Components/reusable/SelectField";
import TextField from "/src/pages/HomePage/Components/reusable/TextField";
import axios from "/src/axiosInstance";
import { useAuth } from "/src/auth/AuthWrapper";
import { useEffect } from "react";
import { formatInputDate } from "/src/utils/helperFunctions";
import cloud_upload from "../../../assets/cloud_upload.svg"

import {useState } from "react";
import ProfilePic from "@/components/ProfilePicture";
import ImageUpload from "@/components/ImageUpload";
const CreateEvent = () => {
    const {user} = useAuth();
    const [inputValue, setInputValue] = useState({ name: "", start_date: "", end_date: "", start_time: "", end_time: "", location: "", description: ""});
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);

    const query = location.search;
    const params = new URLSearchParams(query);
    const id = params.get('event_id');
    useEffect(() => {
        if(id){
            setInputValue(prev=>({...prev, updated_by: user?.id}))
            axios.get(`/event/get-event?id=${id}`).then((res) => {
                setInputValue(res.data.data);
            })
        }else{
            setInputValue(prev=>({...prev, created_by: user?.id}))
        }
    }, [])

    const handleChange = (name, value) => {
        setInputValue({ ...inputValue, [name]: value });
    };

    const handleSubmit = () => {
        setLoading(true);
        axios.post("/event/create-event", inputValue).then((res) => {
            setLoading(false);
            window.location.href = "/home/events";
        }).catch((err) => {
            setLoading(false);
            console.log(err, "err");
        })
    };

    return (
        <section className="p-8 container text-mainGray bg-white rounded-xl mx-auto">
            <h1 className="H700 ">Create Event</h1>
            <p className="text-sma text-lightGray">Fill in the form below with the event details</p>
            <form className="flex flex-col gap-4 mt-4 w-full ">
            {/* <div className="flex justify-center items-center w-[25vw] h-[15vh] border border-[primaryGray] border-dashed rounded-xl">
                <div>
                    <img className="mx-auto" src={cloud_upload} alt="" srcset="" />
                    <div className="text-center">Click here to upload the event banner</div>
                </div>
                </div> */}
                {/* <ProfilePic 
                className="w-[25vw] h-[15vh] border border-[primaryGray] border-dashed rounded-xl" 
                text=''
                icon={cloud_upload}
                /> */}
                <ImageUpload onFileChange={(file) => setFile(file)}/>
                <h2 className="H400">Event Information</h2>
                

                <div className="flex flex-col gap-1">
                <div className="grid phone:grid-cols-2 grid tablet:grid-cols-2 gap-4">
                    <InputDiv label="Event Name" type="text" id="name" value={inputValue.name} onChange={handleChange} />
                    <InputDiv label="Event type" type="text" id="name" value={inputValue.name} onChange={handleChange} />
                </div>
                
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H400 my-4">Date & Time Informations</h2>
                    <div className="w-full sm:w-1/2">
                    <InputDiv label="Start Date" type="date" id="start_date" value={formatInputDate(inputValue.start_date)} onChange={handleChange} />
                    </div>
                    <div className="grid phone:grid-cols-2 grid tablet:grid-cols-2 gap-4">
                        
                        {/* <InputDiv label="End Date" type="date" id="end_date" value={formatInputDate(inputValue.end_date)} onChange={handleChange} /> */}
                        {/* <SelectField label="Repeat" type="date" id="end_date" value={inputValue.repeat} onChange={handleChange} placeholder="Does event repeat" options={[{ name: "Repeat", value: "repeat" }, { name: "Doesn't repeat", value: "end_date" }]} /> */}
                        <InputDiv label="Start Time" type="time" id="start_time" value={inputValue.start_time} onChange={handleChange} />
                        <InputDiv label="End Time" type="time" id="end_time" value={inputValue.end_time} onChange={handleChange} />
                    </div>
                    <div className="w-full sm:w-1/2">
                        <p class="mt-1 text leading-6 text-gray-600">Is this a one-day or multi-days event?</p>
                        <div class="mt-2  grid grid-cols-3">
                        <div class="flex items-center gap-x-3">
                        <input id="push-everything" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
                        <label for="push-everything" class="block text-sm font-medium leading-6 text-gray-900">One-day</label>
                        </div>
                        <div class="flex items-center gap-x-3">
                        <input id="push-email" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
                        <label for="push-email" class="block text-sm font-medium leading-6 text-gray-900">Multi-days</label>
                        </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H400 my-3">Repetition</h2>
                    <div className="w-full sm:w-1/2">
                        <p class="mt-1 text leading-6 text-gray-600">Is this a one-day or multi-days event?</p>
                        <div class="mt-2  grid grid-cols-3">
                        <div class="flex items-center gap-x-3">
                        <input id="push-everything" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
                        <label for="push-everything" class="block text-sm font-medium leading-6 text-gray-900">Yes</label>
                        </div>
                        <div class="flex items-center gap-x-3">
                        <input id="push-email" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
                        <label for="push-email" class="block text-sm font-medium leading-6 text-gray-900">No</label>
                        </div>
                        </div>
                    </div>

                    <div className="w-full sm:w-1/2">
                    <div className="grid phone:grid-cols-2 grid tablet:grid-cols-2 gap-1">
                    <InputDiv label="Event Name" type="text" id="name" value={inputValue.name} onChange={handleChange} />
                    <InputDiv label="." type="text" id="name" value={inputValue.name} onChange={handleChange} />
                </div>
                    </div>

                    {/* <TextField label="Description" type="text" id="description" value={inputValue.description} onChange={handleChange} /> */}
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H400 my-3">Other Information</h2>
                    <div className=" phone:grid-cols-2 grid tablet:grid-cols-2 gap-4">
                        <InputDiv label="Location" type="text" id="location" value={inputValue.location} onChange={handleChange} />
                    </div>
                    <TextField label="Description" type="text" id="description" value={inputValue.description} onChange={handleChange} />
                </div>
                <div className="flex gap-4 justify-end">
                    <Button value="Cancel" className="p-2 px-4 text-primaryViolet bg-transparent border" onClick={() => window.history.back()} />
                    <Button value="Save" className="p-2 px-4 text-white bg-primaryViolet" onClick={handleSubmit} loading={loading} disabled={loading || !inputValue.name} />
                </div>

                <fieldset>
          <legend class="text-sm font-semibold leading-6 text-gray-900">Push Notifications</legend>
          <p class="mt-1 text-sm leading-6 text-gray-600">These are delivered via SMS to your mobile phone.</p>
          <div class="mt-6 space-y-6">
            <div class="flex items-center gap-x-3">
              <input id="push-everything" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
              <label for="push-everything" class="block text-sm font-medium leading-6 text-gray-900">Everything</label>
            </div>
            <div class="flex items-center gap-x-3">
              <input id="push-email" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
              <label for="push-email" class="block text-sm font-medium leading-6 text-gray-900">Same as email</label>
            </div>
            <div class="flex items-center gap-x-3">
              <input id="push-nothing" name="push-notifications" type="radio" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"/>
              <label for="push-nothing" class="block text-sm font-medium leading-6 text-gray-900">No push notifications</label>
            </div>
          </div>
        </fieldset>
            </form>
        </section>
    );
}

export default CreateEvent;

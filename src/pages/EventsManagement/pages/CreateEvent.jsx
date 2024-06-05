import Button from "/src/components/Button";
import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import SelectField from "/src/pages/HomePage/Components/reusable/SelectField";
import TextField from "/src/pages/HomePage/Components/reusable/TextField";
import axios from "/src/axiosInstance";
import { useAuth } from "/src/auth/AuthWrapper";

import {useState } from "react";
const CreateEvent = () => {
    const {user} = useAuth();
    const [inputValue, setInputValue] = useState({ name: "", start_date: "", end_date: "", start_time: "", end_time: "", location: "", description: "",created_by: user?.id });
    const [loading, setLoading] = useState(false);

    const handleChange = (name, value) => {
        setInputValue({ ...inputValue, [name]: value });
        console.log(inputValue, "inputValue");
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
        <section className="px-4 text-mainGray">
            <h1 className="H700 mb-4">Create Event</h1>
            <p className="text-sma text-lightGray">Fill in the form below with the event details</p>
            <form className="flex flex-col gap-4 mt-4 w-full sm:w-1/2 md:w-2/3 ">
                <h2 className="H600">Event Information</h2>
                <div className="w-full sm:w-1/2">
                    <InputDiv label="Event Name" type="text" id="name" value={inputValue.name} onChange={handleChange} />
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H600 my-4">Date & Time Informations</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InputDiv label="Start Date" type="date" id="start_date" value={inputValue.date} onChange={handleChange} />
                        <InputDiv label="End Date" type="date" id="end_date" value={inputValue.end_date} onChange={handleChange} />
                        {/* <SelectField label="Repeat" type="date" id="end_date" value={inputValue.repeat} onChange={handleChange} placeholder="Does event repeat" options={[{ name: "Repeat", value: "repeat" }, { name: "Doesn't repeat", value: "end_date" }]} /> */}
                        <InputDiv label="Start Time" type="time" id="start_time" value={inputValue.start_time} onChange={handleChange} />
                        <InputDiv label="End Time" type="time" id="end_time" value={inputValue.end_time} onChange={handleChange} />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H600 my-4">Other Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InputDiv label="Location" type="text" id="location" onChange={handleChange} />
                    </div>
                    <TextField label="Description" type="text" id="description" onChange={handleChange} />
                </div>
                <div className="flex gap-4 justify-end">
                    <Button value="Cancel" className="p-2 px-4 text-primaryViolet bg-transparent border" onClick={() => window.history.back()} />
                    <Button value="Save" className="p-2 px-4 text-white" onClick={handleSubmit} loading={loading} disabled={loading || !inputValue.name} />
                </div>
            </form>
        </section>
    );
}

export default CreateEvent;

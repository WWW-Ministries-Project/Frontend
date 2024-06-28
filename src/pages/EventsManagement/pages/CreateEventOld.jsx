import { useState, useEffect } from "react";
import axios from "/src/axiosInstance";
import { useAuth } from "/src/auth/AuthWrapper";
import { formatInputDate } from "/src/utils/helperFunctions";
import Button from "/src/components/Button";
import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import SelectField from "/src/pages/HomePage/Components/reusable/SelectField";
import TextField from "/src/pages/HomePage/Components/reusable/TextField";
import ImageUpload from "@/components/ImageUpload";

const CreateEvent = () => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState({
    name: "",
    type: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    description: "",
    isRepetitive: false,
    repeatEvery: 1,
    repeatUnit: "months",
    repeatDays: [],
    ends: "end_of_year",
    endsOn: "",
    isMultiDay: false,
    number_days: 1,
    poster: "",
  });
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const query = location.search;
  const params = new URLSearchParams(query);
  const id = params.get("event_id");

  useEffect(() => {
    if (id) {
      setInputValue((prev) => ({ ...prev, updated_by: user?.id }));
      axios.get(`/event/get-event?id=${id}`).then((res) => {
        setInputValue(res.data.data);
      });
    } else {
      setInputValue((prev) => ({ ...prev, created_by: user?.id }));
    }
  }, [id, user]);

  const handleChange = (name, value) => {
    setInputValue({ ...inputValue, [name]: value });
  };

  const handleMultiSelectChange = (name, value) => {
    const values = inputValue[name];
    const index = values.indexOf(value);
    if (index === -1) {
      values.push(value);
    } else {
      values.splice(index, 1);
    }
    setInputValue({ ...inputValue, [name]: values });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const data = new FormData();
    if (file) {
      data.append("file", file);
    }

    try {
      let posterLink = '';
      if (file) {
        const uploadResponse = await axios.post("/upload", data);
        if (uploadResponse.status === 200) {
          posterLink = uploadResponse.data.result.link;
        }
      }

      const eventData = { ...inputValue, poster: posterLink };

      const response = await axios.post("/event/create-event", eventData);
      if (response.status === 200) {
        window.location.href = "/home/events";
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <section className="p-8 container  bg-white rounded-xl mx-auto">
      <h1 className="H700">Create Event</h1>
      <p className="text-sma text-lightGray">
        Fill in the form below with the event details
      </p>
      <form className="flex flex-col gap-4 mt-4 w-full">
        <ImageUpload onFileChange={(file) => setFile(file)} />
        <h2 className="H400">Event Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <InputDiv
            label="Event Name"
            type="text"
            id="name"
            value={inputValue.name}
            onChange={handleChange}
          />
          <SelectField
            label="Event Type"
            id="type"
            value={inputValue.type}
            onChange={handleChange}
            options={[
              { name: "Conference", value: "conference" },
              { name: "Workshop", value: "workshop" },
              { name: "Webinar", value: "webinar" },
              { name: "Other", value: "other" },
            ]}
          />
        </div>
        <h2 className="H400 my-4">Date & Time Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <InputDiv
            label="Start Date"
            type="date"
            id="start_date"
            value={formatInputDate(inputValue.start_date)}
            onChange={handleChange}
          />
          <InputDiv
            label="Start Time"
            type="time"
            id="start_time"
            value={inputValue.start_time}
            onChange={handleChange}
          />
          <InputDiv
            label="End Time"
            type="time"
            id="end_time"
            value={inputValue.end_time}
            onChange={handleChange}
          />
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Is this a one-day or multi-day event?
          </p>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-x-2">
              <input
                type="radio"
                name="event-duration"
                value="one-day"
                checked={!inputValue.isMultiDay}
                onChange={() => handleChange("isMultiDay", false)}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              One-day
            </label>
            <label className="flex items-center gap-x-2">
              <input
                type="radio"
                name="event-duration"
                value="multi-days"
                checked={inputValue.isMultiDay}
                onChange={() => handleChange("isMultiDay", true)}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              Multi-days
            </label>
          </div>
          {inputValue.isMultiDay && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <InputDiv
                  label="Number of days"
                  type="number"
                  id="number_days"
                  value={inputValue.number_days}
                  onChange={handleChange}
                />
                <InputDiv
                  label="End Date"
                  type="date"
                  id="end_date"
                  value={formatInputDate(inputValue.end_date)}
                  onChange={handleChange}
                />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Repeat on:</p>
                <div className="flex gap-2">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <label key={index} className="flex items-center gap-x-2">
                      <input
                        type="checkbox"
                        value={day}
                        checked={inputValue.repeatDays.includes(day)}
                        onChange={() => handleMultiSelectChange("repeatDays", day)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Ends:</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-x-2">
                    <input
                      type="radio"
                      name="ends"
                      value="end_of_year"
                      checked={inputValue.ends === "end_of_year"}
                      onChange={() => handleChange("ends", "end_of_year")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    End of the year
                  </label>
                  <label className="flex items-center gap-x-2">
                    <input
                      type="radio"
                      name="ends"
                      value="on"
                      checked={inputValue.ends === "on"}
                      onChange={() => handleChange("ends", "on")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    On
                    <InputDiv
                      label=""
                      type="date"
                      id="endsOn"
                      value={formatInputDate(inputValue.endsOn)}
                      onChange={handleChange}
                      className="ml-2"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <h2 className="H400 my-3">Repetition</h2>
        <div className="mt-4">
          <p className="text-sm text-gray-600">Is this event a repetitive event?</p>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-x-2">
              <input
                type="radio"
                name="repetition"
                value="yes"
                checked={inputValue.isRepetitive}
                onChange={() => handleChange("isRepetitive", true)}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              Yes
            </label>
            <label className="flex items-center gap-x-2">
              <input
                type="radio"
                name="repetition"
                value="no"
                checked={!inputValue.isRepetitive}
                onChange={() => handleChange("isRepetitive", false)}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              No
            </label>
          </div>
          {inputValue.isRepetitive && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <InputDiv
                  label="Repeat Every"
                  type="number"
                  id="repeatEvery"
                  value={inputValue.repeatEvery}
                  onChange={(e) => handleChange("repeatEvery", e.target.value)}
                />
                <SelectField
                  label="Repeat Unit"
                  id="repeatUnit"
                  value={inputValue.repeatUnit}
                  onChange={(e) => handleChange("repeatUnit", e.target.value)}
                  options={[
                    { name: "Days", value: "days" },
                    { name: "Weeks", value: "weeks" },
                    { name: "Months", value: "months" },
                    { name: "Years", value: "years" },
                  ]}
                />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Repeat on:</p>
                <div className="flex gap-5">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <label key={index} className="flex items-center gap-x-1">
                      <input
                        type="checkbox"
                        value={day}
                        checked={inputValue.repeatDays.includes(day)}
                        onChange={() => handleMultiSelectChange("repeatDays", day)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Ends:</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-x-2">
                    <input
                      type="radio"
                      name="ends"
                      value="end_of_year"
                      checked={inputValue.ends === "end_of_year"}
                      onChange={() => handleChange("ends", "end_of_year")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    End of the year
                  </label>
                  <label className="flex items-center gap-x-2">
                    <input
                      type="radio"
                      name="ends"
                      value="on"
                      checked={inputValue.ends === "on"}
                      onChange={() => handleChange("ends", "on")}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    On
                    <InputDiv
                      label=""
                      type="date"
                      id="endsOn"
                      value={formatInputDate(inputValue.endsOn)}
                      onChange={handleChange}
                      className="ml-2"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <h2 className="H400 my-3">Other Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <InputDiv
            label="Location"
            type="text"
            id="location"
            value={inputValue.location}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Event Description"
            type="textarea"
            id="description"
            value={inputValue.description}
            onChange={handleChange}
          />
        </div>
        <div className="flex gap-4 justify-end mt-4">
          <Button
            value="Cancel"
            className="p-2 px-4 text-primaryViolet bg-transparent border"
            onClick={() => window.history.back()}
          />
          <Button
            value="Save"
            className="p-2 px-4 text-white bg-primaryViolet"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || !inputValue.name}
          />
        </div>
      </form>
    </section>
  );
};

export default CreateEvent;

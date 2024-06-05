import SelectField from "/src/pages/HomePage/Components/reusable/SelectField";
import InputDiv from "/src/pages/HomePage/Components/reusable/InputDiv";
import TextField from "/src/pages/HomePage/Components/reusable/TextField";
import Button from "/src/components/Button";

const CreateEvent = () => {
    return (
        <section className="px-4 text-mainGray">
            <h1 className="H700 mb-4">Create Event</h1>
            <p className="text-sma text-lightGray">Fill in the form below with the event details</p>
            <form className="flex flex-col gap-4 mt-4 w-full sm:w-1/2 md:w-2/3 ">
                <h2 className="H600">Event Information</h2>
                <div className="w-full sm:w-1/2">
                    <InputDiv label="Event Name" type="text" name="event_name" />
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H600 my-4">Date & Time Informations</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InputDiv label="Date" type="date" name="start_date" />
                        <SelectField label="Repeat" type="date" name="end_date" placeholder="Does event repeat" options={[{ name: "Repeat", value: "repeat" }, { name: "Doesn't repeat", value: "end_date" }]} />
                        <InputDiv label="Start Time" type="time" name="start_time" />
                        <InputDiv label="End Time" type="time" name="start_time" />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="H600 my-4">Other Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <InputDiv label="Location" type="text" name="location" />
                    </div>
                    <TextField label="Description" type="text" name="description" />
                </div>
                <div className="flex gap-4 justify-end">
                    <Button value="Cancel" className="p-2 px-4 text-primaryViolet bg-transparent border" />
                    <Button value="Save" className="p-2 px-4 text-white" />
                </div>
            </form>
        </section>
    );
}

export default CreateEvent;

import FormikInputDiv from "@/components/FormikInput";
import { Field, Formik } from "formik";
// import { formatInputDate } from "@/utils/helperFunctions";
import Button from "@/components/Button";
import React from "react";
// import SelectField from "@/pages/HomePage/Components/reusable/SelectFields";
import FormikSelectField from "@/components/FormikSelect";

interface EventsFormProps {
  inputValue: any;
  handleMultiSelectChange: any;
  onSubmit: (val: any) => void;
}

const EventsForm: React.FC<EventsFormProps> = (props) => {
  const handleMultiSelectChange = (name: string, value: Array<string>) => {
    const values = value;
    const index = values.indexOf(name);
    if (index === -1) {
      values.push(name);
    } else {
      values.splice(index, 1);
    }
    return values;
  };

  return (
    <Formik
      onSubmit={(val) => {
        props.onSubmit(val);
      }}
      initialValues={props.inputValue}
    >
      {(props) => (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <h2 className="H400">Event Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Event Name"
              id="name"
              name="name"
            />
            <Field
              component={FormikSelectField}
              options={[
                { name: "Conference", value: "conference" },
                { name: "Workshop", value: "workshop" },
                { name: "Webinar", value: "webinar" },
                { name: "Other", value: "other" },
              ]}
              label="Event Name"
              id="type"
              name="type"
            />
          </div>
          <h2 className="H400 my-4">Date & Time Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Start Date"
              type="date"
              id="start_date"
              name="start_date"
            />
            <Field
              component={FormikInputDiv}
              label="Start Time"
              type="time"
              id="start_time"
              name="start_time"
            />
            <Field
              component={FormikInputDiv}
              label="End Time"
              type="time"
              id="end_time"
              name="end_time"
              onChange={() => {
                console.log(props);
              }}
            />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Is this a one-day or multi-day event?
            </p>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="isMultiDay" value={"one"} />
                One-day
              </label>
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="isMultiDay" value="multi" />
                Multi-day
              </label>
            </div>
            {props.values.isMultiDay == "multi" && (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    component={FormikInputDiv}
                    label="Number of days"
                    type="number"
                    id="number_days"
                    name="number_days"
                  />
                  <Field
                    component={FormikInputDiv}
                    label="End Date"
                    type="date"
                    id="end_date"
                    name="end_date"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Repeat on:</p>
                  <div className="flex gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-x-2"
                        >
                          <input
                            type="checkbox"
                            value={day}
                            checked={props.values.repeatDays.includes(day)}
                            onChange={() => {
                              console.log("changed");
                              const temp = handleMultiSelectChange(
                                day,
                                props.values.repeatDays
                              );
                              props.setFieldValue("repeatDays", temp);
                            }}
                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          {day}
                        </label>
                      )
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Ends:</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-x-2">
                      <Field type="radio" name="ends" value="end_of_year" />
                      End of the year
                    </label>
                    <label className="flex items-center gap-x-2">
                      <Field type="radio" name="ends" value="on" />
                      On
                      <Field
                        component={FormikInputDiv}
                        label=""
                        type="date"
                        id="endsOn"
                        name="endsOn"
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
            <p className="text-sm text-gray-600">
              Is this event a repetitive event?
            </p>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="repetition" value="yes" />
                Yes
              </label>
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="repetition" value="no" />
                No
              </label>
            </div>
            {props.values.repetition == "yes" && (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    component={FormikInputDiv}
                    label="Repeat Every"
                    type="number"
                    id="repeatEvery"
                    name="repeatEvery"
                  />
                  <Field
                    component={FormikSelectField}
                    label="Repeat Unit"
                    id="repeatUnit"
                    name="repeatUnit"
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
                    {["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <label key={index} className="flex items-center gap-x-1">
                        <input
                            type="checkbox"
                            value={day}
                            checked={props.values.repeatDays.includes(day)}
                            onChange={() => {
                              console.log("changed");
                              const temp = handleMultiSelectChange(
                                day,
                                props.values.repeatDays
                              );
                              props.setFieldValue("repeatDays", temp);
                            }}
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
                    <Field type="radio" name="ends" value="year" />
                      End of the year
                    </label>
                    <label className="flex items-center gap-x-2">
                    <Field type="radio" name="repetition" value="on" />
                      On
                      <Field
                      component={FormikInputDiv}
                        label=""
                        type="date"
                        id="endsOn"
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
          <Field
          component={FormikInputDiv}
            label="Location"
            type="text"
            id="location"
            name="location"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            component={FormikInputDiv}
            label="Event Description"
            id="description"
            name="description"
            type="textarea"
            inputClass=" !h-48 resize-none"
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
            onClick={() => {
                props.handleSubmit();
              }}
          />
        </div>
        </div>
      )}
    </Formik>
  );
};

export default EventsForm;

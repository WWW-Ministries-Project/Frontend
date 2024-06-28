import FormikInputDiv from "@/components/FormikInput";
import { Field, Formik } from "formik";
// import { formatInputDate } from "@/utils/helperFunctions";
import Button from "@/components/Button";
import React from "react";
// import SelectField from "@/pages/HomePage/Components/reusable/SelectFields";
import FormikSelectField from "@/components/FormikSelect";
import { eventFormValidator, maxMinValueForDate } from "../utils/eventHelpers";

interface EventsFormProps {
  inputValue: any;
  handleMultiSelectChange: any;
  onSubmit: (val: any) => void;
  loading?:boolean
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
        // console.log(val);
      }}
      initialValues={props.inputValue}
      validationSchema={eventFormValidator}
    >
      {(form) => (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <h2 className="H400">Event Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Event Name"
              id="name"
              name="name"
            />
            {/* <ErrorMessage name="name" component={"div"} /> */}
            <Field
              component={FormikSelectField}
              options={[
                { name: "Activity", value: "ACTIVITY" },
                { name: "Program", value: "PROGRAM" },
                { name: "Service", value: "SERVICE" },
                { name: "Other", value: "other" },
              ]}
              label="Event Type"
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
            />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Is this a one-day or multi-day event?
            </p>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="day_event" value={"one"} />
                One-day
              </label>
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="day_event" value="multi" />
                Multi-day
              </label>
            </div>
            {form.values.day_event == "multi" && (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    component={FormikInputDiv}
                    label="Number of days"
                    type="number"
                    id="recurring.daysOfWeek"
                    name="recurring.daysOfWeek"
                    min={2}
                  />
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
                <Field type="radio" name="repetitive" value="yes" />
                Yes
              </label>
              <label className="flex items-center gap-x-2">
                <Field type="radio" name="repetitive" value="no" />
                No
              </label>
            </div>
            {form.values.repetitive == "yes" && (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    component={FormikInputDiv}
                    label="Repeat Every"
                    type="number"
                    id="recurring.interval"
                    name="recurring.interval"
                    min={1}
                  />
                  <Field
                    component={FormikSelectField}
                    label="Repeat Unit"
                    id="recurring.frequency"
                    name="recurring.frequency"
                    options={[
                      { name: "Days", value: "daily" },
                      { name: "Weeks", value: "weekly" },
                      { name: "Months", value: "monthly" },
                    ]}
                  />
                  <Field
                    component={FormikInputDiv}
                    label="End Date"
                    type="date"
                    id="end_date"
                    name="end_date"
                    min={form.values.start_date}
                    max={maxMinValueForDate().maxDate}
                  />
                </div>
                {/* {form.values.recurring.frequency == "weeks" && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Repeat on:</p>
                    <div className="flex gap-5">
                      {["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-x-1"
                          >
                            <input
                              type="checkbox"
                              value={day}
                              checked={form.values.repeatDays.includes(day)}
                              onChange={() => {
                                console.log("changed");
                                const temp = handleMultiSelectChange(
                                  day,
                                  form.values.repeatDays
                                );
                                form.setFieldValue("repeatDays", temp);
                              }}
                              className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            {day}
                          </label>
                        )
                      )}
                    </div>
                  </div>
                )} */}
                {form.values.recurring?.frequency == "months" && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Ends:</p>
                    <div className="flex gap-4">
                      <Field
                        component={FormikInputDiv}
                        label=""
                        type="date"
                        id="end_date"
                        name="end_date"
                        min={maxMinValueForDate().minDate}
                        max={maxMinValueForDate().maxDate}
                        className="ml-2"
                      />
                    </div>
                  </div>
                )}
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
              type={"submit"}
              className="p-2 px-4 text-white bg-primaryViolet"
              loading={props.loading}
              onClick={() => {
                form.handleSubmit();
              }}
            />
          </div>
        </div>
      )}
    </Formik>
  );
};

export default EventsForm;

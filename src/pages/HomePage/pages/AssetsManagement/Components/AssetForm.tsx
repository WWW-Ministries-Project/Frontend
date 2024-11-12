import FormikInputDiv from "@/components/FormikInput";
import { Field, Formik } from "formik";
// import { formatInputDate } from "@/utils/helperFunctions";
import Button from "@/components/Button";
// import SelectField from "@/pages/HomePage/Components/reusable/SelectFields";
import FormikSelectField from "@/components/FormikSelect";
// import { formatInputDate, getChangedValues } from "@/utils/helperFunctions";
// import { eventFormValidator, maxMinValueForDate } from "../utils/eventHelpers";

// interface EventsFormProps {
//   inputValue: any;
//   handleMultiSelectChange: any;
//   onSubmit: (val: any) => void;
//   loading?: boolean;
//   updating?: boolean;
// }

const AssetForm = () => {
  // const handleMultiSelectChange = (name: string, value: Array<string>) => {
  //   const values = value;
  //   const index = values.indexOf(name);
  //   if (index === -1) {
  //     values.push(name);
  //   } else {
  //     values.splice(index, 1);
  //   }
  //   return values;
  // };

  return (
    <Formik
      // onSubmit={(val) => {
      //   props.onSubmit(val);
      //   // console.log(val);
      // }}
      onSubmit={(val) => {
        // const changedValues = props.updating
        //   ? getChangedValues(props.inputValue, val)
        //   : val;
        // // console.log("Changed values:", changedValues);
        // props.onSubmit(changedValues);
      }}
      // initialValues={props.inputValue}
      initialValues={[]}
      // validationSchema={eventFormValidator}
    >
      {(form) => (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <h2 className="H400 text-dark900 font-bold">Asset Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Asset name"
              id="name"
              name="name"
              // value={form.values.name || props.inputValue.name}
            />
            {/* <ErrorMessage name="name" component={"div"} /> */}
            <Field
              component={FormikInputDiv}
              label="Asset ID"
              id="name"
              name="name"
              // value={form.values.name || props.inputValue.name}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Date purchased"
              type="date"
              id="start_date"
              name="start_date"
              // value={
              //   form.values.start_date ||
              //   formatInputDate(props.inputValue.start_date)
              // }
            />
            {/* <ErrorMessage name="name" component={"div"} /> */}
            <Field
              component={FormikInputDiv}
              label="Purchased from (Supplier)"
              id="name"
              name="name"
              // value={form.values.name || props.inputValue.name}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Amount"
              id="name"
              name="name"
              // value={form.values.name || props.inputValue.name}
            />
            {/* <ErrorMessage name="name" component={"div"} /> */}
            <Field
              component={FormikSelectField}
              options={[
                { name: "Assigned", value: "ASSIGNED" },
                { name: "Unassigned", value: "UNASSIGNED" },
                { name: "Not fixable", value: "NOT FIXABLE" },
                { name: "Out of repairs", value: "OUT OF REPAIRS" },
                { name: "Lost/Stolen", value: "LOST/STOLEN" },
              ]}
              label="Status"
              id="statuse"
              name="status"
              // value={form.values.event_type || props.inputValue.event_type}
            />
          </div>

          <div className="grid md:grid-cols- gap-4">
            <Field
              component={FormikInputDiv}
              label="Description"
              id="description"
              name="description"
              type="textarea"
              inputClass=" !h-48 resize-none"
              // value={form.values.description || props.inputValue.description}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              component={FormikSelectField}
              options={[
                { name: "Activity", value: "ACTIVITY" },
                { name: "Program", value: "PROGRAM" },
                { name: "Service", value: "SERVICE" },
                { name: "Other", value: "other" },
              ]}
              label="Assigned to"
              id="event_type"
              name="event_type"
              // value={form.values.event_type || props.inputValue.event_type}
            />
            <Field
              component={FormikInputDiv}
              label="Date of assignment"
              type="date"
              id="start_date"
              name="start_date"
              // value={
              //   form.values.start_date ||
              //   formatInputDate(props.inputValue.start_date)
              // }
            />
            {/* <ErrorMessage name="name" component={"div"} /> */}
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <Button
              value="Cancel"
              className="p-2 px-4 text-primaryViolet bg-transparent border"
              onClick={() => window.history.back()}
            />
            <Button
              value={"Save"}
              type={"submit"}
              className="p-2 px-4 text-white bg-primaryViolet"
              // loading={props.loading}
              // onClick={() => {
              //   form.handleSubmit();
              // }}
            />
          </div>
        </div>
      )}
    </Formik>
  );
};

export default AssetForm;

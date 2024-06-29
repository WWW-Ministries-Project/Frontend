import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { Field, Formik } from "formik";
import React from "react";
import Button from "../../../../../components/Button";
import ContactInput from "../../../../../components/ContactInput";
import {
  formatInputDate,
  genderOptions,
} from "../../../../../utils/helperFunctions";
import useDepartmentStore from "../../Settings/utils/departmentStore";
import usePositionStore from "../../Settings/utils/positionStore";
import { userFormValidator } from "../utils/membersHelpers";
import { OptionsType, UserType } from "../utils/membersInterfaces";
import RadioInput from "./RadioInput";

interface MembersFormProps {
  edit: boolean;
  user: UserType;
  department?: OptionsType[];
  onChange: (name: string, value: string | boolean) => void;
  onSubmit: (val: UserType) => void;
  onCancel: () => void;
  disabled?: boolean;
  loading: boolean;
}

const MembersForm: React.FC<MembersFormProps> = (props) => {
  // function handleChange(name: string, value: string | boolean) {
  //   props.onChange(name, value);
  // }
  const departmentsOptions = useDepartmentStore().departmentsOptions;
  const positionOptions = usePositionStore().positionsOptions;

  const getChangedValues = (initialValues: any, currentValues: any) => {
    const changedValues: any = {};
    for (const key in currentValues) {
      if (typeof currentValues[key] == "object") continue;
      if (currentValues[key] !== initialValues[key]) {
        changedValues[key] = currentValues[key];
      }
    }
    return changedValues;
  };
  return (
    <Formik
      enableReinitialize={true}
      initialValues={props.user}
      onSubmit={(val) => {
        const changedValues = getChangedValues(props.user, val);
        // console.log('Changed values:', changedValues);
        props.onSubmit(changedValues);
      }}
      validationSchema={userFormValidator}
    >
      {(form) => (
        <>
          <section>
            <div className=" text-black font-bold my-5">Membership Status</div>
            <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
              <Field
                component={FormikSelectField}
                label="Membership Type"
                disabled={!props.edit}
                id="membership_type"
                name="membership_type"
                options={[
                  { name: "Member", value: "MEMBER" },
                  { name: "Visitor", value: "VISITOR" },
                ]}
              />
            </div>
          </section>
          <section>
            <div className=" text-black font-bold my-5">
              Personal Information
            </div>
            <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
              <Field
                component={FormikSelectField}
                label="Title"
                disabled={!props.edit}
                id="title"
                name="title"
                options={[
                  { name: "Mr", value: "Mr" },
                  { name: "Mrs", value: "Mrs" },
                  { name: "Miss", value: "Miss" },
                ]}
              />
            </div>
            <div className="w-full grid tablet:grid-cols-2 gap-4">
              {/* <Field
component={FormikInputDiv} label="Name" value="Saah Asiedu" id="name" disabled={!props.edit} /> */}
              <Field
                component={FormikInputDiv}
                label="First Name"
                disabled={!props.edit}
                id="first_name"
                name="first_name"
              />
              {/* <ErrorMessage name="first_name" component="div" /> */}
              <Field
                component={FormikInputDiv}
                label="Other Name"
                disabled={!props.edit}
                id="other_name"
                name="other_name"
              />
              <Field
                component={FormikInputDiv}
                label="Last Name"
                disabled={!props.edit}
                id="last_name"
                name="last_name"
              />
              <Field
                component={FormikInputDiv}
                label="Date of Birth"
                value={formatInputDate(form.values.date_of_birth)}
                disabled={!props.edit}
                id="date_of_birth"
                name="date_of_birth"
                type="date"
              />
              <Field
                component={FormikSelectField}
                label="Gender"
                value={props.user?.gender}
                options={genderOptions}
                disabled={!props.edit}
                id="gender"
                name="gender"
                placeholder={"select gender"}
              />
              <Field
                component={FormikInputDiv}
                label="Marital Status"
                disabled={!props.edit}
                id="maritalstatus"
                name="maritalstatus"
              />
            </div>
          </section>
          <section>
            <div className=" text-black font-bold my-5">
              Contact Information
            </div>
            <div className="w-full grid tablet:grid-cols-2 gap-4">
              <ContactInput
                label="Phone Number"
                contactValue={form.values.primary_number}
                zipCode={props.user?.country_code}
                id="primary_number"
                disabled={!props.edit}
                onChange={(name, val) => {
                  form.setFieldValue(name, val);
                }}
                placeholder="enter phone number"
              />
              <Field
                component={FormikInputDiv}
                label="Email"
                id="email"
                name="email"
                type={"email"}
                disabled={!props.edit}
              />
              {/* <Field
component={FormikInputDiv} label="Secondary Number" value={props.user?.secondary_number} id="secondarynumber" disabled={!props.edit} /> */}
              <Field
                component={FormikInputDiv}
                label="Address"
                id="address"
                name="address"
                disabled={!props.edit}
              />
              <Field
                component={FormikInputDiv}
                label="Country"
                id="country"
                name="country"
                disabled={!props.edit}
              />
            </div>
          </section>
          <section>
            <div className=" text-black font-bold my-5">Church Information</div>
            <div className="mb-5">
              <p className="text-black leading-5 mb-2">
                Is this member a ministry worker?
              </p>
              <RadioInput
                value={form.values.is_user || false}
                onChange={(name, val) => {
                  form.setFieldValue(name, val);
                }}
              />
            </div>
            <div className="w-full  grid tablet:grid-cols-2 gap-4">
              {/* bug from backend */}
              <Field
                component={FormikSelectField}
                label="Ministry/Department"
                id="department_id"
                name="department_id"
                options={departmentsOptions || []}
                disabled={!props.edit}
              />
              <Field
                component={FormikSelectField}
                label="Position"
                id="position_id"
                name="position_id"
                options={positionOptions || []}
                disabled={!props.edit}
              />
            </div>
          </section>
          <section>
            <div className=" text-black font-bold my-5">Work Information</div>
            <div className="w-full  grid tablet:grid-cols-2 gap-4">
              <Field
                component={FormikInputDiv}
                label="Name of Institution"
                value={
                  form.values.work_name ||
                  props.user?.work_info?.name_of_institution
                }
                id="work_name"
                name="work_name"
                disabled={!props.edit}
              />
              <Field
                component={FormikInputDiv}
                label="Industry"
                value={
                  form.values.work_industry || props.user?.work_info?.industry
                }
                id="work_industry"
                name="work_industry"
                disabled={!props.edit}
              />
              <Field
                component={FormikInputDiv}
                label="Position"
                value={
                  form.values.work_position || props.user?.work_info?.position
                }
                id="work_position"
                name="work_position"
                disabled={!props.edit}
              />
            </div>
          </section>
          <section>
            <div className=" text-black font-bold my-5">Emergency Contact</div>
            <div className="w-full  grid tablet:grid-cols-2 gap-4">
              <Field
                component={FormikInputDiv}
                label="Name of Contact"
                disabled={!props.edit}
                value={
                  form.values.emergency_contact_name ||
                  props.user?.emergency_contact?.name
                }
                id="emergency_contact_name"
                name="emergency_contact_name"
              />
              <Field
                component={FormikSelectField}
                label="Relation"
                disabled={!props.edit}
                value={
                  form.values.emergency_contact_relation ||
                  props.user?.emergency_contact?.relation
                }
                id="emergency_contact_relation"
                name="emergency_contact_relation"
                options={[
                  { name: "brother", value: "brother" },
                  { name: "sister", value: "sister" },
                  { name: "father", value: "father" },
                  { name: "mother", value: "mother" },
                  { name: "husband", value: "husband" },
                  { name: "wife", value: "wife" },
                  { name: "son", value: "son" },
                  { name: "daughter", value: "daughter" },
                  { name: "other", value: "other" },
                ]}
              />
              <Field
                component={FormikInputDiv}
                label="Phone Number"
                disabled={!props.edit}
                value={
                  form.values.emergency_contact_phone_number ||
                  props.user?.emergency_contact?.phone_number
                }
                id="emergency_contact_phone_number"
                name="emergency_contact_phone_number"
              />
            </div>
          </section>
          {props.edit && (
            <section className="w-full pt-5">
              <div className="flex justify-end gap-4">
                <Button
                  value={"Cancel"}
                  onClick={props.onCancel}
                  className="w-32 my-2 px-2 bg-transparent h-8 border border-primaryViolet text-primaryViolet "
                />
                <Button
                  value={"Save"}
                  // onClick={()=>{console.log("clicked")}}
                  type="submit"
                  onClick={form.handleSubmit}
                  loading={form.isSubmitting}
                  disabled={props.disabled  || form.isSubmitting}
                  className="w-32 my-2 px-2  bg-primaryViolet h-8 border border-primaryViolet text-white "
                />
              </div>
            </section>
          )}
        </>
      )}
    </Formik>
  );
};

export default MembersForm;

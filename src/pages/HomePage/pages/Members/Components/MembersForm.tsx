import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { Field, Formik } from "formik";
import React from "react";
import Button from "../../../../../components/Button";
import ContactInput from "../../../../../components/ContactInput";
import {
  formatInputDate,
  genderOptions,
  getChangedValues,
} from "../../../../../utils/helperFunctions";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { maritalOptions, titleOptions, userFormValidator } from "../utils";
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
  const departmentsOptions = useSettingsStore().departmentsOptions;
  const positionOptions = useSettingsStore().positionsOptions;
  const countryOptions = useCountryStore().countryOptions;

  return (
    <Formik
      enableReinitialize={true}
      initialValues={props.user}
      onSubmit={(val) => {
        const transformedValues = {
          ...val,
          position_id: val.position_id && parseInt(val.position_id, 10),
          department_id: val.department_id && parseInt(val.department_id, 10),
        };
        const changedValues = getChangedValues(props.user, transformedValues);
        props.onSubmit(changedValues);
      }}
      validationSchema={userFormValidator}
    >
      {(form) => (
        <div className="h-full mb-4 py-4 gap-y-5">
          <section className="">
            <div className=" text-dark900 H600 font-extrabold my-5">
              Membership Status
            </div>
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
            <div className=" text-dark900 H600 font-extrabold my-5">
              Personal Information
            </div>
            <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
              <Field
                component={FormikSelectField}
                label="Title"
                disabled={!props.edit}
                id="title"
                name="title"
                options={titleOptions}
              />
            </div>
            <div className="w-full grid tablet:grid-cols-2 gap-4">
              <Field
                component={FormikInputDiv}
                label="First Name"
                disabled={!props.edit}
                id="first_name"
                name="first_name"
              />
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
                component={FormikSelectField}
                label="Marital Status"
                options={maritalOptions}
                disabled={!props.edit}
                id="marital_status"
                name="marital_status"
                placeholder={"select marital status"}
              />
            </div>
          </section>
          <section>
            <div className=" text-dark900 H600 font-extrabold my-5">
              Contact Information
            </div>
            <div className="w-full grid tablet:grid-cols-2 gap-4">
              <ContactInput
                label="Phone Number"
                contactValue={form.values.primary_number}
                zipCode={form.values.country_code}
                id="primary_number"
                disabled={!props.edit}
                onChange={(name, val) => {
                  form.setFieldValue(name, val);
                  form.setFieldTouched(name, true);
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
              <Field
                component={FormikInputDiv}
                label="Address"
                id="address"
                name="address"
                disabled={!props.edit}
              />
              <Field
                component={FormikSelectField}
                label="Country"
                id="nationality"
                name="nationality"
                options={countryOptions || []}
                disabled={!props.edit}
              />
            </div>
          </section>
          <section>
            <div className=" text-dark900 H600 font-extrabold my-5">
              Church Information
            </div>
            <div className="mb-5">
              <p className="text-dark900 leading-5 mb-2">
                Is this member a ministry worker?
              </p>
              <RadioInput
                value={form.values.is_user || false}
                onChange={(name, val) => {
                  form.setFieldValue(name, val);
                }}
              />
            </div>
            {form.values.is_user && (
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
                  parse={(value: string) => parseInt(value, 10)}
                />
              </div>
            )}
          </section>
          <section>
            <div className=" text-dark900 H600 font-extrabold my-5">
              Work Information
            </div>
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
            <div className=" text-dark900 H600 font-extrabold my-5">
              Emergency Contact
            </div>
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
                  { name: "Brother", value: "brother" },
                  { name: "Sister", value: "sister" },
                  { name: "Father", value: "father" },
                  { name: "Mother", value: "mother" },
                  { name: "Husband", value: "husband" },
                  { name: "Wife", value: "wife" },
                  { name: "Son", value: "son" },
                  { name: "Daughter", value: "daughter" },
                  { name: "Other", value: "other" },
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
                  type="submit"
                  onClick={() => {
                    form.handleSubmit();
                  }}
                  loading={props.loading}
                  disabled={props.disabled || props.loading}
                  className="w-32 my-2 px-2  bg-primaryViolet h-8 border border-primaryViolet text-white "
                />
              </div>
            </section>
          )}
        </div>
      )}
    </Formik>
  );
};

export default MembersForm;

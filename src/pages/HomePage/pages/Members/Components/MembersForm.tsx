// import FormikInputDiv from "@/components/FormikInput";
// import FormikSelectField from "@/components/FormikSelect";
// import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
// import { Field, Formik, useFormikContext } from "formik";
// import React from "react";
// import Button from "../../../../../components/Button";
// import ContactInput from "../../../../../components/ContactInput";
// import {
//   formatInputDate,
//   genderOptions,
//   getChangedValues,
// } from "../../../../../utils/helperFunctions";
// import useSettingsStore from "../../Settings/utils/settingsStore";
// import { maritalOptions, titleOptions, userFormValidator } from "../utils";
// import { OptionsType, UserType } from "../utils/membersInterfaces";
// import RadioInput from "./RadioInput";
// import { object } from "yup";

// interface MembersFormProps {
//   disabled?: boolean;
//   user?: UserType;
//   department?: OptionsType[];
//   onSubmit?: (val: UserType) => void;
//   disabled?: boolean;
//   loading?: boolean;
// }

// const MembersFormComponent: React.FC<MembersFormProps> = (props) => {
//   // function handleChange(name: string, value: string | boolean) {
//   //   props.onChange(name, value);
//   // }
//   const {departmentsOptions} = useSettingsStore();
//   const {positionsOptions} = useSettingsStore();
//   const{ countryOptions} = useCountryStore();

//   const {values}= useFormikContext<IMembersForm>()

//   return (
//     // <Formik
//     //   enableReinitialize={true}
//     //   initialValues={initialValues}
//     //   // onSubmit={(val) => {
//     //   //   const transformedValues = {
//     //   //     ...val,
//     //   //     position_id: val.position_id && parseInt(val.position_id, 10),
//     //   //     department_id: val.department_id && parseInt(val.department_id, 10),
//     //   //   };
//     //   //   const changedValues = getChangedValues(props.user, transformedValues);
//     //   //   props.onSubmit(changedValues);
//     //   // }}
//     //   onSubmit={props.onSubmit}
//     //   validationSchema={userFormValidator}
//     // >
//     <>
//         <div className="h-full   space-y-6">
//           <section className="">
//             <div className=" text-dark900 H600 font-extrabold my-5">
//               Membership Status
//             </div>
//             <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
//               <Field
//                 component={FormikSelectField}
//                 label="Membership Type"
//                 disabled={disabled}
//                 id="membership_type"
//                 name="membership_type"
//                 options={[
//                   { name: "Member", value: "MEMBER" },
//                   { name: "Visitor", value: "VISITOR" },
//                 ]}
//               />
//             </div>
//           </section>
//           <hr className="border-t border-neutralGray " />
//           <section>
//             <div className=" text-dark900 H600 font-extrabold my-5">
//               Personal Information
//             </div>
//             <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
//               <Field
//                 component={FormikSelectField}
//                 label="Title"
//                 disabled={disabled}
//                 id="title"
//                 name="title"
//                 options={titleOptions}
//               />
//             </div>
//             <div className="w-full grid tablet:grid-cols-2 gap-4">
//               <Field
//                 component={FormikInputDiv}
//                 label="First Name"
//                 disabled={disabled}
//                 id="first_name"
//                 name="first_name"
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Other Name"
//                 disabled={disabled}
//                 id="other_name"
//                 name="other_name"
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Last Name"
//                 disabled={disabled}
//                 id="last_name"
//                 name="last_name"
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Date of Birth"
//                 value={formatInputDate(values.date_of_birth)}
//                 disabled={disabled}
//                 id="date_of_birth"
//                 name="date_of_birth"
//                 type="date"
//               />
//               <Field
//                 component={FormikSelectField}
//                 label="Gender"
//                 value={props.user?.gender}
//                 options={genderOptions}
//                 disabled={disabled}
//                 id="gender"
//                 name="gender"
//                 placeholder={"select gender"}
//               />
//               <Field
//                 component={FormikSelectField}
//                 label="Marital Status"
//                 options={maritalOptions}
//                 disabled={disabled}
//                 id="marital_status"
//                 name="marital_status"
//                 placeholder={"select marital status"}
//               />
//             </div>
//           </section>
//           <hr className="border-t border-neutralGray " />
//           <section>
//             <div className=" text-dark900 H600 font-extrabold my-5">
//               Contact Information
//             </div>
//             <div className="w-full grid tablet:grid-cols-2 gap-4">
//               {/* <ContactInput
//                 label="Phone Number"
//                 contactValue={values.primary_number}
//                 zipCode={values.country_code}
//                 id="primary_number"
//                 disabled={disabled}
//                 onChange={(name, val) => {
//                   form.setFieldValue(name, val);
//                   form.setFieldTouched(name, true);
//                 }}
//                 placeholder="enter phone number"
//               /> */}
//               <Field
//                 component={FormikInputDiv}
//                 label="Email"
//                 id="email"
//                 name="email"
//                 type={"email"}
//                 disabled={disabled}
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Address"
//                 id="address"
//                 name="address"
//                 disabled={disabled}
//               />
//               <Field
//                 component={FormikSelectField}
//                 label="Country"
//                 id="nationality"
//                 name="nationality"
//                 options={countryOptions || []}
//                 disabled={disabled}
//               />
//             </div>
//           </section>
//           <hr className="border-t border-neutralGray " />
//           <section>
//             <div className=" text-dark900 H600 font-extrabold my-5">
//               Church Information
//             </div>
//             <div className="mb-5">
//               <p className="text-dark900 leading-5 mb-2">
//                 Is this member a ministry worker?
//               </p>
//               {/* <RadioInput
//                 value={values.is_user || false}
//                 onChange={(name, val) => {
//                   form.setFieldValue(name, val);
//                 }}
//               /> */}
//             </div>
//             {values.is_user && (
//               <div className="w-full  grid tablet:grid-cols-2 gap-4">
//                 {/* bug from backend */}
//                 <Field
//                   component={FormikSelectField}
//                   label="Ministry/Department"
//                   id="department_id"
//                   name="department_id"
//                   options={departmentsOptions || []}
//                   disabled={disabled}
//                 />
//                 <Field
//                   component={FormikSelectField}
//                   label="Position"
//                   id="position_id"
//                   name="position_id"
//                   options={positionsOptions || []}
//                   disabled={disabled}
//                   parse={(value: string) => parseInt(value, 10)}
//                 />
//               </div>
//             )}
//           </section>
//           <hr className="border-t border-neutralGray " />
//           <section>
//             <div className=" text-dark900 H600 font-extrabold my-5">
//               Work Information
//             </div>
//             <div className="w-full  grid tablet:grid-cols-2 gap-4">
//               <Field
//                 component={FormikInputDiv}
//                 label="Name of Institution"
//                 value={
//                   values.work_name ||
//                   props.user?.work_info?.name_of_institution
//                 }
//                 id="work_name"
//                 name="work_name"
//                 disabled={disabled}
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Industry"
//                 value={
//                   values.work_industry || props.user?.work_info?.industry
//                 }
//                 id="work_industry"
//                 name="work_industry"
//                 disabled={disabled}
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Position"
//                 value={
//                   values.work_position || props.user?.work_info?.position
//                 }
//                 id="work_position"
//                 name="work_position"
//                 disabled={disabled}
//               />
//             </div>
//           </section>
//           <hr className="border-t border-neutralGray " />
//           <section>
//             <div className=" text-dark900 H600 font-extrabold my-5">
//               Emergency Contact
//             </div>
//             <div className="w-full  grid tablet:grid-cols-2 gap-4">
//               <Field
//                 component={FormikInputDiv}
//                 label="Name of Contact"
//                 disabled={disabled}
//                 value={
//                   values.emergency_contact_name ||
//                   props.user?.emergency_contact?.name
//                 }
//                 id="emergency_contact_name"
//                 name="emergency_contact_name"
//               />
//               <Field
//                 component={FormikSelectField}
//                 label="Relation"
//                 disabled={disabled}
//                 value={
//                   values.emergency_contact_relation ||
//                   props.user?.emergency_contact?.relation
//                 }
//                 id="emergency_contact_relation"
//                 name="emergency_contact_relation"
//                 options={relationOptions}
//               />
//               <Field
//                 component={FormikInputDiv}
//                 label="Phone Number"
//                 disabled={disabled}
//                 value={
//                   values.emergency_contact_phone_number ||
//                   props.user?.emergency_contact?.phone_number
//                 }
//                 id="emergency_contact_phone_number"
//                 name="emergency_contact_phone_number"
//               />
//             </div>
//           </section>
//           <hr className="border-t border-neutralGray " />
//           {/* {props.disabled && (
//             <section className="w-full pt-5 sticky bottom-0 bg-white">
//               <div className="flex justify-end gap-4 sticky bottom-0 bg-white">
//                 <Button
//                   value={"Cancel"}
//                   onClick={props.onCancel}
//                   className="w-32 my-2 px-2 bg-transparent  border border-primaryViolet text-primaryViolet "
//                 />
//                 <Button
//                   value={"Save"}
//                   type="submit"
//                   onClick={() => {
//                     form.handleSubmit();
//                   }}
//                   loading={props.loading}
//                   disabled={props.disabled || props.loading}
//                   className="w-32 my-2 px-2  bg-primaryViolet  border border-primaryViolet text-white "
//                 />
//               </div>
//             </section>
//           )} */}
//         </div>
//     </>
//   );
// };

// const relationOptions = [
//   { name: "Brother", value: "brother" },
//   { name: "Sister", value: "sister" },
//   { name: "Father", value: "father" },
//   { name: "Mother", value: "mother" },
//   { name: "Husband", value: "husband" },
//   { name: "Wife", value: "wife" },
//   { name: "Son", value: "son" },
//   { name: "Daughter", value: "daughter" },
//   { name: "Other", value: "other" },
// ];

// export interface IMembersForm {
//   membership_type: "MEMBER" | "VISITOR";
//   title: string;
//   first_name: string;
//   other_name?: string;
//   last_name: string;
//   date_of_birth: string;
//   gender: string;
//   marital_status: string;
//   primary_number: string;
//   country_code: string;
//   email: string;
//   address: string;
//   nationality: string;
//   is_user: boolean;
//   department_id?: number;
//   position_id?: number;
//   work_name?: string;
//   work_industry?: string;
//   work_position?: string;
//   emergency_contact_name?: string;
//   emergency_contact_relation?: string;
//   emergency_contact_phone_number?: string;
//   link:string;
// }

// const initialValues: IMembersForm = {
//   membership_type: "MEMBER",
//   title: "",
//   first_name: "",
//   other_name: "",
//   last_name: "",
//   date_of_birth: "",
//   gender: "",
//   marital_status: "",
//   primary_number: "",
//   country_code: "",
//   email: "",
//   address: "",
//   nationality: "",
//   is_user: false,
//   department_id: undefined,
//   position_id: undefined,
//   work_name: "",
//   work_industry: "",
//   work_position: "",
//   emergency_contact_name: "",
//   emergency_contact_relation: "",
//   emergency_contact_phone_number: "",
//   link:""
// };

// // export default MembersForm;
// export const MembersForm= Object.assign(MembersFormComponent,{
//   initialValues:initialValues,
//   schema: {}
// })
import FormikInputDiv from "@/components/FormikInput";
import FormikSelectField from "@/components/FormikSelect";
import { useCountryStore } from "@/pages/HomePage/store/coutryStore";
import { Field, useFormikContext } from "formik";
import { ContactInput } from "../../../../../components/ContactInput";
import {
  formatInputDate,
  genderOptions,
} from "../../../../../utils/helperFunctions";
import useSettingsStore from "../../Settings/utils/settingsStore";
import { maritalOptions, titleOptions } from "../utils";
import { RadioInput } from "./RadioInput";

interface IProps {
  disabled?: boolean;
}

const MembersFormComponent = ({disabled=false}: IProps) => {
  // function handleChange(name: string, value: string | boolean) {
  //   props.onChange(name, value);
  // }
  const { departmentsOptions } = useSettingsStore();
  const { positionsOptions } = useSettingsStore();
  const countryOptions = useCountryStore().countryOptions;

  const { values } = useFormikContext<IMembersForm>();

  return (
    <>
      <div className="h-full   space-y-6">
        <section className="">
          <div className=" text-dark900 H600 font-extrabold my-5">
            Membership Status
          </div>
          <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
            <Field
              component={FormikSelectField}
              label="Membership Type"
              disabled={disabled}
              id="membership_type"
              name="membership_type"
              options={[
                { name: "Member", value: "MEMBER" },
                { name: "Visitor", value: "VISITOR" },
              ]}
            />
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Personal Information
          </div>
          <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
            <Field
              component={FormikSelectField}
              label="Title"
              disabled={disabled}
              id="title"
              name="title"
              options={titleOptions}
            />
          </div>
          <div className="w-full grid tablet:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="First Name"
              disabled={disabled}
              id="first_name"
              name="first_name"
            />
            <Field
              component={FormikInputDiv}
              label="Other Name"
              disabled={disabled}
              id="other_name"
              name="other_name"
            />
            <Field
              component={FormikInputDiv}
              label="Last Name"
              disabled={disabled}
              id="last_name"
              name="last_name"
            />
            <Field
              component={FormikInputDiv}
              label="Date of Birth"
              value={formatInputDate(values.date_of_birth)}
              disabled={disabled}
              id="date_of_birth"
              name="date_of_birth"
              type="date"
            />
            <Field
              component={FormikSelectField}
              label="Gender"
              options={genderOptions}
              disabled={disabled}
              id="gender"
              name="gender"
              placeholder={"select gender"}
            />
            <Field
              component={FormikSelectField}
              label="Marital Status"
              options={maritalOptions}
              disabled={disabled}
              id="marital_status"
              name="marital_status"
              placeholder={"select marital status"}
            />
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Contact Information
          </div>
          <div className="w-full grid tablet:grid-cols-2 gap-4">
            <ContactInput label="Phone Number" disabled={disabled} />
            <Field
              component={FormikInputDiv}
              label="Email"
              id="email"
              name="email"
              type={"email"}
              disabled={disabled}
            />
            <Field
              component={FormikInputDiv}
              label="Address"
              id="address"
              name="address"
              disabled={disabled}
            />
            <Field
              component={FormikSelectField}
              label="Country"
              id="nationality"
              name="nationality"
              options={countryOptions || []}
              disabled={disabled}
            />
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Church Information
          </div>
          <div className="mb-5">
            <p className="text-dark900 leading-5 mb-2">
              Is this member a ministry worker?
            </p>
            <RadioInput name="is_user" />
          </div>
          {values.is_user && (
            <div className="w-full  grid tablet:grid-cols-2 gap-4">
              {/* bug from backend */}
              <Field
                component={FormikSelectField}
                label="Ministry/Department"
                id="department_id"
                name="department_id"
                options={departmentsOptions || []}
                disabled={disabled}
              />
              <Field
                component={FormikSelectField}
                label="Position"
                id="position_id"
                name="position_id"
                options={positionsOptions || []}
                disabled={disabled}
                parse={(value: string) => parseInt(value, 10)}
              />
            </div>
          )}
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Work Information
          </div>
          <div className="w-full  grid tablet:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Name of Institution"
              id="work_name"
              name="work_name"
              disabled={disabled}
            />
            <Field
              component={FormikInputDiv}
              label="Industry"
              id="work_industry"
              name="work_industry"
              disabled={disabled}
            />
            <Field
              component={FormikInputDiv}
              label="Position"
              id="work_position"
              name="work_position"
              disabled={disabled}
            />
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
        <section>
          <div className=" text-dark900 H600 font-extrabold my-5">
            Emergency Contact
          </div>
          <div className="w-full  grid tablet:grid-cols-2 gap-4">
            <Field
              component={FormikInputDiv}
              label="Name of Contact"
              disabled={disabled}
              id="emergency_contact_name"
              name="emergency_contact_name"
            />
            <Field
              component={FormikSelectField}
              label="Relation"
              disabled={disabled}
              id="emergency_contact_relation"
              name="emergency_contact_relation"
              options={relationOptions}
            />
            <Field
              component={FormikInputDiv}
              label="Phone Number"
              disabled={disabled}
              id="emergency_contact_phone_number"
              name="emergency_contact_phone_number"
            />
          </div>
        </section>
        <hr className="border-t border-neutralGray " />
      </div>
    </>
  );
};

const relationOptions = [
  { name: "Brother", value: "brother" },
  { name: "Sister", value: "sister" },
  { name: "Father", value: "father" },
  { name: "Mother", value: "mother" },
  { name: "Husband", value: "husband" },
  { name: "Wife", value: "wife" },
  { name: "Son", value: "son" },
  { name: "Daughter", value: "daughter" },
  { name: "Other", value: "other" },
];

export interface IMembersForm {
  membership_type: "MEMBER" | "VISITOR";
  title: string;
  first_name: string;
  other_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  primary_number: string;
  country_code: string;
  email: string;
  address: string;
  nationality: string;
  is_user: boolean;
  department_id?: number;
  position_id?: number;
  work_name?: string;
  work_industry?: string;
  work_position?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone_number?: string;
  link: string;
}

const initialValues: IMembersForm = {
  membership_type: "MEMBER",
  title: "",
  first_name: "",
  other_name: "",
  last_name: "",
  date_of_birth: "",
  gender: "",
  marital_status: "",
  primary_number: "",
  country_code: "",
  email: "",
  address: "",
  nationality: "",
  is_user: false,
  department_id: undefined,
  position_id: undefined,
  work_name: "",
  work_industry: "",
  work_position: "",
  emergency_contact_name: "",
  emergency_contact_relation: "",
  emergency_contact_phone_number: "",
  link: "",
};

// export default MembersForm;
export const MembersForm = Object.assign(MembersFormComponent, {
  initialValues: initialValues,
  schema: {},
});

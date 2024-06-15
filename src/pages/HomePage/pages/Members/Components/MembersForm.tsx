import React from "react";
import InputDiv from "../../../Components/reusable/InputDiv";
import SelectField from "../../../Components/reusable/SelectField";
import { OptionsType, UserType } from "../utils/membersInterfaces";
import Button from "../../../../../components/Button";
import { genderOptions } from "../../../../../utils/helperFunctions";

interface MembersFormProps {
  edit: boolean;
  user?: UserType;
  department?: OptionsType[];
  onChange: (name: string, value: string) => void;
  onSubmit: () => void;
  onCancel: ()=>void;
  disabled: boolean
  loading: boolean
}

const MembersForm: React.FC<MembersFormProps> = (props) => {
  function handleChange(name: string, value: string) {
    props.onChange(name, value);
  }
  return (
    <section>
      <section>
        <div className="w-full text-black font-bold my-5">
          Personal Information
        </div>
        <div className="w-3/4 grid sm:grid-cols-2 gap-4">
          {/* <InputDiv label="Name" value="Saah Asiedu" id="name" disabled={!props.edit} /> */}
          <SelectField
            label="Title"
            value={props.user?.title}
            disabled={!props.edit}
            id="title"
            onChange={handleChange}
            options={[
              { name: "Mr", value: "Mr" },
              { name: "Mrs", value: "Mrs" },
              { name: "Miss", value: "Miss" },
            ]}
          />
          <InputDiv
            label="First Name"
            value={props.user?.first_name}
            disabled={!props.edit}
            id="first_name"
            onChange={handleChange}
          />
          <InputDiv
            label="Other Name"
            value={props.user?.other_name}
            disabled={!props.edit}
            id="other_name"
            onChange={handleChange}
          />
          <InputDiv
            label="Last Name"
            value={props.user?.last_name}
            disabled={!props.edit}
            id="last_name"
            onChange={handleChange}
          />
          <InputDiv
            label="Date of Birth"
            value={props.user?.date_of_birth}
            disabled={!props.edit}
            id="dateofbirth"
            type="date"
            onChange={handleChange}
          />
          <SelectField
            label="Gender"
            value={props.user?.gender}
            options={genderOptions}
            disabled={!props.edit}
            id="gender"
            placeholder={"select gender"}
            onChange={handleChange}
          />
          <InputDiv
            label="Marital Status"
            value={props.user?.marital_status}
            disabled={!props.edit}
            id="maritalstatus"
            onChange={handleChange}
          />
          {/* <InputDiv label="Nationality" value={props.user?.country} id="nationality" /> */}
        </div>
      </section>
      <section>
        <div className="w-full text-black font-bold my-5">
          Contact Information
        </div>
        <div className="w-3/4 grid sm:grid-cols-2 gap-4">
          <InputDiv
            label="Phone Number"
            value={props.user?.primary_number}
            id="phonenumber"
            disabled={!props.edit}
            onChange={handleChange}
          />
          <InputDiv
            label="Email"
            value={props.user?.email}
            id="email"
            disabled={!props.edit}
            onChange={handleChange}
          />
          {/* <InputDiv label="Secondary Number" value={props.user?.secondary_number} id="secondarynumber" disabled={!props.edit} /> */}
          <InputDiv
            label="Address"
            value={props.user?.address}
            id="address"
            disabled={!props.edit}
            onChange={handleChange}
          />
          <InputDiv
            label="Country"
            value={props.user?.country}
            id="country"
            disabled={!props.edit}
            onChange={handleChange}
          />
        </div>
      </section>
      <section>
        <div className="w-full text-black font-bold my-5">
          Church Information
        </div>
        <div className="w-3/4 grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Ministry/Department"
            value={props.user?.department?.id}
            id="department"
            onChange={handleChange}
            options={props.department || []}
            disabled={!props.edit}
          />
          <SelectField
            label="Position"
            value={props.user?.department?.id}
            id="position"
            onChange={handleChange}
            options={props.department || []}
            disabled={!props.edit}
          />
        </div>
      </section>
      <section>
        <div className="w-full text-black font-bold my-5">Work Information</div>
        <div className="w-3/4 grid sm:grid-cols-2 gap-4">
          <InputDiv
            label="Name of Institution"
            value={props.user?.occupation?.name}
            id="occupation"
            disabled={!props.edit}
            onChange={handleChange}
          />
          <InputDiv
            label="Industry"
            value={props.user?.occupation?.industry}
            id="industry"
            disabled={!props.edit}
            onChange={handleChange}
          />
          <InputDiv
            label="Position"
            value={props.user?.occupation?.position}
            id="position"
            disabled={!props.edit}
            onChange={handleChange}
          />
        </div>
      </section>
      <section>
        <div className="w-full text-black font-bold my-5">
          Emergency Contact
        </div>
        <div className="w-3/4 grid sm:grid-cols-2 gap-4">
          <InputDiv
            label="Name of Institution"
            disabled={!props.edit}
            value={props.user?.emergency_contact?.name}
            id="emergencycontact"
            onChange={handleChange}
          />
          <SelectField
            label="Relation"
            disabled={!props.edit}
            value={props.user?.occupation?.industry}
            id="relation"
            onChange={handleChange}
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
          <InputDiv
            label="Position"
            disabled={!props.edit}
            value={props.user?.occupation?.position}
            id="position"
            onChange={handleChange}
          />
        </div>
      </section>
      {props.edit && (
        <section className="w-3/4">
          <div className="flex justify-end gap-4">
            <Button
              value={"Cancel"}
              onClick={props.onCancel}
              className="w-32 my-2 px-2 bg-transparent h-8 border border-primaryViolet text-primaryViolet "
            />
            <Button
              value={"Save"}
              onClick={props.onSubmit}
              loading={props.loading}
              disabled={props.disabled}
              className="w-32 my-2 px-2  bg-primaryViolet h-8 border border-primaryViolet text-white "
            />
          </div>
        </section>
      )}
    </section>
  );
};

export default MembersForm;

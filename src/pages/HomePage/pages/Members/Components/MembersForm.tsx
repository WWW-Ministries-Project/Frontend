import React from "react";
import Button from "../../../../../components/Button";
import ContactInput from "../../../../../components/ContactInput";
import { formatInputDate, genderOptions } from "../../../../../utils/helperFunctions";
import InputDiv from "../../../Components/reusable/InputDiv";
import SelectField from "../../../Components/reusable/SelectField";
import { OptionsType, UserType } from "../utils/membersInterfaces";

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
    <form>
      <section>
        <div className=" text-black font-bold my-5">
          Personal Information
        </div>
        <div className="w-full grid tablet:grid-cols-2 gap-4 mb-5">
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
        </div>
        <div className="w-full grid tablet:grid-cols-2 gap-4">
          {/* <InputDiv label="Name" value="Saah Asiedu" id="name" disabled={!props.edit} /> */}
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
            value={formatInputDate(props.user?.date_of_birth)}
            disabled={!props.edit}
            id="date_of_birth"
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
        <div className=" text-black font-bold my-5">
          Contact Information
        </div>
        <div className="w-full grid tablet:grid-cols-2 gap-4">
          <ContactInput label="Phone Number" contactValue={props.user?.primary_number} zipCode={props.user?.country_code} id="primary_number" disabled={!props.edit} onChange={handleChange} placeholder="enter phone number"/>
          <InputDiv
            label="Email"
            value={props.user?.email}
            id="email"
            type={"email"}
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
        <div className=" text-black font-bold my-5">
          Church Information
        </div>
        <div className="w-full  grid tablet:grid-cols-2 gap-4">
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
        <div className=" text-black font-bold my-5">Work Information</div>
        <div className="w-full  grid tablet:grid-cols-2 gap-4">
          <InputDiv
            label="Name of Institution"
            value={props.user?.work_name|| props.user?.work_info?.name_of_institution}
            id="work_name"
            disabled={!props.edit}
            onChange={handleChange}
          />
          <InputDiv
            label="Industry"
            value={props.user?.work_industry|| props.user?.work_info?.industry}
            id="work_industry"
            disabled={!props.edit}
            onChange={handleChange}
          />
          <InputDiv
            label="Position"
            value={props.user?.work_position|| props.user?.work_info?.position}
            id="work_position"
            disabled={!props.edit}
            onChange={handleChange}
          />
        </div>
      </section>
      <section>
        <div className=" text-black font-bold my-5">
          Emergency Contact
        </div>
        <div className="w-full  grid tablet:grid-cols-2 gap-4">
          <InputDiv
            label="Name of Contact"
            disabled={!props.edit}
            value={props.user?.emergency_contact_name || props.user?.emergency_contact?.name}
            id="emergency_contact_name"
            onChange={handleChange}
          />
          <SelectField
            label="Relation"
            disabled={!props.edit}
            value={props.user?.emergency_contact_relation|| props.user?.emergency_contact?.relation} 
            id="emergency_contact_relation"
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
            label="Phone Number"
            disabled={!props.edit}
            value={props.user?.emergency_contact_phone_number || props.user?.emergency_contact?.phone_number}
            id="emergency_contact_phone_number"
            onChange={handleChange}
          />
        </div>
      </section>
      {props.edit && (
        <section className="w-full ">
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
    </form>
  );
};

export default MembersForm;

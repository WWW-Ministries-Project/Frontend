import React from 'react';
import InputDiv from '../../../Components/reusable/InputDiv';
import SelectField from '../../../Components/reusable/SelectField';
import Button from "/src/components/Button";
import { OptionsType, UserType } from "../../Members/utils/membersInterfaces";

interface MembersFormProps {
    edit: boolean;
    user?: UserType;
    department?: OptionsType[];
  }


const MembersForm: React.FC<MembersFormProps> = (props) => {
    return (
        <section>
            <section>
                <div className="w-full text-black font-bold my-5">Personal Information</div>
                <div className="w-3/4 grid grid-cols-2 gap-4">
                    {/* <InputDiv label="Name" value="Saah Asiedu" id="name" disabled={!props.edit} /> */}
                    <SelectField label="Title" value={props.user?.title} disabled={!props.edit} id="title" options={[{ name: "Mr", value: "Mr" }, { name: "Mrs", value: "Mrs" }, { name: "Miss", value: "Miss" }]} />
                    <InputDiv label="First Name" value={props.user?.first_name} disabled={!props.edit} id="firstname" />
                    <InputDiv label="Other Name" value={props.user?.other_name} disabled={!props.edit} id="othername" />
                    <InputDiv label="Last Name" value={props.user?.last_name} disabled={!props.edit} id="lastname" />
                    <InputDiv label="Date of Birth" value={props.user?.date_of_birth} disabled={!props.edit} id="dateofbirth" type="date" />
                    <InputDiv label="Gender" value={props.user?.email} disabled={!props.edit} id="gender" />
                    <InputDiv label="Marital Status" value={props.user?.marital_status} disabled={!props.edit} id="maritalstatus" />
                    {/* <InputDiv label="Nationality" value={props.user?.country} id="nationality" /> */}

                </div>
            </section>
            <section>
                <div className="w-full text-black font-bold my-5">Contact Information</div>
                <div className="w-3/4 grid grid-cols-2 gap-4">
                    <InputDiv label="Phone Number" value={props.user?.primary_number} id="phonenumber" disabled={!props.edit} />
                    <InputDiv label="Email" value={props.user?.email} id="email" disabled={!props.edit} />
                    {/* <InputDiv label="Secondary Number" value={props.user?.secondary_number} id="secondarynumber" disabled={!props.edit} /> */}
                    <InputDiv label="Address" value={props.user?.address} id="address" disabled={!props.edit} />
                    <InputDiv label="Country" value={props.user?.country} id="country" disabled={!props.edit} />
                </div>
            </section>
            <section>
                <div className="w-full text-black font-bold my-5">Church Information</div>
                <div className="w-3/4 grid grid-cols-2 gap-4">
                    <SelectField label="Ministry/Department" value={props.user?.department?.id} id="department" options={props.department || []} disabled={!props.edit} />
                    <SelectField label="Position" value={props.user?.department?.id} id="position" options={props.department || []} disabled={!props.edit} />
                </div>
            </section>
            <section>
                <div className="w-full text-black font-bold my-5">Work Information</div>
                <div className="w-3/4 grid grid-cols-2 gap-4">
                    <InputDiv label="Name of Institution" value={props.user?.occupation?.name} id="occupation" disabled={!props.edit} />
                    <InputDiv label="Industry" value={props.user?.occupation?.industry} id="industry" disabled={!props.edit} />
                    <InputDiv label="Position" value={props.user?.occupation?.position} id="position" disabled={!props.edit} />
                </div>
            </section>
            <section>
                <div className="w-full text-black font-bold my-5">Emergency Contact</div>
                <div className="w-3/4 grid grid-cols-2 gap-4">
                    <InputDiv label="Name of Institution" disabled={!props.edit} value={props.user?.emergency_contact?.name} id="emergencycontact" />
                    <SelectField label="Relation" disabled={!props.edit} value={props.user?.occupation?.industry} id="relation" options={[{ name: 'brother', value: 'brother' }, { name: 'sister', value: 'sister' }, { name: 'father', value: 'father' }, { name: 'mother', value: 'mother' }, { name: 'husband', value: 'husband' }, { name: 'wife', value: 'wife' }, { name: 'son', value: 'son' }, { name: 'daughter', value: 'daughter' }, { name: 'other', value: 'other' }]} />
                    <InputDiv label="Position" disabled={!props.edit} value={props.user?.occupation?.position} id="position" />
                </div>
            </section>
            {props.edit &&<section className="w-3/4">

                <div className="flex justify-end gap-4">
                    <Button value={"Cancel"} onClick={() => {}} className="w-32 my-2 px-2 bg-transparent h-8 border border-primaryViolet text-primaryViolet " />
                    <Button value={"Save"} className="w-32 my-2 px-2  bg-primaryViolet h-8 border border-primaryViolet text-white " />
                </div>
            </section>}
        </section>
    );
}

export default MembersForm;

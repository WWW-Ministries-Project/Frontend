import Button from "@/components/Button";
import { Formik } from "formik";
import PropTypes from "prop-types";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { IMembersForm, MembersForm } from "../Components/MembersForm";
import MemberInformationViewMode from "../Components/MembersInformationViewMode";
const MemberInformation = () => {
  const { edit, handleCancel, details, handleSubmit, loading } =
    useOutletContext<{
      edit: boolean;
      handleCancel: () => void;
      details: any;
      handleSubmit: (val: any) => void;
      loading: boolean;
    }>();
  const initialValues = useMemo((): IMembersForm => {
    return {
      membership_type: details?.membership_type ?? "MEMBER",
      title: details?.title ?? "",
      first_name: details?.first_name ?? "",
      other_name: details?.other_name ?? "",
      last_name: details?.last_name ?? "",
      date_of_birth: details?.date_of_birth ?? "",
      gender: details?.gender ?? "",
      marital_status: details?.marital_status ?? "",
      primary_number: details?.primary_number ?? "",
      country_code: details?.country_code ?? "",
      email: details?.email ?? "",
      address: details?.address ?? "",
      nationality: details?.nationality ?? "",
      is_user: details?.is_active ?? false,

      // Handling nested properties
      department_id: details?.department?.id ?? undefined,
      position_id: details?.position?.id ?? undefined,

      // Work info mapping
      work_name: details?.work_info?.name_of_institution ?? "",
      work_industry: details?.work_info?.industry ?? "",
      work_position: details?.work_info?.position ?? "",

      // Emergency contact mapping
      emergency_contact_name: details?.emergency_contact?.name ?? "",
      emergency_contact_relation: details?.emergency_contact?.relation ?? "",
      emergency_contact_phone_number:
        details?.emergency_contact?.phone_number ?? "",

      link: "",
    };
  }, [details]);
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="col-span-3 bg-white p-4 rounded-b-xl">
        {edit ? (
          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit }) => (
              <>
                <MembersForm disabled={!edit} />
                <section className="w-full pt-5 sticky bottom-0 bg-transparent">
                  <div className="flex justify-end gap-4 sticky bottom-0 bg-inherit">
                    <Button
                      value={"Cancel"}
                      onClick={handleCancel}
                      className="w-32 my-2 px-2 bg-transparent  border border-primaryViolet text-primaryViolet "
                    />
                    <Button
                      value={"Save"}
                      type="button"
                      loading={loading}
                      onClick={handleSubmit}
                      className="w-32 my-2 px-2 bg-primaryViolet border border-primaryViolet text-white"
                    />
                  </div>
                </section>
              </>
            )}
          </Formik>
        ) : (
          <div>
            <MemberInformationViewMode user={details} />
          </div>
        )}
      </div>

      <div className="space-y-4 ">
        <div className="bg-white p-4 h-[20rem] container rounded-b-xl space-y-4">
          <div className="flex justify-between ">
            <div className="font-semibold">Membership school</div>
            <div>icon</div>
          </div>
          {/* List of programs */}
          <div></div>
        </div>
        <div className="bg-white p-4 h-[20rem] rounded-xl">Children</div>
      </div>
    </div>
  );
};
MemberInformation.propTypes = {
  user: PropTypes.object,
  department: PropTypes.array,
  positions: PropTypes.array,
};

export default MemberInformation;

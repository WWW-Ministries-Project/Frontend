import { pictureInstance as axiosPic } from "@/axiosInstance";
import Button from "@/components/Button";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/api/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { Formik } from "formik";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { object } from "yup";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import { IMembersForm, MembersForm } from "../Components/MembersForm";
import { mapUserData } from "../utils";
import { UserType } from "../utils/membersInterfaces";

export function ManageMember() {
  const navigate = useNavigate();
  const store = useStore();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("member_id");
  const editMode = location.state?.mode === "edit";
  const { data: member, refetch } = useFetch(
    api.fetch.fetchAMember,
    { user_id: id + "" },
    true
  );
  const { postData, loading, data } = usePost<ApiResponse<{ data: UserType }>>(
    api.post.createMember
  );
  const { updateData, loading: updateLoading } = usePut<
    ApiResponse<{ data: UserType }>
  >(api.post.updateMember);

  useEffect(() => {
    if (id) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const initialValue = useMemo(() => {
    if (member?.data.data) {
      return mapUserData(member.data.data);
    } else {
      return initialValues;
    }
  }, [member?.data.data]);

  useEffect(() => {
    if (data) {
      const temp = {
        ...data.data.data,
        ...data.data.data.user_info,
      };
      store.addMember(temp);
      navigate("/home/members", { state: { new: true } });
    }
  }, [data, navigate, store]);

  const handleCancel = () => {
    navigate(-1);
  };

  async function handleSubmit(values: IMembersForm) {
    let dataToSend = { ...values };

    try {
      const uploadedFile = values.personal_info.picture?.picture;

      if (uploadedFile instanceof File) {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await axiosPic.post(`${baseUrl}upload`, formData);

        if (response?.status === 200) {
          dataToSend = {
            ...values,
            personal_info: {
              ...values.personal_info,
              picture: { src: response.data.result.link, picture: null },
            },
          };
        } else {
          throw new Error("Image upload failed");
        }
      }

      // Send data regardless of whether an image was uploaded
      if (editMode) await updateData(dataToSend);
      else await postData(dataToSend);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  }

  return (
    <div className="p-4">
      <section className="mx-auto p-8 container lg:w-4/6 bg-white rounded-xl">
        <div className="flex flex-col gap-4 items-center tablet:items-start">
          <div className="font-bold text-xl">Member Information</div>
          <div className="text text-[#8F95B2] mt-">
            Fill the form below with the member information
          </div>
        </div>
        <Formik
          enableReinitialize={true}
          initialValues={initialValue}
          onSubmit={(values) => handleSubmit(values)}
          validationSchema={validationSchema}
        >
          {({ handleSubmit}) => (
            <>
              <MembersForm />

              <section className="w-full pt-5 sticky bottom-0 bg-white">
                <div className="flex justify-end gap-4 sticky bottom-0 bg-white">
                  <Button
                    value={"Cancel"}
                    onClick={handleCancel}
                    className="primary "
                  />
                  <Button
                    value={editMode ? "Update" : "Save"}
                    type="button"
                    // onClick={() => {
                    //   console.log(errors, "errors");
                    // }}
                    onClick={handleSubmit}
                    loading={loading || updateLoading}
                    className="default"
                  />
                </div>
              </section>
            </>
          )}
        </Formik>
      </section>
    </div>
  );
}

// export interface IAddMember extends IMembersForm {}
const initialValues: IMembersForm = {
  ...MembersForm.initialValues,
};

const validationSchema = object().shape(MembersForm.validationSchema);

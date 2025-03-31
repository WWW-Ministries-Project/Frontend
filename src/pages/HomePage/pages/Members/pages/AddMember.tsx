import { pictureInstance as axiosPic } from "@/axiosInstance";
import Button from "@/components/Button";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { useStore } from "@/store/useStore";
import { api } from "@/utils/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { Formik } from "formik";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import { IMembersForm, MembersForm } from "../Components/MembersForm";
import { UserType } from "../utils/membersInterfaces";
import { mapUserData } from "../utils";

const AddMember = () => {
  const navigate = useNavigate();
  const store = useStore();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("member_id");
  const {
    data: member,
    loading: fetchLoading,
    error: fetchError,
  } = useFetch(api.fetch.fetchAMember, { user_id: id + "" });
  const { postData, loading, error, data } = usePost<
    ApiResponse<{ data: UserType }>
  >(api.post.createMember);
  const { updateData, loading: updateLoading } = usePut<
    ApiResponse<{ data: UserType }>
  >(api.post.updateMember);

  const initialValue = useMemo(() => {
    if (member?.data.data) {
      // return {
      //   ...member.data.data,
      //   ...member.data.data.user_info,
      // };
      return mapUserData(member.data.data);
    } else {
      return initialValues;
    }
  }, [member?.data.data]);
  console.log(member?.data.data, "member");

  useEffect(() => {
    if (data) {
      const temp = {
        ...data.data.data,
        ...data.data.data.user_info,
      };
      store.addMember(temp);
      navigate("/home/members", { state: { new: true } });
    }
    if (error) {
      console.log(error);
    }
  }, [data]);

  const handleCancel = () => {
    navigate(-1);
  };

  async function handleSubmit(values: IAddMember) {
    console.log(values, "values");

    let dataToSend = { ...values };

    try {
      let uploadedFile = values.personal_info.picture?.picture;

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
      await postData(dataToSend);
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
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, handleSubmit }) => (
            <>
              {/* <ProfilePicture
                className="h-[10rem] w-[10rem] outline-lightGray mt-3 profilePic transition-all outline outline-1 duration-1000"
                id="profile_picture"
                name="profile_picture"
                src={values.picture.src}
                alt="Profile Picture"
                editable={true}
                onChange={(obj) => {
                  setFieldValue("picture", obj);
                }}
                textClass={'text-3xl text-dark900'}
              /> */}
              <MembersForm />

              <section className="w-full pt-5 sticky bottom-0 bg-white">
                <div className="flex justify-end gap-4 sticky bottom-0 bg-white">
                  <Button
                    value={"Cancel"}
                    onClick={handleCancel}
                    className="primary "
                  />
                  <Button
                    value={"Save"}
                    type="button"
                    onClick={handleSubmit}
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
};

export interface IAddMember extends IMembersForm {}
const initialValues: IAddMember = {
  ...MembersForm.initialValues,
};

export default AddMember;

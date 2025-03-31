import { pictureInstance as axiosPic } from "@/axiosInstance";
import Button from "@/components/Button";
import { usePost } from "@/CustomHooks/usePost";
import { useStore } from "@/store/useStore";
import {api} from "@/utils/apiCalls";
import { ApiResponse } from "@/utils/interfaces";
import { Formik } from "formik";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfilePicture from "../../../../../components/ProfilePicture";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import { IMembersForm, MembersForm } from "../Components/MembersForm";
import { UserType } from "../utils/membersInterfaces";

const AddMember = () => {
  const navigate = useNavigate();
  const store = useStore();
  const { postData, loading, error, data } = usePost<
    ApiResponse<{ data: UserType }>
  >(api.post.createMember);

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
    navigate("/home/members");
  };

  async function handleSubmit(values: IAddMember) {
    console.log(values,"values");
    const {  ...formData } = values;
    await postData(formData);
    // try {
    //   let uploadedLink = values.picture.src;

    //   if (values.picture.picture) {
    //     const data = new FormData();
    //     data.append("file", values.picture.picture);

    //     const response = await axiosPic.post(`${baseUrl}upload`, data);

    //     if (response?.status === 200) {
    //       uploadedLink = response.data.result.link;
    //     } else {
    //       console.error("Image upload failed");
    //       return;
    //     }
    //   }

    //   const { picture, ...formData } = values;
    //   // setFieldValue("picture", { src: uploadedLink, picture: "" });
    //   await postData(formData);
    // } catch (error) {
    //   console.error("Error during submission:", error);
    // }
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
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, handleSubmit }) => (
            <>
              <ProfilePicture
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
              />
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

interface IAddMember extends IMembersForm {
  picture: {
    src: string;
    picture: File | null;
  };
}
const initialValues = {
  ...MembersForm.initialValues,
  picture: {
    src: "",
    picture: null,
  },
};

export default AddMember;

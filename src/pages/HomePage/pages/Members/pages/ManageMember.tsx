import { pictureInstance as axiosPic } from "@/axiosInstance";
import { Actions } from "@/components/ui";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { decodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { validateFamilyPayload } from "@/utils/familyRelations";
import { normalizeOptionalOtherNames } from "@/utils/memberPayload";
import { validateUploadFile } from "@/utils/uploadValidation";
import { Formik, FormikProps, FormikTouched } from "formik";
import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { object } from "yup";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import { IMembersForm, MembersForm } from "../Components/MembersForm";
import { mapUserData } from "../utils";
import { showNotification } from "@/pages/HomePage/utils";

const mapErrorsToTouched = (errors: unknown): unknown => {
  if (Array.isArray(errors)) {
    return errors.map((item) => mapErrorsToTouched(item));
  }

  if (errors && typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>).reduce<
      Record<string, unknown>
    >((acc, [key, value]) => {
      acc[key] = mapErrorsToTouched(value);
      return acc;
    }, {});
  }

  return true;
};

const hasValidationErrors = (errors: unknown): boolean => {
  if (Array.isArray(errors)) {
    return errors.some((item) => hasValidationErrors(item));
  }

  if (errors && typeof errors === "object") {
    return Object.values(errors as Record<string, unknown>).some((value) =>
      hasValidationErrors(value)
    );
  }

  return Boolean(errors);
};

export function ManageMember() {
  const navigate = useNavigate();
  const outletContext = useOutletContext<{
    refetchMembers?: () => void;
  }>();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = decodeQuery(params.get("member_id") || "");
  const isEditMode = Boolean(id);

  const { data: member, refetch } = useFetch(
    api.fetch.fetchAMember,
    { user_id: id + "" },
    true
  );
  const { postData, loading, data } = usePost(api.post.createMember);
  const {
    updateData,
    loading: updateLoading,
    data: updatedData,
  } = usePut(api.put.updateMember);

  const stepControls = useRef<{
    goNext: () => void;
    goBack: () => void;
    isLastStep: boolean;
    focusFirstErrorStep: (errors: unknown) => void;
  } | null>(null);

  useEffect(() => {
    if (id) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const initialValue = useMemo(() => {
    if (member?.data) {
      return mapUserData(member.data);
    } else {
      return initialValues;
    }
  }, [member?.data]);

  useEffect(() => {
    if (data || updatedData) {
      if (typeof outletContext?.refetchMembers === "function") {
        outletContext.refetchMembers();
      }

      navigate("/home/members", {
        state: { task: data ? "add" : "update" },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, updatedData]);

  const handleCancel = () => {
    navigate(-1);
  };

  async function handleSubmit(values: IMembersForm) {
    const familyValidationError = validateFamilyPayload(values.family, {
      currentUserId: isEditMode ? member?.data?.id ?? id : undefined,
    });

    if (familyValidationError) {
      showNotification(familyValidationError, "error");
      return;
    }

    let dataToSend = normalizeOptionalOtherNames(values);

    try {
      const uploadedFile = values.picture?.picture;

      if (uploadedFile instanceof File) {
        const validation = validateUploadFile(uploadedFile, {
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        });

        if (!validation.valid) {
          throw new Error(validation.message || "Invalid profile image selected.");
        }

        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await axiosPic.post(`${baseUrl}upload`, formData);

        if (response?.status === 200) {
          dataToSend = {
            ...dataToSend,
            picture: { src: response.data.result.link, picture: null },
          };
        } else {
          throw new Error("Image upload failed");
        }
      }

      // Send data regardless of whether an image was uploaded
      if (id) {
        const memberId = member?.data?.id;
        if (!memberId) {
          throw new Error("Member id is missing");
        }
        await updateData(dataToSend, { user_id: String(memberId) });
      } else {
        await postData(dataToSend);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save member details.";
      showNotification(message, "error");
    }
  }

  const handleSubmitWithValidation = async (formik: FormikProps<IMembersForm>) => {
    const errors = await formik.validateForm();

    if (hasValidationErrors(errors)) {
      formik.setTouched(
        mapErrorsToTouched(errors) as FormikTouched<IMembersForm>,
        false
      );
      stepControls.current?.focusFirstErrorStep(errors);
      showNotification(
        "Please complete all required fields before submitting.",
        "error"
      );
      return;
    }

    await formik.submitForm();
  };

  return (
    <div className="p-4">
      <section className="mx-auto p-6 container lg:w-5/6 bg-white rounded-xl">
        <div className="flex flex-col gap-1 items-center tablet:items-start">
          <div className="font-bold text-xl">Member Information</div>
          <div className="text text-[#8F95B2] mb-4">
            Fill the form below with the member information
          </div>
        </div>
        <Formik
          enableReinitialize={true}
          initialValues={initialValue}
          onSubmit={(values) => handleSubmit(values)}
          validationSchema={validationSchema}
        >
          {(formik: FormikProps<IMembersForm>) => (
            <>
              <MembersForm
                onRegisterControls={(controls) => {
                  stepControls.current = controls;
                }}
              />

              <section className="w-full py-5 sticky bottom-0 bg-white">
                <Actions
                  goBack={() => stepControls.current?.goBack()}
                  goNext={
                    !isEditMode && stepControls.current?.isLastStep
                      ? undefined
                      : () => stepControls.current?.goNext()
                  }
                  onCancel={handleCancel}
                  onSubmit={
                    isEditMode
                      ? () => handleSubmitWithValidation(formik)
                      : stepControls.current?.isLastStep
                      ? () => handleSubmitWithValidation(formik)
                      : undefined
                  }
                  loading={loading || updateLoading}
                />
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

import { pictureInstance as axiosPic } from "@/axiosInstance";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { validateFamilyPayload } from "@/utils/familyRelations";
import { normalizeOptionalOtherNames } from "@/utils/memberPayload";
import { validateUploadFile } from "@/utils/uploadValidation";
import { Formik } from "formik";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { object } from "yup";
import { baseUrl } from "../../../../Authentication/utils/helpers";
import { IMembersForm, MembersForm } from "../Components/MembersForm";
import { mapUserData } from "../utils";
import { showNotification } from "@/pages/HomePage/utils";
import { ALL_BRANCHES, useBranchStore } from "@/store/useBranchStore";
import PageOutline from "@/pages/HomePage/Components/PageOutline";

type ManageMemberLocationState = {
  afterSubmitPath?: string;
  prefillMemberForm?: IMembersForm;
  prefillSourceLabel?: string;
  sourceSoulWonId?: string | number;
  sourceVisitorId?: string | number;
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
  const locationState = location.state as ManageMemberLocationState | null;
  const prefillMemberForm = !isEditMode ? locationState?.prefillMemberForm : undefined;
  const prefillSourceLabel = !isEditMode ? locationState?.prefillSourceLabel : undefined;
  const afterSubmitPath = locationState?.afterSubmitPath;
  const sourceSoulWonId = !isEditMode ? locationState?.sourceSoulWonId : undefined;
  const sourceVisitorId = !isEditMode ? locationState?.sourceVisitorId : undefined;

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

  useEffect(() => {
    if (id) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const initialValue = useMemo(() => {
    if (member?.data) {
      return mapUserData(member.data);
    } else if (prefillMemberForm) {
      return prefillMemberForm;
    } else {
      return initialValues;
    }
  }, [member?.data, prefillMemberForm]);

  useEffect(() => {
    if (data || updatedData) {
      if (typeof outletContext?.refetchMembers === "function") {
        outletContext.refetchMembers();
      }

      if (updatedData) {
        const editedMemberId = member?.data?.id ?? id;

        if (editedMemberId !== undefined && editedMemberId !== null) {
          navigate(`/home/members/${encodeQuery(editedMemberId)}`, {
            state: { task: "update" },
          });
          return;
        }
      }

      // user/register answers { data: { parent: { id, name, … }, family } }.
      const created = (
        data as { data?: { parent?: { id?: number; name?: string } } } | null
      )?.data?.parent;
      navigate(afterSubmitPath ?? "/home/members", {
        state: {
          task: data ? "add" : "update",
          member: created ? { id: created.id, name: created.name } : undefined,
        },
      });
    }
  }, [afterSubmitPath, data, id, member?.data?.id, navigate, outletContext, updatedData]);

  const handleCancel = () => {
    navigate(-1);
  };

  async function handleSubmit(values: IMembersForm) {
    const { activeBranchId } = useBranchStore.getState();
    if (activeBranchId === ALL_BRANCHES && values.branch_id === "") {
      showNotification("Please select a branch before submitting.", "error");
      return;
    }

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
        await updateData(
          { ...dataToSend, ...(dataToSend.branch_id !== "" ? { branch_id: dataToSend.branch_id } : {}) },
          { user_id: String(memberId) }
        );
      } else {
        await postData({
          ...dataToSend,
          ...(dataToSend.branch_id !== "" ? { branch_id: dataToSend.branch_id } : {}),
          ...(sourceSoulWonId ? { source_soul_won_id: sourceSoulWonId } : {}),
          ...(sourceVisitorId
            ? { source_visitor_id: String(sourceVisitorId) }
            : {}),
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save member details.";
      showNotification(message, "error");
    }
  }

  const memberRecord = member?.data;
  const memberName = memberRecord
    ? [memberRecord.first_name, memberRecord.last_name].filter(Boolean).join(" ")
    : "";
  const title = isEditMode ? (memberName ? `Edit ${memberName}` : "Edit member") : "Add member";
  const backLabel = isEditMode
    ? "Back to profile"
    : afterSubmitPath
    ? "Back to membership management"
    : "Back to members";
  const crumbs = [
    { label: "Home", link: "/home" },
    { label: "Members", link: "/home/members" },
    { label: isEditMode ? "Edit member" : "Add member" },
  ];

  return (
    <PageOutline crumbs={crumbs}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="self-start text-sm text-gray-600 transition-colors hover:text-primary"
          >
            ← {backLabel}
          </button>
          <h1 className="text-2xl font-semibold leading-8 text-primary">{title}</h1>
          <p className="text-base leading-6 text-gray-600">
            {isEditMode
              ? "Update the details below and save when you’re done."
              : "Register a new member. They start as unconfirmed until they complete the membership class."}
          </p>
        </div>
        {prefillSourceLabel ? (
          <p
            role="status"
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
          >
            Prefilled from {prefillSourceLabel}. Check the details and complete the remaining steps.
          </p>
        ) : null}
        <Formik
          enableReinitialize={true}
          initialValues={initialValue}
          onSubmit={(values) => handleSubmit(values)}
          validationSchema={validationSchema}
        >
          <MembersForm isEditMode={isEditMode} submitting={loading || updateLoading} />
        </Formik>
      </div>
    </PageOutline>
  );
}

// export interface IAddMember extends IMembersForm {}
const initialValues: IMembersForm = {
  ...MembersForm.initialValues,
};

const validationSchema = object().shape(MembersForm.validationSchema);

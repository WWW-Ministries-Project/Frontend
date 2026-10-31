import { useBackNavigation } from "@/CustomHooks/useBackNavigation";
import { useFetch } from "@/CustomHooks/useFetch";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { validateFamilyPayload } from "@/utils/familyRelations";
import {
  normalizeOptionalOtherNames,
  sanitizeMemberDepartmentPositions,
} from "@/utils/memberPayload";
import { saveThenAttachImage } from "@/utils/uploadImage";
import { Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { object } from "yup";
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
  const [submitting, setSubmitting] = useState(false);

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

  const back = useBackNavigation(
    isEditMode && id ? `/home/members/${encodeQuery(id)}` : afterSubmitPath || "/home/membership"
  );
  const handleCancel = back.goBack;

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

    // Hold the new file aside so the record is saved WITHOUT it first — a failed
    // save then can't leave an orphaned image in the bucket.
    const pendingImage = values.picture?.picture;
    // When a new file is pending, `values.picture.src` is a local blob URL, so
    // the save keeps the record's existing photo (edit) or none (create); the
    // real link is attached only after the upload succeeds. With no new file we
    // keep whatever src is already on the form (the saved photo in edit mode).
    const existingPhotoSrc =
      pendingImage instanceof File
        ? isEditMode
          ? member?.data?.photo ?? ""
          : ""
        : values.picture?.src ?? "";

    const basePayload = sanitizeMemberDepartmentPositions(
      normalizeOptionalOtherNames({
        ...values,
        picture: { src: existingPhotoSrc, picture: null },
      })
    );

    const branchPart =
      basePayload.branch_id !== "" ? { branch_id: basePayload.branch_id } : {};

    // Attach the uploaded link to a record that already exists.
    const attachPhoto = (link: string, userId: number | string) =>
      api.put
        .updateMember({ picture: { src: link, picture: null } }, {
          user_id: String(userId),
        })
        .then(() => undefined);

    const warnImageFailed = () =>
      showNotification(
        "Member saved, but the profile image couldn't be uploaded. You can add it by editing the member.",
        "warning",
        "Profile image"
      );

    try {
      setSubmitting(true);

      if (id) {
        const memberId = member?.data?.id;
        if (!memberId) {
          throw new Error("Member id is missing");
        }

        await saveThenAttachImage({
          file: pendingImage,
          save: () =>
            api.put.updateMember({ ...basePayload, ...branchPart }, {
              user_id: String(memberId),
            }),
          attach: (link) => attachPhoto(link, memberId),
          onImageError: warnImageFailed,
        });

        if (typeof outletContext?.refetchMembers === "function") {
          outletContext.refetchMembers();
        }
        navigate(`/home/members/${encodeQuery(memberId)}`, {
          state: { task: "update" },
        });
        return;
      }

      const created = await saveThenAttachImage({
        file: pendingImage,
        // Members added from the admin portal are confirmed by default.
        save: () =>
          api.post.createMember<{ parent?: { id?: number; name?: string } }>({
            ...basePayload,
            ...branchPart,
            status: "CONFIRMED",
            ...(sourceSoulWonId ? { source_soul_won_id: sourceSoulWonId } : {}),
            ...(sourceVisitorId
              ? { source_visitor_id: String(sourceVisitorId) }
              : {}),
          }),
        attach: (link, res) => {
          const newId = res?.data?.parent?.id;
          return newId ? attachPhoto(link, newId) : Promise.resolve();
        },
        onImageError: warnImageFailed,
      });

      if (typeof outletContext?.refetchMembers === "function") {
        outletContext.refetchMembers();
      }

      const parent = created?.data?.parent;
      navigate(afterSubmitPath ?? "/home/members", {
        state: {
          task: "add",
          member: parent ? { id: parent.id, name: parent.name } : undefined,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save member details.";
      showNotification(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const memberRecord = member?.data;
  const memberName = memberRecord
    ? [memberRecord.first_name, memberRecord.last_name].filter(Boolean).join(" ")
    : "";
  const title = isEditMode ? (memberName ? `Edit ${memberName}` : "Edit member") : "Add member";
  const backLabel = `Back to ${back.label}`;
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
              : "Register a new member. Members added here are confirmed by default."}
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
          <MembersForm isEditMode={isEditMode} submitting={submitting} />
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

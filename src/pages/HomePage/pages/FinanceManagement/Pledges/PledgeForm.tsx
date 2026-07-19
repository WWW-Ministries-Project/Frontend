import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, FieldArray } from "formik";
import PageOutline from "../../../Components/PageOutline";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { BranchSelectField } from "@/components/BranchSelectField";
import { useStore } from "@/store/useStore";
import { useBranchStore, ALL_BRANCHES } from "@/store/useBranchStore";
import { useFetch } from "@/CustomHooks/useFetch";
import { api } from "@/utils";
import { showNotification } from "@/pages/HomePage/utils";
import CallerFieldArray from "./components/CallerFieldArray";
import PledgerFieldArray from "./components/PledgerFieldArray";
import {
  pledgeSchema,
  toPayload,
  emptyGroup,
  detailToFormValues,
  type PledgeFormValues,
} from "./utils/pledgeHelpers";

interface PledgeFormProps {
  mode: "create" | "edit";
}

const buildInitialValues = (): PledgeFormValues => ({
  branch_id: "",
  event_id: "",
  title: "",
  target_amount: "",
  deadline: "",
  callers: [],
  groups: [emptyGroup()],
  editGroups: true,
});

const PledgeForm = ({ mode }: PledgeFormProps) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const membersOptions = useStore((state) => state.membersOptions);
  const eventsOptions = useStore((state) => state.eventsOptions);
  const { activeBranchId } = useBranchStore();
  const [submitting, setSubmitting] = useState(false);

  const { data: detail } = useFetch(
    api.fetch.fetchPledge,
    mode === "edit" && id ? { id: Number(id) } : undefined,
    mode !== "edit",
  );

  const initialValues = useMemo<PledgeFormValues>(() => {
    if (mode === "edit" && detail?.data) return detailToFormValues(detail.data);
    return buildInitialValues();
  }, [mode, detail]);

  const handleSubmit = async (values: PledgeFormValues) => {
    if (activeBranchId === ALL_BRANCHES && !values.branch_id) {
      showNotification("Please select a branch", "error");
      return;
    }
    const payload = toPayload(values, mode);
    setSubmitting(true);
    try {
      if (mode === "edit" && id) {
        await api.put.updatePledge({ ...payload, id: Number(id) });
        showNotification("Pledge updated", "success");
        navigate(`/home/finance/pledges/${id}`);
      } else {
        const res = await api.post.createPledge(payload);
        showNotification("Pledge created", "success");
        const newId = res?.data?.id;
        navigate(newId ? `/home/finance/pledges/${newId}` : "/home/finance/pledges");
      }
    } catch {
      showNotification("Something went wrong saving the pledge", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageOutline>
      <h2 className="text-xl font-semibold mb-4">
        {mode === "edit" ? "Edit Pledge" : "Create Pledge"}
      </h2>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={pledgeSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <BranchSelectField
                value={values.branch_id}
                onChange={(v) => setFieldValue("branch_id", v)}
                required
              />
              <div className="flex flex-col">
                <label className="text-sm font-medium">Event</label>
                <SelectField
                  id="event_id"
                  placeholder="Select event"
                  searchable
                  options={eventsOptions}
                  value={values.event_id}
                  onChange={(_n, value) =>
                    setFieldValue("event_id", value === "" || value == null ? "" : Number(value))
                  }
                  error={touched.event_id ? (errors.event_id as string) : undefined}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Title (optional)</label>
                <input
                  className="border rounded-md p-2 text-sm"
                  value={values.title}
                  onChange={(e) => setFieldValue("title", e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Target amount (optional)</label>
                <input
                  type="number"
                  className="border rounded-md p-2 text-sm"
                  value={values.target_amount}
                  onChange={(e) =>
                    setFieldValue(
                      "target_amount",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium">Deadline (optional)</label>
                <input
                  type="date"
                  className="border rounded-md p-2 text-sm"
                  value={values.deadline}
                  onChange={(e) => setFieldValue("deadline", e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <CallerFieldArray membersOptions={membersOptions} />
            </div>

            {mode === "edit" && (
              <label className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-md p-3">
                <input
                  type="checkbox"
                  checked={values.editGroups}
                  onChange={(e) => setFieldValue("editGroups", e.target.checked)}
                />
                Edit amounts &amp; pledgers — <strong>warning:</strong> this replaces all pledgers and
                their recorded redemptions. To add people to an existing group, use “Add members” on
                the pledge detail page instead.
              </label>
            )}

            {(mode === "create" || values.editGroups) && (
              <div className="border-t pt-4">
                <FieldArray name="groups">
                  {({ push, remove }) => (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Called amounts &amp; groups</h4>
                        <button
                          type="button"
                          className="text-sm text-primary"
                          onClick={() => push(emptyGroup())}
                        >
                          + Add group
                        </button>
                      </div>
                      {values.groups.map((group, gi) => (
                        <div key={gi} className="border rounded-md p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="grid md:grid-cols-2 gap-3 flex-1">
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Called amount</label>
                                <input
                                  type="number"
                                  className="border rounded-md p-2 text-sm"
                                  value={group.called_amount}
                                  onChange={(e) =>
                                    setFieldValue(
                                      `groups[${gi}].called_amount`,
                                      e.target.value === "" ? "" : Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-500">Label (optional)</label>
                                <input
                                  className="border rounded-md p-2 text-sm"
                                  value={group.label}
                                  onChange={(e) =>
                                    setFieldValue(`groups[${gi}].label`, e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            {values.groups.length > 1 && (
                              <button
                                type="button"
                                className="text-sm text-red-500"
                                onClick={() => remove(gi)}
                              >
                                Remove group
                              </button>
                            )}
                          </div>
                          <PledgerFieldArray
                            name={`groups[${gi}].pledgers`}
                            calledAmount={group.called_amount}
                            membersOptions={membersOptions}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </FieldArray>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border rounded-md text-sm"
                onClick={() => navigate("/home/finance/pledges")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
              >
                {mode === "edit" ? "Save changes" : "Create pledge"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </PageOutline>
  );
};

export default PledgeForm;

import { showNotification } from "@/pages/HomePage/utils";
import { formatDate } from "@/utils";
import { ApiCalls } from "@/utils/api/apiFetch";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentApplicant, useProgramsStore } from "../store/programsStore";

const ProgramDetails = () => {
  const [contactValue, setContactValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedCohort, selectedProgram, setCurrentApplicant } = useProgramsStore();
  const navigate = useNavigate();
  const apiCalls = useMemo(() => new ApiCalls(), []);

  const lookupApplicant = async (): Promise<CurrentApplicant | null> => {
    if (!selectedCohort?.id) {
      setError("Please select a cohort to continue.");
      return null;
    }

    const response = await apiCalls.fetchUserByEmailAndCohort({
      email: contactValue.trim(),
      cohort_id: String(selectedCohort.id),
    });

    const applicant = (response?.data ?? null) as CurrentApplicant | null;
    if (!applicant?.user) {
      setError("We could not find a member with the provided details for this cohort.");
      return null;
    }

    return applicant;
  };

  const handleContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCohort) {
      showNotification("Please select a cohort to apply for.", "error");
      return;
    }

    if (!contactValue.trim()) {
      showNotification("Please enter your email or phone number.", "error");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const applicant = await lookupApplicant();
      if (!applicant) return;

      setCurrentApplicant(applicant);
      navigate("apply", {
        state: {
          cohortId: selectedCohort.id,
          contact: contactValue.trim(),
        },
      });
    } catch {
      setError("We could not validate your details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case "Ongoing":
        return (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Ongoing
          </span>
        );
      case "Upcoming":
        return (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Upcoming
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-lightGray/40 px-3 py-1 text-xs font-medium text-primaryGray">
            {status ?? "Unknown"}
          </span>
        );
    }
  };

  if (!selectedCohort) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-lightGray bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-primary">No Cohort Selected</h2>
        <p className="mt-2 text-sm text-primaryGray">
          Choose a cohort from the School of Ministry program page before starting an application.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-lightGray bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-primary">{selectedProgram?.title ?? "Program Application"}</h1>
        <p className="text-sm text-primaryGray">{selectedProgram?.description}</p>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-primary">Selected Cohort</h2>
        <div className="flex items-center justify-between rounded-lg border border-lightGray p-4">
          <div>
            <p className="font-medium text-primary">{selectedCohort.name}</p>
            <p className="text-sm text-primaryGray">
              Starts {formatDate(selectedCohort.startDate)} {selectedCohort.duration ? `• ${selectedCohort.duration}` : ""}
            </p>
          </div>
          {renderStatusBadge(selectedCohort.status)}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-primary">Start Application</h2>
        <p className="mb-4 text-sm text-primaryGray">
          Enter your registered member email or phone number to continue.
        </p>

        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label htmlFor="member-contact" className="mb-1 block text-sm font-medium text-primary">
              Email or Phone Number
            </label>
            <input
              id="member-contact"
              type="text"
              value={contactValue}
              onChange={(event) => setContactValue(event.target.value)}
              placeholder="Enter your email or phone number"
              className="w-full rounded-md border border-lightGray px-4 py-2 text-sm outline-none transition focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Checking details..." : "Continue"}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ProgramDetails;

import { Badge } from "@/components/Badge";
import { showNotification } from "@/pages/HomePage/utils";
import { ApiCreationCalls } from "@/utils/api/apiPost";
import { FormEvent, useMemo, useState } from "react";
import { useProgramsStore } from "../store/programsStore";

const ProgramInformation = () => {
  const { currentApplicant, selectedCohort, selectedProgram } = useProgramsStore();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const apiPost = useMemo(() => new ApiCreationCalls(), []);

  const classOptions = currentApplicant?.courses ?? [];

  const getFormatBadgeClass = (format: string) => {
    switch (format) {
      case "In_Person":
        return "bg-primary/10 text-primary border border-primary/20";
      case "Hybrid":
        return "bg-secondary/10 text-secondary border border-secondary/20";
      default:
        return "bg-lightest/10 text-lightest border border-lightest/20";
    }
  };

  const getCapacityState = (enrolled: number, capacity: number) => {
    if (capacity <= 0) {
      return { label: "Unavailable", className: "bg-lightGray/40 text-primaryGray border-lightGray" };
    }
    const ratio = Math.round((enrolled / capacity) * 100);
    if (ratio >= 100) return { label: "Full", className: "bg-red-50 text-red-700 border-red-200" };
    if (ratio >= 75) return { label: "Filling Fast", className: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Available", className: "bg-green-50 text-green-700 border-green-200" };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentApplicant?.user) {
      showNotification("Applicant details are missing. Please restart the application.", "error");
      return;
    }

    const selectedClass = classOptions.find((option) => option.id === selectedClassId);
    if (!selectedClass) {
      showNotification("Please select a class before submitting.", "error");
      return;
    }

    if (selectedClass.capacity > 0 && selectedClass.enrolled >= selectedClass.capacity) {
      showNotification("This class is full. Select another class.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        first_name: currentApplicant.user.first_name,
        last_name: currentApplicant.user.last_name,
        email: currentApplicant.user.email,
        phone: currentApplicant.user.primary_number,
        isMember: true,
        courseId: selectedClassId,
        userId: currentApplicant.user.user_id ?? null,
      };

      const response = await apiPost.enrollUser(payload);
      if ((response as { success?: boolean })?.success) {
        showNotification("Application submitted successfully.", "success");
      } else {
        showNotification("We could not submit your application. Please try again.", "error");
      }
    } catch {
      showNotification("An unexpected error occurred while submitting your application.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentApplicant?.user) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-lightGray bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-primary">Application Session Expired</h2>
        <p className="mt-2 text-sm text-primaryGray">
          We could not find your application details. Return to the previous step and validate your membership
          information again.
        </p>
      </div>
    );
  }

  const membershipType =
    currentApplicant.user.user?.membership_type === "ONLINE" ? "Online e-church family" : "In-person family";

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl border border-lightGray bg-white p-6 shadow-sm md:p-8">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-primary">
          Welcome, {currentApplicant.user.first_name} {currentApplicant.user.last_name}
        </h1>
        <p className="text-sm text-primaryGray">
          Confirm your details and select a class to complete your School of Ministry application.
        </p>
        {(selectedProgram?.title || selectedCohort?.name) && (
          <p className="text-xs text-primaryGray">
            {selectedProgram?.title} {selectedCohort?.name ? `• ${selectedCohort.name}` : ""}
          </p>
        )}
      </header>

      <section className="mb-8 rounded-lg border border-lightGray bg-lightGray/20 p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primaryGray">Your Details</h2>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-primaryGray">Name</p>
            <p className="font-medium text-primary">
              {currentApplicant.user.first_name} {currentApplicant.user.last_name}
            </p>
          </div>
          <div>
            <p className="text-primaryGray">Email</p>
            <p className="font-medium text-primary">{currentApplicant.user.email}</p>
          </div>
          <div>
            <p className="text-primaryGray">Phone</p>
            <p className="font-medium text-primary">
              {currentApplicant.user.country_code ?? ""} {currentApplicant.user.primary_number ?? ""}
            </p>
          </div>
          <div>
            <p className="text-primaryGray">Membership Type</p>
            <p className="font-medium text-primary">{membershipType}</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-primary">Select a Class</h2>
          <div className="space-y-3">
            {classOptions.map((option) => {
              const isFull = option.capacity > 0 && option.enrolled >= option.capacity;
              const selected = selectedClassId === option.id;
              const capacityState = getCapacityState(option.enrolled, option.capacity);

              return (
                <label
                  key={option.id}
                  htmlFor={option.id}
                  className={`block rounded-lg border p-4 transition ${
                    selected ? "border-primary bg-primary/5" : "border-lightGray bg-white"
                  } ${isFull ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:border-primaryGray"}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={option.id}
                      type="radio"
                      name="classOption"
                      value={option.id}
                      checked={selected}
                      onChange={() => {
                        if (!isFull) setSelectedClassId(option.id);
                      }}
                      disabled={isFull}
                      className="mt-0.5 h-4 w-4 border-lightGray text-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${isFull ? "text-primaryGray" : "text-primary"}`}>{option.name}</p>
                        <Badge className={`text-xs ${getFormatBadgeClass(option.classFormat)}`}>
                          {option.classFormat === "In_Person" ? "In-Person" : option.classFormat}
                        </Badge>
                        <Badge className={`text-xs ${capacityState.className}`}>{capacityState.label}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-primaryGray">
                        <p>
                          <span className="font-medium">Instructor:</span> {option.instructor}
                        </p>
                        <p>
                          <span className="font-medium">Schedule:</span> {option.schedule}
                        </p>
                        <p>
                          <span className="font-medium">Enrollment:</span> {option.enrolled}/{option.capacity}
                        </p>
                        <p>
                          <span className="font-medium">Location:</span> {option.location}
                        </p>
                        {option.meetingLink && (
                          <p className="truncate">
                            <span className="font-medium">Meeting Link:</span>{" "}
                            <a
                              href={option.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              Open link
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end border-t border-lightGray pt-4">
          <button
            type="submit"
            disabled={!selectedClassId || submitting}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgramInformation;

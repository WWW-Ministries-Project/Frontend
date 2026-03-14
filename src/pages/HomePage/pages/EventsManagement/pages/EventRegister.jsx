import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api/apiCalls";
import { Button } from "/src/components";
import EmptyState from "/src/components/EmptyState";
import defaultImage from "/src/assets/image.svg";

const initialRegistrationForm = {
  name: "",
  email: "",
  phone_number: "",
  location: "",
};

const EventRegister = () => {
  const query = location.search;
  const params = new URLSearchParams(query);
  const eventId = params.get("event_id");
  const token = params.get("token");
  const [eventData, setEventData] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validatingMember, setValidatingMember] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [memberCredentials, setMemberCredentials] = useState({
    member_id: "",
    phone_number: "",
  });
  const [validatedMember, setValidatedMember] = useState(null);
  const [registrationForm, setRegistrationForm] = useState(initialRegistrationForm);

  const lookupQuery = useMemo(() => {
    if (token) return { token };
    if (eventId) return { event_id: eventId };
    return null;
  }, [eventId, token]);

  useEffect(() => {
    if (!lookupQuery) {
      setLoadingEvent(false);
      setErrorMessage("A valid event registration link is required.");
      return;
    }

    setLoadingEvent(true);
    api.fetch
      .fetchPublicEventById(lookupQuery)
      .then((response) => {
        setEventData(response.data);
      })
      .catch((error) => {
        setErrorMessage(error.message || "Unable to load this event.");
      })
      .finally(() => {
        setLoadingEvent(false);
      });
  }, [lookupQuery]);

  useEffect(() => {
    if (!isMember) {
      setValidatedMember(null);
      setMemberCredentials({ member_id: "", phone_number: "" });
      setRegistrationForm(initialRegistrationForm);
    }
  }, [isMember]);

  const registrationBlockedForNonMember =
    eventData?.registration_audience === "MEMBERS_ONLY";

  const handleValidateMember = async () => {
    if (!lookupQuery) return;

    setValidatingMember(true);
    setErrorMessage("");

    try {
      const response = await api.post.validatePublicEventMember({
        ...lookupQuery,
        member_id: memberCredentials.member_id,
        phone_number: memberCredentials.phone_number,
      });

      setValidatedMember(response.data);
      setRegistrationForm({
        name: response.data.name || "",
        email: response.data.email || "",
        phone_number: response.data.phone_number || "",
        location: response.data.location || "",
      });
    } catch (error) {
      setValidatedMember(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to validate member details."
      );
    } finally {
      setValidatingMember(false);
    }
  };

  const handleRegister = async () => {
    if (!lookupQuery || !eventData) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = isMember
        ? {
            ...lookupQuery,
            is_member: true,
            member_id: memberCredentials.member_id,
            phone_number: memberCredentials.phone_number,
          }
        : {
            ...lookupQuery,
            is_member: false,
            ...registrationForm,
          };

      await api.post.publicRegisterEvent(payload);
      setSuccessMessage("Registration completed successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to register right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = (() => {
    if (!eventData?.requires_registration || !eventData?.registration_open) {
      return false;
    }

    if (isMember) {
      return Boolean(validatedMember);
    }

    if (registrationBlockedForNonMember) {
      return false;
    }

    return Object.values(registrationForm).every((value) => String(value).trim());
  })();

  if (loadingEvent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary/5 p-6">
        <div className="rounded-3xl border border-lightGray bg-white p-8 shadow-sm">
          <p className="text-sm text-primaryGray">Loading event registration...</p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary/5 p-6">
        <EmptyState
          scope="page"
          className="mx-auto w-[22rem]"
          msg={errorMessage || "Unable to load event registration"}
        />
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary/5 p-6">
        <div className="w-full max-w-xl rounded-3xl border border-lightGray bg-white p-8 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-primaryGray">
            Registration Complete
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">
            {eventData.event_name}
          </h1>
          <p className="mt-4 text-base text-primaryGray">{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary/5 px-4 py-8 md:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="overflow-hidden rounded-3xl border border-lightGray bg-white shadow-sm">
          <img
            src={eventData.poster || defaultImage}
            alt={eventData.event_name || "Event"}
            className="h-64 w-full object-cover"
          />

          <div className="space-y-5 p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primaryGray">
                Public Event Registration
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-primary">
                {eventData.event_name}
              </h1>
              <p className="mt-3 text-sm text-primaryGray">
                {eventData.description || "Register for this event using the form."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                  Event Date
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {eventData.start_date
                    ? `${eventData.start_date.slice(0, 10)}${
                        eventData.end_date &&
                        eventData.end_date !== eventData.start_date
                          ? ` to ${eventData.end_date.slice(0, 10)}`
                          : ""
                      }`
                    : "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                  Event Time
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {eventData.start_time || "-"} - {eventData.end_time || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                  Venue
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {eventData.location || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                  Registration Window
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {eventData.registration_end_date
                    ? `Closes ${eventData.registration_end_date.slice(0, 10)}`
                    : eventData.requires_registration
                      ? "Open"
                      : "Registration not required"}
                </p>
              </div>
            </div>

            {eventData.requires_registration && (
              <div className="rounded-2xl border border-lightGray bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primaryGray">
                  Registration Capacity
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {eventData.registration_count || 0}/{eventData.registration_capacity || 0}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-lightGray bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primaryGray">
                Register
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">
                Complete your registration
              </h2>
              {isMember && (
                <p className="mt-2 text-sm text-primaryGray">
                  Validate with either your member ID or your phone number.
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {!eventData.requires_registration && (
              <div className="rounded-2xl border border-lightGray bg-gray-50 px-4 py-3 text-sm text-primaryGray">
                This event does not require registration.
              </div>
            )}

            {eventData.requires_registration && !eventData.registration_open && (
              <div className="rounded-2xl border border-lightGray bg-gray-50 px-4 py-3 text-sm text-primaryGray">
                {eventData.registration_message || "Registration is closed for this event."}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-primary">
                Are you already a member?
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "No, I am not a member",
                    value: false,
                  },
                  {
                    label: "Yes, I am a member",
                    value: true,
                  },
                ].map((option) => {
                  const isActive = isMember === option.value;
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => setIsMember(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                        isActive
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-lightGray text-primaryGray hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isMember ? (
              <div className="space-y-4 rounded-2xl border border-lightGray bg-gray-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-primary">
                      Member ID
                    </label>
                    <input
                      type="text"
                      value={memberCredentials.member_id}
                      onChange={(event) => {
                        setValidatedMember(null);
                        setMemberCredentials((current) => ({
                          ...current,
                          member_id: event.target.value,
                        }));
                      }}
                      className="w-full rounded-xl border border-lightGray px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-primary">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={memberCredentials.phone_number}
                      onChange={(event) => {
                        setValidatedMember(null);
                        setMemberCredentials((current) => ({
                          ...current,
                          phone_number: event.target.value,
                        }));
                      }}
                      className="w-full rounded-xl border border-lightGray px-4 py-3"
                    />
                  </div>
                </div>

                <Button
                  value={validatingMember ? "Validating..." : "Validate Member"}
                  variant="secondary"
                  disabled={
                    validatingMember ||
                    (!memberCredentials.member_id.trim() &&
                      !memberCredentials.phone_number.trim())
                  }
                  onClick={handleValidateMember}
                />
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-lightGray bg-gray-50 p-4">
                {registrationBlockedForNonMember && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    This event is open to members only. Non-members cannot register.
                  </div>
                )}

                {[
                  { id: "name", label: "Name", type: "text" },
                  { id: "email", label: "Email", type: "email" },
                  { id: "phone_number", label: "Phone Number", type: "tel" },
                  { id: "location", label: "Location", type: "text" },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="mb-1 block text-sm font-medium text-primary">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={registrationForm[field.id]}
                      onChange={(event) =>
                        setRegistrationForm((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-lightGray px-4 py-3"
                    />
                  </div>
                ))}
              </div>
            )}

            {isMember && validatedMember && (
              <div className="space-y-4 rounded-2xl border border-lightGray bg-gray-50 p-4">
                {[
                  { id: "name", label: "Name" },
                  { id: "email", label: "Email" },
                  { id: "phone_number", label: "Phone Number" },
                  { id: "location", label: "Location" },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="mb-1 block text-sm font-medium text-primary">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={registrationForm[field.id] || ""}
                      readOnly
                      className="w-full rounded-xl border border-lightGray bg-white px-4 py-3 text-primaryGray"
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              value={submitting ? "Registering..." : "Register"}
              variant="primary"
              disabled={!canSubmit || submitting}
              onClick={handleRegister}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default EventRegister;

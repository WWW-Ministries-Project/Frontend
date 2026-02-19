import { Button, ProfilePicture } from "@/components";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/context/AuthWrapper";
import { useFetch } from "@/CustomHooks/useFetch";
import { navigateRef } from "@/pages/HomePage/navigationRef";
import { decodeQuery, encodeQuery } from "@/pages/HomePage/utils";
import { IFamilyInformationRaw, IMemberInfo, MembersType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { Banner } from "../Components/Banner";

const normalizeMemberStatus = (
  status?: string | null
): "UNCONFIRMED" | "CONFIRMED" | "MEMBER" => {
  const normalized = (status || "").toUpperCase().trim();

  if (normalized === "CONFIRMED") return "CONFIRMED";
  if (normalized === "MEMBER") return "MEMBER";

  return "UNCONFIRMED";
};

const formatMemberStatus = (status?: string | null): string => {
  const normalizedStatus = normalizeMemberStatus(status);

  if (normalizedStatus === "MEMBER") return "Functional Member";
  if (normalizedStatus === "CONFIRMED") return "Confirmed Member";

  return "Unconfirmed Member";
};

type ProfileLocationState = {
  prefillMember?: MembersType;
};

const getMembershipTypeLabel = (membershipType?: string): string => {
  if (membershipType === "ONLINE") return "Online e-church family";
  if (membershipType === "IN_HOUSE") return "In-person church family";

  return "";
};

export const ProfileDetails = () => {
  const location = useLocation();
  const {
    user: { permissions },
  } = useAuth();

  const { id } = useParams();
  const user_id = id ? decodeQuery(id) : undefined;

  const { data, loading: memberLoading } = useFetch(
    api.fetch.fetchAMember,
    user_id ? { user_id } : undefined,
    !user_id
  );

  const { data: familyDataResponse, loading: familyLoading } = useFetch(
    api.fetch.fetchMemberFamily,
    user_id ? { user_id } : undefined,
    !user_id
  );

  const prefillMember = (location.state as ProfileLocationState | null)
    ?.prefillMember;

  const details = data?.data as IMemberInfo | undefined;
  const familyData = (familyDataResponse?.data || []) as
    | IFamilyInformationRaw
    | unknown[];

  const displayName = details?.name || prefillMember?.name || "Loading member...";
  const displayMemberId = details?.member_id || prefillMember?.member_id || "-";
  const displayEmail = details?.email || prefillMember?.email || "";
  const displayPhone =
    details?.primary_number || prefillMember?.primary_number || "";
  const displayPhoto = details?.photo || prefillMember?.photo || "";

  const membershipTypeLabel = getMembershipTypeLabel(
    details?.membership_type || prefillMember?.membership_type
  );
  const memberStatusLabel = formatMemberStatus(
    details?.status ?? prefillMember?.status
  );

  const editableMemberId = details?.id || prefillMember?.id;
  const showInitialLoadingState = memberLoading && !details && !prefillMember;

  const handleEdit = (memberId: number | string) => {
    if (navigateRef.current)
      navigateRef.current(
        `/home/members/manage-member?member_id=${encodeQuery(memberId)}`,
        {
          state: { mode: "edit" },
        }
      );
  };

  return (
    <div>
      <div className="sticky top-0 z-40 w-full">
        <Banner>
          <div className="w-full relative text-white rounded-t-lg">
            <div
              className="rounded-t-lg left-0 w-full h-full flex items-center justify-between bg-cover"
              style={{
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="sm:flex justify-between items-cente container mx-auto">
                <div className="flex gap-4 items-center">
                  <ProfilePicture
                    className="w-24 h-24 md:w-32 md:h-32 outline outline-white"
                    textClass="font-bold overflow-hidden text-2xl"
                    src={displayPhoto}
                    alt="cover Image"
                    name={displayName}
                    id="coverPic"
                  />

                  <article className="md:inline space-y-2">
                    <div className="font-bold text-sm md:text-2xl">{displayName}</div>
                    <div className="flex gap-2 text-xs md:text-sm">
                      <span>#</span>
                      <span>{displayMemberId}</span>
                    </div>

                    {showInitialLoadingState && (
                      <p className="text-xs md:text-sm text-white/90">Loading profile details...</p>
                    )}

                    <div className="md:flex items-center gap-2 text-xs md:text-sm">
                      {displayEmail && (
                        <p className="flex items-center gap-2">
                          <span>
                            <EnvelopeIcon className="h-4" />
                          </span>
                          <span>{displayEmail}</span>
                        </p>
                      )}
                      <div className="hidden md:block">
                        {displayEmail && displayPhone && <p>|</p>}
                      </div>
                      {displayPhone && (
                        <p className="flex items-center gap-2 pt-2 md:pt-0">
                          <span>
                            <PhoneIcon className="h-4" />
                          </span>
                          <span>{displayPhone}</span>
                        </p>
                      )}
                    </div>

                    <div className="hidden md:flex gap-2">
                      {membershipTypeLabel && (
                        <Badge className="text-sm border-primary bg-white border text-primary w-fit">
                          {membershipTypeLabel}
                        </Badge>
                      )}
                      <Badge className="text-sm border-primary bg-white border text-primary normal-case">
                        {memberStatusLabel}
                      </Badge>
                    </div>

                    <div className="flex md:hidden gap-2 pt-2">
                      {membershipTypeLabel && (
                        <Badge className="text-xs border-primary bg-white border text-primary w-fit">
                          {membershipTypeLabel}
                        </Badge>
                      )}
                      <Badge className="text-xs border-primary bg-white border text-primary normal-case">
                        {memberStatusLabel}
                      </Badge>
                    </div>
                  </article>
                </div>

                {permissions.manage_members && (
                  <div className="pt-4 md:pt-0">
                    <Button
                      value="Edit Profile"
                      onClick={() =>
                        editableMemberId && handleEdit(String(editableMemberId))
                      }
                      className="w-full px-5 py-3 bg-transparent min-h-8 bg-white text-primary text-xs md:text-sm lg:text-base"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Banner>
      </div>

      <section className="bg-white w-full h-full mb-4 mx-auto">
        <div className="hideScrollbar pb-4 mx-auto rounded-b-xl overflow-y-auto">
          <Outlet
            context={{
              handleEdit,
              details,
              familyData,
              loading: memberLoading || familyLoading,
            }}
          />
        </div>
      </section>
    </div>
  );
};

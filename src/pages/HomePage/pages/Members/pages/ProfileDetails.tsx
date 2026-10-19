import { ProfilePicture } from "@/components";
import { Badge } from "@/components/Badge";
import { useFetch } from "@/CustomHooks/useFetch";
import { useUserStore } from "@/store/userStore";
import { decodeToken } from "@/utils/helperFunctions";
import { IFamilyInformationRaw, IMemberInfo, MembersType } from "@/utils";
import { api } from "@/utils/api/apiCalls";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Outlet, useLocation } from "react-router-dom";
import BannerWrapper from "@/pages/MembersPage/layouts/BannerWrapper";
import { AdminMemberProfile } from "../Components/profile/AdminMemberProfile";

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

/**
 * `/home/members/:id` renders the admin profile; `/member/profile` keeps the
 * member-portal layout (banner + `MemberInformation` outlet).
 */
export const ProfileDetails = () => {
  const location = useLocation();
  const isMemberRoute = location.pathname.startsWith("/member");
  return isMemberRoute ? <MemberPortalProfile /> : <AdminMemberProfile />;
};

const MemberPortalProfile = () => {
  const location = useLocation();
  const storedUserId = useUserStore((state) => state.id);
  const tokenPayload = decodeToken();
  const tokenUserId = tokenPayload?.id ? String(tokenPayload.id) : "";
  const requestedUserId = storedUserId || tokenUserId || undefined;
  const shouldFetchByUserId = Boolean(requestedUserId);

  const { data: memberDataResponse, loading: memberLoading } = useFetch(
    api.fetch.fetchAMember,
    shouldFetchByUserId ? { user_id: String(requestedUserId) } : undefined,
    !shouldFetchByUserId
  );

  const details = memberDataResponse?.data as IMemberInfo | undefined;
  const resolvedUserId =
    requestedUserId ||
    (details?.id !== undefined && details?.id !== null
      ? String(details.id)
      : undefined);

  const { data: familyDataResponse, loading: familyLoading } = useFetch(
    api.fetch.fetchMemberFamily,
    resolvedUserId ? { user_id: resolvedUserId } : undefined,
    !resolvedUserId
  );

  const prefillMember = (location.state as ProfileLocationState | null)
    ?.prefillMember;

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

  const showInitialLoadingState =
    memberLoading && !details && !prefillMember;

  const profileBannerContent = (
    <div className="w-full relative text-white">
      <div
        className="left-0 w-full h-full flex items-center justify-between bg-cover"
        style={{
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="w-full sm:flex justify-between items-center">
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

        </div>
      </div>
    </div>
  );

  return (
    <div>
      <BannerWrapper>{profileBannerContent}</BannerWrapper>

      <section className="bg-white w-full h-full mb-4 mx-auto">
        <div className="pb-4 mx-auto rounded-b-xl overflow-y-auto">
          <Outlet
            context={{
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

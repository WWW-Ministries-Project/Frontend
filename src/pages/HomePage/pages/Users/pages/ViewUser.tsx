import { Button } from "@/components";
import { ProfilePicture } from "@/components/ProfilePicture";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectField";
import { showLoader, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";

/* Simple inline spinner */
const Spinner = ({ className = "" }: { className?: string }) => (
  <svg className={`animate-spin h-5 w-5 ${className}`} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
  </svg>
);

interface IProps {
  id: string;
  onClose: () => void;
}

export const ViewUser = ({ id, onClose }: IProps) => {
  /* Fetch user & roles with loading flags */
  const {
    data: responseData,
    loading: loadingUser,
    refetch,
  } = useFetch(api.fetch.fetchAMember, { user_id: id! });

  const {
    data: allRoles,
    loading: loadingRoles,
  } = useFetch(api.fetch.fetchAccessLevels);

  const {
    updateData: activateUser,
    loading: activateLoading,
    data: activateData,
  } = usePut(api.put.activateMember);

  const {
    postData: resetPassword,
    loading: resetLoading,
    data: resetData,
    error: resetError,
  } = usePost(api.post.forgotPassword);

  const {
    updateData: updateAccess,
    loading: accessLoading,
  } = usePut(api.put.assignAccessRight);

  const user = useMemo(() => responseData?.data, [responseData]);
  const [isActive, setIsActive] = useState(!!user?.is_active);

  /* Keep local active flag in sync */
  useEffect(() => {
    if (user) setIsActive(!!user.is_active);
  }, [user]);

  /* Toggle status */
  const toggleAccountStatus = () => {
    if (!user) return;
    activateUser({ id: +id!, status: user.status, is_active: !isActive });
  };

  /* Reset password notifications */
  useEffect(() => {
    if (resetData) showNotification("email sent to user", "success");
    if (resetError) showNotification("something went wrong try again", "error");
  }, [resetData, resetError]);

  const handlePasswordReset = () => {
    if (!user) return;
    resetPassword({ email: user.email });
  };

  /* Roles options */
  const rolesOptions = useMemo(
    () =>
      allRoles?.data?.map((role: any) => ({ label: role.name, value: role.id })) || [],
    [allRoles]
  );

  /* Global loader hook you already use for status change */
  useEffect(() => {
    showLoader(activateLoading);
    if (activateData) {
      showNotification(
        `User ${activateData.data.is_active ? "Activated" : "Deactivated"} Successfully`,
        "success"
      );
      setIsActive(activateData.data.is_active);
    }
  }, [activateLoading, activateData]);

  /* Change access */
  const changeAccess = (access_level_id: number | string) => {
    updateAccess({ user_id: id!, access_level_id })
      .then(() => {
        refetch();
        showNotification("Access level updated successfully", "success");
      })
      .catch(() => showNotification("Failed to update access level", "error"));
  };

  /* Skeletons */
  const HeaderSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
      <div className="mt-2 h-4 w-56 bg-gray-200 rounded" />
    </div>
  );

  const ProfileSkeleton = () => (
    <div className="flex items-center gap-8 animate-pulse">
      <div className="w-24 h-24 rounded-full bg-gray-200" />
      <div className="space-y-3 w-full">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-56 bg-gray-200 rounded" />
      </div>
    </div>
  );

  const FieldSkeleton = () => (
    <div className="flex items-center justify-between border p-4 rounded-xl animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-56 bg-gray-200 rounded" />
      </div>
      <div className="h-9 w-28 bg-gray-200 rounded" />
    </div>
  );

  /* Content */
  return (
    <div className="relative w-full max-w-[45rem] mx-auto bg-white rounded-lg p-6 space-y-4">
      {/* Close & title */}
      <div>
        {loadingUser ? (
          <HeaderSkeleton />
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Account</h2>
              <button onClick={onClose} className="cursor-pointer">
                <XCircleIcon height={32} className="text-gray-500 hover:text-primary" />
              </button>
            </div>
            <p className="text-gray-600">Manage user account and permissions</p>
          </>
        )}
      </div>

      <HorizontalLine />

      {/* Profile block */}
      {loadingUser ? (
        <ProfileSkeleton />
      ) : (
        <div className="flex items-center gap-8">
          <ProfilePicture
            src={user?.photo}
            alt="Profile"
            className={"w-24 h-24 bg-lightGray"}
          />
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <div className="font-semibold">{user?.name}</div>
                <div
                  className={`text-xs font-semibold rounded-full px-2 py-1 ${
                    isActive ? "bg-green-500" : "bg-red-500"
                  } text-white`}
                >
                  {isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div className="flex gap-2">
                {user?.department?.name && <div>{user?.department?.name || "-"}</div>}{" "}
                {user?.department?.name && "|"}
                {user?.position?.name && <div>{user?.position?.name || "-"}</div>}
              </div>
              <div className="flex gap-2">
                {user?.email && <div>{user?.email}</div>} {"|"}
                {user?.primary_number && <div>{user?.primary_number}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account management */}
      <section className="space-y-4">
        <div className="font-semibold text-xl">Account Management</div>

        {/* Account status */}
        {loadingUser ? (
          <FieldSkeleton />
        ) : (
          <div className="relative flex items-center justify-between border p-4 rounded-xl">
            <div>
              <p className="font-medium">Account status</p>
              <p className="text-sm text-gray-700">
                User access is {isActive ? "active" : "inactive"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activateLoading && <Spinner className="text-primary" />}
              <ToggleSwitch
                name="activate"
                label={isActive ? "Deactivate" : "Activate"}
                isChecked={isActive}
                onChange={toggleAccountStatus}
                disabled={activateLoading || accessLoading}
              />
            </div>
          </div>
        )}

        {/* User role */}
        {loadingUser ? (
          <FieldSkeleton />
        ) : (
          <div className="relative flex items-center justify-between border p-4 rounded-xl">
            <div>
              <p className="font-medium">User role</p>
              <p className="text-sm text-gray-700">Select a role for this user</p>
            </div>
            <div className="flex items-center gap-3">
              {(loadingRoles || accessLoading) && <Spinner className="text-primary" />}
              <SelectField
                placeholder={"Select Role"}
                className="w-48 sm:w-64"
                label={""}
                disabled={loadingRoles || accessLoading}
                options={rolesOptions}
                onChange={(_, value) => changeAccess(value)}
                id={"role"}
                value={user?.access_level_id?.toString() || ""}
              />
            </div>
          </div>
        )}

        {/* Password reset */}
        {loadingUser ? (
          <FieldSkeleton />
        ) : (
          <div className="flex items-center justify-between border p-4 rounded-xl">
            <div>
              <p className="font-medium">Password Reset</p>
              <p className="text-sm text-gray-700">
                Send a password reset email to the user
              </p>
            </div>
            <Button
              variant={"primary"}
              value="Send Reset Email"
              onClick={handlePasswordReset}
              disabled={resetLoading || !isActive}
              loading={resetLoading}
            />
          </div>
        )}
      </section>

      {/* Block interactions overlay when mutating (optional) */}
      {(activateLoading || accessLoading) && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-lg pointer-events-none flex items-center justify-center">
          <div className="flex items-center gap-3 text-primary">
            <Spinner />
            <span className="text-sm font-medium">Updating…</span>
          </div>
        </div>
      )}
    </div>
  );
};

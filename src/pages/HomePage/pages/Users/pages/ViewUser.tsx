import { Button } from "@/components";
import { ProfilePicture } from "@/components/ProfilePicture";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import { SelectField } from "@/pages/HomePage/Components/reusable/SelectFields";
import { showLoader, showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ActiveAccess } from "../../Settings/Components/ActiveAccess";
export const ViewUser = () => {
  const { id } = useParams();
  //api
  const { data: responseData, refetch } = useFetch(api.fetch.fetchAMember, {
    user_id: id!,
  });
  const { data: allRoles } = useFetch(api.fetch.fetchAccessLevels);
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

  const { updateData: updateAccess, loading: accessLoading } = usePut(
    api.put.assignAccessRight
  );

  const user = useMemo(() => responseData?.data, [responseData]);

  const [isActive, setIsActive] = useState(!!user?.is_active);

  // activating user
  useEffect(() => {
    if (user) {
      setIsActive(!!user.is_active);
    }
  }, [user]);

  const toggleAccountStatus = () => {
    if (!user) return;
    activateUser({
      id: +id!,
      status: user.status,
      is_active: !isActive,
    });
  };

  // reset password
  useEffect(() => {
    if (resetData) {
      showNotification("email sent to user", "success");
    }
    if (resetError) {
      showNotification("something went wrong try again", "error");
    }
  }, [resetData, resetError]);

  const handlePasswordReset = () => {
    if (!user) return;
    resetPassword({ email: user.email });
  };

  // access level options
  const rolesOptions = useMemo(
    () =>
      allRoles?.data.map((role) => ({
        name: role.name,
        value: role.id,
      })) || [],
    [allRoles]
  );
  // activate user
  useEffect(() => {
    showLoader(activateLoading);
    if (activateData) {
      showNotification(
        `User ${
          activateData.data.is_active ? "Activated" : "Deactivated"
        } Successfully`,
        "success"
      );
      setIsActive(activateData.data.is_active);
    }
  }, [activateLoading, activateData]);

  // change access
  const changeAccess = (access_level_id: number | string) => {
    updateAccess({
      user_id: id!,
      access_level_id: access_level_id,
    })
      .then(() => {
        refetch();
        showNotification("Access level updated successfully", "success");
      })
      .catch(() => {
        showNotification("Failed to update access level", "error");
      });
  };

  return (
    <PageOutline>
      <div className="max-w-4xl mx-auto bg-white rounded-lg  p-6 space-y-4">
        <h2 className="text-2xl font-semibold ">User Account</h2>
        <div className="flex items-center  gap-8">
          <ProfilePicture
            src={user?.photo}
            alt="Profile"
            className={" w-32 h-32 bg-lightGray"}
          />
          {/* User Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{user?.name}</div>
                <div
                  className={`text-xs font-semibold rounded-full px-2 py-1 ${
                    isActive ? " bg-green-300" : "bg-red-300"
                  } text-white`}
                >
                  {isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="flex gap-2">
                {user?.department?.name && (
                  <div className="">{user?.department?.name || "-"}</div>
                )}{" "}
                {user?.department?.name && "|"}
                {user?.position?.name && (
                  <div className="">{user?.position?.name || "-"}</div>
                )}
              </div>

              <div className="flex gap-2">
                {user?.email && <div className="">{user?.email}</div>} {"|"}
                {user?.primary_number && (
                  <div className="">{user?.primary_number}</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <HorizontalLine />
        <section className="space-y-4">
          <div className="flex items-center justify-between w-2/3">
            <div className="">Account status</div>
            <ToggleSwitch
              name="activate"
              label={`${isActive ? "Deactivate" : "Activate"}`}
              isChecked={isActive}
              onChange={toggleAccountStatus}
              disabled={accessLoading}
            />
          </div>

          <div className="flex items-center justify-between w-2/3">
            <div>User role</div>
            <div className="max-w-[300px]">
              <SelectField
                placeholder={"Select Role"}
                className="w-full"
                label={""}
                disabled={accessLoading}
                options={rolesOptions}
                onChange={(_, value) => changeAccess(value)}
                id={"role"}
                value={user?.access_level_id?.toString() || ""}
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-2/3">
            <div className="">Reset password?</div>
            <Button
              variant={"primary"}
              value="Reset"
              onClick={handlePasswordReset}
              disabled={resetLoading || !isActive}
              loading={resetLoading}
            />
          </div>
        </section>
        <HorizontalLine />
        <section></section>
        {user?.access_level_id && (
          <ActiveAccess
            permissions={user?.access?.permissions || {}}
            name={user?.access?.name || ""}
          />
        )}
      </div>
    </PageOutline>
  );
};


import Button from "@/components/Button";
import {ProfilePicture} from "@/components/ProfilePicture";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useFetch } from "@/CustomHooks/useFetch";
import { usePost } from "@/CustomHooks/usePost";
import { usePut } from "@/CustomHooks/usePut";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import SelectField from "@/pages/HomePage/Components/reusable/SelectFields";
import { useNotificationStore } from "@/pages/HomePage/store/globalComponentsStore";
import { showNotification } from "@/pages/HomePage/utils";
import { api } from "@/utils/api/apiCalls";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { initialUser } from "../../Members/utils/membersHelpers";
import { UserType } from "../../Members/utils/membersInterfaces";
import ActiveAccess from "../../Settings/Components/ActiveAccess";
const ViewUser = () => {
  const { id } = useParams();

  const {
    refetch: refetchRole,
    data: fetchedRole,
    loading: roleLoading,
  } = useFetch(api.fetch.fetchAnAccess, {}, true);
  const { data: allRoles, loading: allRolesLoading } = useFetch(
    api.fetch.fetchAccessLevels
  );
  const { data: responseData, loading: loadingMember } = useFetch(
    api.fetch.fetchAMember,
    {
      user_id: id!,
    }
  );
  const {
    updateData: updateAccess,
    loading: accessLoading,
    data: accessData,
    error: accessError,
  } = usePut(api.put.assignAccessRight);
  // @ts-expect-error will fix
  const user: Omit<UserType, "position", "department"> & {
    position: string;
    department: string;
  } = responseData?.data || initialUser;

  const {
    postData,
    loading: resetLoading,
    data: resetData,
    error: resetError,
  } = usePost(api.post.forgotPassword);

  const setNotification = useNotificationStore(
    (state) => state.setNotification
  );

  const [isActive, setIsActive] = useState<boolean>(user?.is_active || false);
  const [activeRole, setActiveRole] = useState<string | number>("");

  const role = fetchedRole?.data;
  const roleNames = useMemo(
    () =>
      allRoles?.data.map((role) => ({
        name: role.name,
        value: role.id,
      })) || [],
    [role]
  );

  useEffect(() => {
    if (user.access_level_id) {
      refetchRole({ id: user.access_level_id });
    }
  }, [responseData]);

  useEffect(() => {
    if (accessError) {
      setNotification({
        title: "Error",
        message: accessError.message,
        type: "error",
        onClose: () => {},
        show: true,
      });
    }
    if (accessData) {
      setActiveRole(accessData.data.id);
      setNotification({
        title: "Success",
        message: "Access level updated successfully",
        type: "success",
        onClose: () => {},
        show: true,
      });
    }
  }, [accessError, accessData]);
  useEffect(() => {
    if (resetData) {
      showNotification("email sent to user", "success");
    }
    if (resetError) {
      showNotification("something went wrong try again", "error");
    }
  }, [resetData, resetError]);

  const changeAccess = (access_level_id: number | string) => {
    updateAccess({
      user_id: id,
      access_level_id: access_level_id,
    });
  };
  const toggleAccountStatus = () => {
    // TODO: add endpoint
    alert("remember to take endpoint from BE!");
    setIsActive((prev) => !prev);
  };

  const resetPassword = () => {
    // alert("Password reset initiated!");
    postData(user.email);
  };

  return (
    <div className="p-4">
      {/* <PageOutline> */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg  p-6 space-y-4">
        <h2 className="text-2xl font-semibold ">User Account</h2>
        <div className="flex items-center  gap-8">
          <ProfilePicture
            src={user.photo}
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
                    isActive ? " bg-green" : "bg-red-300"
                  } text-white`}
                >
                  {`${isActive ? "Active" : "Inactive"}`}
                </div>
              </div>

              <div className="flex gap-2">
                {user.department?.name && (
                  <div className="">{user.department?.name || "-"}</div>
                )}{" "}
                {user.department?.name && "|"}
                {user.position?.name && (
                  <div className="">{user.position?.name || "-"}</div>
                )}
              </div>

              <div className="flex gap-2">
                {user?.email && <div className="">{user?.email}</div>} {"|"}
                {user.primary_number && (
                  <div className="">{user.primary_number}</div>
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
                options={roleNames}
                onChange={(_, value) => changeAccess(value)}
                id={"role"}
                value={activeRole || role?.id}
              />
            </div>
          </div>

          <div className="flex items-center justify-between w-2/3">
            <div className="">Reset password?</div>
            <Button
              className={"primary"}
              value="Reset"
              onClick={resetPassword}
            />
          </div>

          {/* <div className="">Last password reset</div>
              <div className="font-semibold">{new Date().toDateString()}</div> */}
        </section>
        <HorizontalLine />
        <section></section>
        {
          <ActiveAccess
            permissions={role?.permissions || {}}
            name={role?.name || ""}
          />
        }
      </div>
      {(loadingMember ||
        allRolesLoading ||
        roleLoading ||
        accessLoading ||
        resetLoading) && <LoaderComponent />}
      {/* </PageOutline> */}
    </div>
  );
};

export default ViewUser;

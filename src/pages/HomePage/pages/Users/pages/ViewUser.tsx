import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import ToggleSwitch from "@/components/ToggleInput";
import { useFetch } from "@/CustomHooks/useFetch";
import PageOutline from "@/pages/HomePage/Components/PageOutline";
import HorizontalLine from "@/pages/HomePage/Components/reusable/HorizontalLine";
import LoaderComponent from "@/pages/HomePage/Components/reusable/LoaderComponent";
import SelectField from "@/pages/HomePage/Components/reusable/SelectFields";
import api from "@/utils/apiCalls";
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
  // @ts-ignore
  const user: Omit<UserType, "position", "department"> & {
    position: string;
    department: string;
  } = responseData?.data.data || initialUser;
  const [isActive, setIsActive] = useState<boolean>(user?.is_active || false);
  const role = fetchedRole?.data.data;
  const roleNames = useMemo(
    () =>
      allRoles?.data.data.map((role) => ({
        name: role.name,
        value: role.id,
      })) || [],
    [role]
  );
  const props = {
    name: "Jojo Abbiw",
    email: "abbiwjojo22@gmail.com",
    primary_number: "+233-248-651-322",
    position: "System admin",
    department: "IT department",
    photo: "https://via.placeholder.com/150",
  };

  useEffect(() => {
    if (user.access_level_id) {
      refetchRole({ id: user.access_level_id });
    }
  }, [responseData]);

  const toggleAccountStatus = () => {
    setIsActive((prev) => !prev);
  };

  const resetPassword = () => {
    alert("Password reset initiated!");
  };

  return (
    <PageOutline>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-semibold ">User Account</h2>
        <div className="flex items-start justify-center space-x-24">
          <ProfilePic src={props.photo} alt="Profile" />
          {/* User Details */}
          <div className="">
            <div className="grid grid-cols-2 gap-y-4 gap-x-12">
              <span className="">Full name</span>
              <span className="font-semibold">{user?.name}</span>

              <span className="">Email</span>
              <span className="font-semibold">{user?.email}</span>

              <span className="">Phone number</span>
              <span className="font-semibold">{user.primary_number}</span>

              <span className="">Position</span>
              <span className="font-semibold">{user.position}</span>

              <span className="">Department</span>
              <span className="font-semibold">{user.department?.name}</span>

              <span className="">Account status</span>
              <ToggleSwitch
                name="activate"
                label={`${isActive ? "Deactivate" : "Activate"}`}
                isChecked={isActive}
                onChange={toggleAccountStatus}
              />

              <span className="">Reset password?</span>
              <Button
                className={"primary"}
                value="Reset"
                onClick={resetPassword}
              />

              <span className="">Last password reset</span>
              <span className="font-semibold">{new Date().toDateString()}</span>
            </div>
          </div>
        </div>
        <HorizontalLine />
        <section>
          <div className="max-w-[300px]">
            <SelectField
              placeholder={"Select Role"}
              className="w-full"
              label={"Change Role"}
              options={roleNames}
              onChange={(name, value) => console.log(name, value, role?.name)}
              id={"role"}
              value={role?.id}
            />
          </div>
        </section>
        {
          <ActiveAccess
            permissions={role?.permissions || {}}
            name={role?.name || ""}
          />
        }
      </div>
      {(loadingMember || allRolesLoading || roleLoading) && <LoaderComponent />}
    </PageOutline>
  );
};

export default ViewUser;

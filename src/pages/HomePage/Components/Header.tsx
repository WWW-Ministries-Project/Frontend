import hamburger from "/src/assets/sidenav.svg";
import { ProfilePicture } from "@/components";
import ChurchLogo from "@/components/ChurchLogo";
import { MouseEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthWrapper";
import { decodeToken, removeToken } from "../../../utils/helperFunctions";

interface IProps {
  handleShowNav: () => void;
}

export const Header = ({ handleShowNav }: IProps) => {
  const navigate = useNavigate();
  const [showLogOut, setShowLogOut] = useState<boolean>(false);
  const { logout } = useAuth();

  const handleClick: MouseEventHandler<HTMLDivElement> = () => {
    setShowLogOut((prev) => !prev);
  };

  const handleLogOut = () => {
    removeToken();
    logout();
    navigate("/login");
  };

  const decodedToken = decodeToken();
  const profileImg = decodedToken?.profile_img ?? "";
  const name = decodedToken?.name ?? "";

  return (
    <div className="flex items-center">
      <header className="flex justify-between items-center w-full pb-3">
        <div className="flex items-center gap-x-6">
          <div>
            <ChurchLogo show={true} className="h-3" />
          </div>
          <img
            src={hamburger}
            alt="hamburger menu"
            onClick={handleShowNav}
            className="cursor-pointer inline sm:inline md:inline text-primary lg:hidden"
          />
        </div>

        <div className="w-[40.9%]" />

        <div className="w-[246px] flex justify-end gap-x-2 items-center">
          <div
            className="flex items-center rounded-xl gap-x-3 cursor-pointer"
            onClick={handleClick}
          >
            <ProfilePicture
              src={profileImg}
              className="w-[2rem] h-[2rem] bg-lightGray/50 border border-primary text-primary"
              name={name}
              alt="profile picture"
            />
            <span className="text-primary font-semibold">{name}</span>
          </div>
          {showLogOut && (
            <div
              onClick={handleLogOut}
              className="absolute z-50 top-16 lg:right-8 p-5 rounded-lg bg-white flex shadow-xl items-center hover:bg-neutralGray cursor-pointer"
            >
              LogOut
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

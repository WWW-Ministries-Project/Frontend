import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import { pictureType } from "@/utils/interfaces";
import React from "react";
import coverImage1 from "/src/assets/CoverImage.svg";
import Badge from "@/components/Badge";

interface BannerProps {
  name?: string;
  department: string;
  position: string;
  email: string;
  primary_number: string;
  src: string;
  onClick: (bool: boolean) => void;
  edit: boolean;
  onPicChange: (obj: pictureType) => void;
  membership_type?: boolean; // Added property
}

const Banner: React.FC<BannerProps> = (props) => {
  const handleClick = () => {
    props.onClick(true);
  };
  return (
    <div className="w-full h-36 relative bg-primary text-white rounded-t-lg">
      {/* <img src={props.coverImage1} alt="cover Image" className="w-full rounded-xl" /> */}
      <div
        className="absolute bottom-0 rounded-t-lg left-0 w-full h-full flex items-center justify-between px-4 bg-cover"
        style={{
          backgroundImage: `url(${coverImage1})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex justify-between items-cente  container mx-auto">
        <div className="flex gap-4 items-center  ">
          <ProfilePic
            className="w-24 h-24 outline outline-white"
            src={props.src}
            alt="cover Image"
            name={props.name}
            editable={props.edit}
            id="coverPic"
            onChange={props.onPicChange}
          />
          <article className="xs:hidden md:inline space-y-2">
            <div className="font-bold text-2xl ">
              {props.name || "No Name"}
            </div>
            <div className="">{`${props.department} ${
              props.department && props.position ? "|" : ""
            } ${props.position} `}</div>
            <div className="">
              {(props.email || "No Email") +
                " | " +
                (props.primary_number || "No Phone")}
            </div>
            <div className="md:w-2/3">
              <Badge className="text-sm border-primary bg-white border text-primary ">
                {props.membership_type?"Online e-church family":" In-person church family"}
              </Badge>
            </div>
          </article>
        </div>
        {!props.edit && (
          <div>
            <Button
              value="Edit Profile"
              onClick={handleClick}
              className="w-full  px-5 py-3 bg-transparent min-h-8  md:bg-white md:text-primary"
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Banner;

import Button from "@/components/Button";
import ProfilePic from "@/components/ProfilePicture";
import { pictureType } from "@/utils/interfaces";
import React from "react";
import coverImage1 from "/src/assets/CoverImage_Gold.svg";
import Badge from "@/components/Badge";

interface BannerProps {
  name?: string;
  department?: string;
  position?: string;
  email: string;
  primary_number: string;
  src?: string;
  onClick?: (bool: boolean) => void;
  edit?: boolean;
  onPicChange: (obj: pictureType) => void;
  membership_type?: boolean; // Added property
  loading?: boolean; // Added property
}

const Banner: React.FC<BannerProps> = (props) => {
  const handleClick = () => {
    props.onClick && props.onClick(true);
  };
  return (
    <div className=" flex w-full relative bg-primary text-white rounded-t-lg">
      {/* <img src={props.coverImage1} alt="cover Image" className="w-full rounded-xl" /> */}
      <div
        className="p-4 rounded-t-lg left-0 w-full h-full flex items-center justify-between  bg-cover"
        style={{
          backgroundImage: `url(${coverImage1})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex justify-between items-cente  container mx-auto">
        <div className="flex gap-4 items-center  ">
          {props.loading? <div className="h-24 w-24 rounded-full animate-pulse bg-lightGray "></div>:
          <ProfilePic
            className="w-24 h-24 outline outline-white"
            src={props.src}
            alt="cover Image"
            name={props.name}
            editable={props.edit}
            id="coverPic"
            onChange={props.onPicChange}
            textClass ={"lg:text-3xl font-semibold"}
          />}
          <article className="xs:hidden md:inline space-y-2">
            {props.loading?
            <div className="h-6 animate-pulse bg-lightGray rounded w-3/5"></div>
            :
            <div className="font-bold text-2xl ">
              {props.name || "No Name"}
            </div>}
            {props.loading?
            <div className="animate-pulse flex gap-4 justify-between  w-[40rem]">
            <div className="h-4 bg-lightGray rounded w-2/6"></div>
            <div className="h-4 bg-lightGray rounded w-4/6"></div>
            </div>
            
            :((props.department||props.position)&&<div className="">{`${props.department} ${
              props.department && props.position ? "|" : ""
            } ${props.position} `}</div>)}
            {props.loading?
            <div className="animate-pulse flex gap-4 justify-between  w-[40rem]">
            <div className="h-4 bg-lightGray rounded w-4/6"></div>
            <div className="h-4 bg-lightGray rounded w-3/6"></div>
            </div>
            
            :<div className="">
              {(props.email || "No Email") +
                " | " +
                (props.primary_number || "No Phone")}
            </div>}
            {props.loading?
            <div className="animate-pulse flex gap-4 justify-between  w-[40rem]">
            <div className="h-4 bg-lightGray rounded w-3/6"></div>
            <div className="h-4 bg-lightGray rounded w-3/6"></div>
            </div>
            
            :props.membership_type&&<div className="md:w-2/3">
              <Badge className="text-sm border-primary bg-white border text-dark900 ">
                {props.membership_type?"Online e-church family":" In-person church family"}
              </Badge>
            </div>}
          </article>
        </div>
        {props.loading?
            <div className="animate-pulse flex gap-4  bg-lightGray rounded h-6 w-1/6 ">
            </div>:!props.edit && (
          <div>
            <Button
              value="Edit Profile"
              onClick={handleClick}
              className="w-full  px-5 py-3 bg-transparent min-h-8  md:bg-white md:text-dark900"
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Banner;

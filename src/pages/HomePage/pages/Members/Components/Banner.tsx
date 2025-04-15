import { ProfilePicture } from "@/components";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
// import coverImage1 from "/src/assets/CoverImage.svg";

interface IProps {
  id: string | number;
  name?: string;
  department?: string;
  position?: string;
  email: string;
  primary_number: string;
  src: string;
  onClick: (id: string | number) => void;
  membership_type?: string;
}

const Banner = (props: IProps) => {
  const handleClick = () => {
    props.onClick(props.id);
  };
  return (
    <div className="w-full h-36 relative bg-primary text-white rounded-t-lg">
      <div
        className="p-4 rounded-t-lg left-0 w-full h-full flex items-center justify-between  bg-cover"
        style={{
          // backgroundImage: `url(${coverImage1})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="flex justify-between items-cente  container mx-auto">
          <div className="flex gap-4 items-center  ">
            <ProfilePicture
              className="w-24 h-24 outline outline-white"
              src={props.src}
              alt="cover Image"
              name={props.name}
              id="coverPic"
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
                  {props.membership_type
                    ? "Online e-church family"
                    : " In-person church family"}
                </Badge>
              </div>
            </article>
          </div>
          <div>
            <Button
              value="Edit Profile"
              onClick={handleClick}
              className="w-full  px-5 py-3 bg-transparent min-h-8  md:bg-white md:text-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;

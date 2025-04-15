import { firstLetters } from "@/utils/helperFunctions";
import { ChangeEvent } from "react";
import icon from "/src/assets/edit-2.svg";

interface IProps {
  text?: string;
  className?: string;
  textClass?: string;
  src?: string;
  alt: string;
  icon?: string;
  id?: string;
  name?: string;
  onClick?: () => void;
  onChange?: (obj: { picture: File; src: string }) => void;
  editable?: boolean;
}

export const ProfilePicture = (props: IProps) => {
  function handlePicChange(event: ChangeEvent<HTMLInputElement>) {
    const picture = event.currentTarget.files?.[0];
    if (!picture) return;

    const src = URL.createObjectURL(picture);
    const obj = {
      picture,
      src,
    };

    props.onChange?.(obj);
  }

  return (
    <div className="flex">
      <div className={`rounded-[50%] relative ${props.className}`}>
        {props.src ? (
          <img
            src={props.src}
            alt={props.alt}
            className="w-full rounded-full h-full"
            id="profile"
          />
        ) : (
          <div
            className={`w-full rounded-full h-full flex justify-center items-center ${props.textClass}`}
          >
            {firstLetters(props.name)}
          </div>
        )}
        {props.editable ? (
          <label
            className="absolute left-2/3 bottom-0 cursor-pointer"
            htmlFor={props.id}
          >
            <div className="bg-white border border-lightGray rounded-full p-1">
              <img src={props.icon || icon} alt="" />
            </div>
          </label>
        ) : null}
        <input
          type="file"
          id={props.id}
          className="hidden"
          onChange={props.onChange ? handlePicChange : undefined}
          accept="image/*"
          capture="user"
        />
      </div>
    </div>
  );
};

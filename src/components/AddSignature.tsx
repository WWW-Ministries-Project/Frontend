import { useEffect, useState } from "react";
import Button from "./Button";
import useFileUpload from "@/CustomHooks/useFileUpload";
import { isValidURL } from "@/pages/HomePage/utils/helperFunctions";

const Text = ({ text, className }: { text: string; className?: string }) => {
  return <div className={`text-primary ${className}`}>{text}</div>;
};

type Signature = {
  cancel: () => void;
  text?: string;
  handleSignature: (signature: File | string, isImage: boolean) => void;
  onSubmit: () => void;
  loading?: boolean;
  header?: string;
  defaultSignature?: string;
};
export default function AddSignature({
  cancel,
  text = "Sign",
  handleSignature,
  onSubmit,
  loading,
  header = "Request Approval Signing",
  defaultSignature,
}: Readonly<Signature>) {
  const { preview, handleFileChange, clearFile, file } = useFileUpload();
  const [signature, setSignature] = useState<string>(defaultSignature ?? "");

  useEffect(() => {
    if (file) {
      handleSignature(file, true);
      setSignature("");
    }
  }, [file]);
  return (
    <div className="p-8 flex  justify-center flex-col  w-[50vw]  gap-4 rounded-lg">
      <Text text={header} className="text-center font-semibold text-2xl" />
      <div className="flex items-center justify-between gap-2 w-full flex-col md:flex-row lg:flex-row">
        <Text text="Signature" className="font-semibold text-2xl" />
        <div className="flex items-center gap-2 flex-col md:flex-row lg:flex-row">
          <Button
            value="Draw"
            className="w-fit sm:w-full md:w-ful border border-primary text-primary p-2.5"
          />
          <div>
            <input
              type="file"
              onChange={handleFileChange}
              id="file-input"
              className="hidden"
              accept="image/png,image/jpeg"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer  p-2 flex items-center gap-2 border border-primary rounded-lg text-primary"
            >
              <svg
                width="21"
                height="19"
                viewBox="0 0 21 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5 15C11.75 15 12.8125 14.5625 13.6875 13.6875C14.5625 12.8125 15 11.75 15 10.5C15 9.25 14.5625 8.1875 13.6875 7.3125C12.8125 6.4375 11.75 6 10.5 6C9.25 6 8.1875 6.4375 7.3125 7.3125C6.4375 8.1875 6 9.25 6 10.5C6 11.75 6.4375 12.8125 7.3125 13.6875C8.1875 14.5625 9.25 15 10.5 15ZM10.5 13C9.8 13 9.20833 12.7583 8.725 12.275C8.24167 11.7917 8 11.2 8 10.5C8 9.8 8.24167 9.20833 8.725 8.725C9.20833 8.24167 9.8 8 10.5 8C11.2 8 11.7917 8.24167 12.275 8.725C12.7583 9.20833 13 9.8 13 10.5C13 11.2 12.7583 11.7917 12.275 12.275C11.7917 12.7583 11.2 13 10.5 13ZM2.5 18.5C1.95 18.5 1.47917 18.3042 1.0875 17.9125C0.695833 17.5208 0.5 17.05 0.5 16.5V4.5C0.5 3.95 0.695833 3.47917 1.0875 3.0875C1.47917 2.69583 1.95 2.5 2.5 2.5H5.65L7.5 0.5H13.5L15.35 2.5H18.5C19.05 2.5 19.5208 2.69583 19.9125 3.0875C20.3042 3.47917 20.5 3.95 20.5 4.5V16.5C20.5 17.05 20.3042 17.5208 19.9125 17.9125C19.5208 18.3042 19.05 18.5 18.5 18.5H2.5ZM2.5 16.5H18.5V4.5H14.45L12.625 2.5H8.375L6.55 4.5H2.5V16.5Z"
                  fill="#6539C3"
                />
              </svg>
              Upload
            </label>
          </div>
        </div>
      </div>

      <div className="w-full h-44 flex items-center justify-center border border-[#D8DAE5] rounded-lg">
        {preview ? (
          <div>
            <div className="mt-2 max-w-full flex items-start justify-center h-full gap-2">
              <img
                src={preview}
                alt="Preview"
                className=" max-w-full w-52 h-36 rounded-lg"
              />

              <div
                onClick={clearFile}
                className=" w-5 h-5 flex
               justify-center 
               items-center cursor-pointer
                text-red-500 rounded-full
                 bg-slate-100 hover:shadow-md "
              >
                x
              </div>
            </div>
          </div>
        ) : (
          <>
            {isValidURL(signature) ? (
              <img
                src={signature}
                alt="Preview"
                className=" max-w-full w-52 h-36 rounded-lg"
              />
            ) : (
              <Text text={signature} />
            )}
          </>
        )}
      </div>
      {/* use other reusable input component */}
      <input
        className="w-full border border-[#D8DAE5] rounded-lg p-2 outline-none"
        placeholder="Type signature here"
        value={signature}
        onChange={(e) => {
          clearFile();
          setSignature(e.target.value);
          if (e.target.value.trim()) {
            handleSignature(e.target.value.trim(), false);
          }
        }}
      />
      <Text
        text={`By clicking "${text}", you agreed to approving this request`}
        className="text-base"
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          value="Cancel"
          className="w-fit border border-primary text-primary p-2.5"
          onClick={() => {
            cancel();
          }}
        />
        <Button
          value={text}
          className="w-fit text-white bg-primary p-3"
          onClick={onSubmit}
          disabled={!(preview || signature.trim())}
          loading={loading}
        />
      </div>
    </div>
  );
}



import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { cn } from "@/utils/cn";

export interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const modules: ReactQuill.ReactQuillProps["modules"] = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

const formats: ReactQuill.ReactQuillProps["formats"] = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "image",
];

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  readOnly = false,
  className,
}) => {
  return (
    <div className={cn("rounded-md border border-gray-300", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default TextEditor;
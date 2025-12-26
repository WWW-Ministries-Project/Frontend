

import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
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
}) => {
  return (
    <div className="rounded-md border border-gray-300">
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
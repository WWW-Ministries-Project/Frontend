import { useState } from "react";

interface TextareaProps {
  label?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  value = "",
  placeholder = "Enter text...",
  rows = 4,
  cols = 50,
  disabled = false,
  onChange,
}) => {
  const [text, setText] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onChange && onChange(e.target.value);
  };

  return (
    <div className="flex flex-col">
      {label && <label className="mb-2 font-semibold">{label}</label>}
      <textarea
        className="w-full mt-1 px-1 rounded-lg border border-[#EEF2F4] py-1 placeholder:text-xs focus:outline-none"
        value={text}
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  );
};

export default Textarea;

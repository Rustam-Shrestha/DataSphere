import {
  Button,
  DangerButton,
  OutlineButton,
  PrimaryButton,
  SecondaryButton,
} from "@shared/components/Button";

import { useRef, type ChangeEvent, type ComponentType, type ReactNode } from "react";
import { CircularLoader } from "../SkletonLoader";

type FileUploadButtonProps = {
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: ReactNode;
  type?: string;
  icon?: ComponentType | ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  loading?: boolean;
};

const FileUploadButton = ({
  onFileSelect,
  label,
  type = "file",
  icon: Icon,
  iconPosition = "left",
  className = "",
  loading = false,
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const iconElement = typeof Icon === "function" ? <Icon /> : Icon || null;
  const content =
    label && iconPosition === "left" ? (
      <>
        {iconElement}
        <span className="ml-1">{label}</span>
      </>
    ) : (
      <>
        <span>{label}</span>
        {iconElement}
      </>
    );

  return (
    <div
      onClick={handleFileClick}
      title={typeof label === "string" && label.trim() ? label : "Upload file"}
      aria-label={typeof label === "string" && label.trim() ? label : "Upload file"}
      className={`cursor-pointer py-2 px-4 flex items-center text-sm font-medium text-primary border-[1px] border-[#D0D5DD] rounded-lg ${className}`}
    >
      <input
        ref={fileInputRef}
        type={type}
        className="hidden"
        aria-label={typeof label === "string" && label.trim() ? label : "File upload input"}
        onChange={onFileSelect}
      />
      {loading ? <CircularLoader variant="secondary" /> : content}
    </div>
  );
};

export {
  Button,
  DangerButton,
  OutlineButton,
  PrimaryButton,
  SecondaryButton,
  FileUploadButton,
};

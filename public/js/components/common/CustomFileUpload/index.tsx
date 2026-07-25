// @ts-nocheck
/**
 * CustomFileUpload — Memoized
 */
import React, { memo, useRef, useState } from "react";
import { CloudArrow } from "../../../assets/data/icons";

const CustomFileUpload = memo(({ onFileUpload }) => {
  const fileInputRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // To store the uploaded image preview

  const handleUploadClick = () => {
    fileInputRef.current.click(); // Trigger file input click
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new (window.FileReader || FileReader)();
      reader.onload = () => {
        setPreviewImage(reader.result); // Set the preview image
        if (onFileUpload) onFileUpload(file); // Pass the file to the parent component
      };
      reader.readAsDataURL(file); // Read the file to get the base64 data
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // Change state to indicate drag event
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // Reset state on drag leave
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // Reset state on drop

    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new (window.FileReader || FileReader)();
      reader.onload = () => {
        setPreviewImage(reader.result); // Set the preview image
        if (onFileUpload) onFileUpload(file); // Pass the dropped file to the parent component
      };
      reader.readAsDataURL(file); // Read the file to get the base64 data
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null); // Clear the preview image
  };

  return (
    <div
      className={`flex flex-col items-center justify-center border rounded-lg p-6 cursor-pointer ${
        isDragging
          ? "border-blue-500 bg-blue-100"
          : "border-gray-300 hover:border-gray-400"
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {previewImage ? (
        <div className="relative">
          <img
            src={previewImage}
            alt="Uploaded Preview"
            className="w-20 h-20 object-cover rounded-lg"
          />
          <button
            type="button"
            aria-label="Remove uploaded image"
            className="absolute top-0 right-0 bg-danger-500 text-white w-5 h-5 rounded-full flex items-center justify-center"
            onClick={handleRemoveImage}
          >
            &times;
          </button>
        </div>
      ) : (
        <div onClick={handleUploadClick} role="button" tabIndex={0} aria-label="Upload file">
          <div className="flex items-center  justify-center rounded-full mb-2">
            <CloudArrow />
          </div>
          <p className="text-primary text-sm">
            Click to upload{" "}
            <span className="text-gray-600">or drag and drop</span>
          </p>
        </div>
      )}
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        aria-label="File upload input"
      />
    </div>
  );
});

export default CustomFileUpload;

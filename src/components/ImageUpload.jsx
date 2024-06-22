// src/components/ImageUpload.js
import React, { useState } from 'react';
import cloud_upload from '../assets/cloud_upload.svg'

const ImageUpload = ({ onFileChange }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    setFile(file);
    onFileChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`flex justify-center items-center w-[20vw]  h-56 border border-dashed rounded-xl cursor-pointer focus:outline-none ${
        isDragActive ? 'border-gray-500' : 'border-gray-300'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        id="fileUpload"
      />
      <label htmlFor="fileUpload" className="flex items-center">
        {preview ? (
          <img src={preview} alt="Preview" className="object-cover p-2 rounded-xl cursor-pointer" style={{transform: 'scale(1)' }}/>
        ) : (
        //   <p className="text-gray-600 text-center">Drag 'n' drop some files here, <br/> or click to select files</p>
        <div>
                    <img className="mx-auto" src={cloud_upload} alt="" srcSet="" />
                    <div className="text-center">Click here to upload the event banner</div>
                </div>
        )}
      </label>
    </div>
  );
};

export default ImageUpload;

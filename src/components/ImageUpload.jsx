// src/components/ImageUpload.js
import cloud_upload from '../assets/cloud_upload.svg'
import useFileUpload from '@/hooks/useFileUpload';

const ImageUpload = ({ onFileChange }) => {


  const {
    isDragActive,
    file,
    preview,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileChange
  } = useFileUpload(onFileChange)
  

  return (
    <div
      className={`flex justify-center items-center md:w-[50vw] lg:w-[30vw] overflow-hidden  h-56 border border-dashed rounded-xl cursor-pointer focus:outline-none ${
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

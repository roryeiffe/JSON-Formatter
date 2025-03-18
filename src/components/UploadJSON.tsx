import React, { useState} from "react";

function UploadJSON({onFileRead}:any) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (event:any) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event:any) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files[0]; // Get the first dropped file
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          onFileRead(e.target.result);
        }
      };
      reader.readAsText(file); // Read file as text (change this if needed)
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center ${
        dragging ? "bg-gray-200" : "bg-gray-100"
      }`}
    >
      <p>Drag & drop a file here.</p>
    </div>
  );
};



export default UploadJSON;
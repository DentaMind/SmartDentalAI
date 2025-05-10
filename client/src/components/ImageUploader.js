import React from 'react';

const ImageUploader = ({ onImageUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="image-uploader">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="file-input"
      />
    </div>
  );
};

export default ImageUploader; 
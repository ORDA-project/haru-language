import React, { useState, useRef, ChangeEvent } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import StageUpload from "../Elements/StageUpload";
import StageCrop from "../Elements/StageCrop";
import StageLoading from "../Elements/StageLoading";
import StageResult from "../Elements/StageResult";
import { Example } from "../types"; // Example type definition
import NavBar from "../Templates/Navbar";

const App = () => {
  const [stage, setStage] = useState<number>(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const cropperRef = useRef<any>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setUploadedImage(imageURL);
      setStage(2); // Move to crop screen
    }
  };

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedDataURL = croppedCanvas.toDataURL("image/png");
        setCroppedImage(croppedDataURL);
        setStage(3); // Move to OCR stage
        handleGenerateExamples(croppedDataURL); // Generate examples and perform OCR
      }
    }
  };

  const handleBackToUpload = () => {
    setUploadedImage(null); // Clear uploaded image
    setStage(1); // Go back to the upload stage
  };

  const handleGenerateExamples = async (imageData: string) => {
    try {
      console.log("🔍 Starting example generation...");
      console.log("🔍 Image data type:", typeof imageData);
      console.log("🔍 Image data preview:", imageData.substring(0, 50) + "...");
      console.log("🔍 API Endpoint:", API_ENDPOINTS.example);
      
      const blob = dataURItoBlob(imageData);
      console.log("🔍 Blob created:", blob.type, blob.size, "bytes");
      
      const formData = new FormData();
      formData.append("image", blob, "cropped-image.png");

      console.log("🔍 FormData prepared, sending request...");
      const response = await axios.post(
        API_ENDPOINTS.example,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      console.log("✅ Response received:", response.data);
      const { generatedExample, audioContent } = response.data;
      setDescription(generatedExample.description);
      setExamples(generatedExample.examples);
      setStage(4); // Show result
    } catch (error) {
      console.error("❌ Error generating examples:", error);
      if (axios.isAxiosError(error)) {
        console.error("❌ Response status:", error.response?.status);
        console.error("❌ Response data:", error.response?.data);
        console.error("❌ Request config:", error.config);
      }
      setErrorMessage("Failed to generate examples.");
      setStage(1); // Reset to initial state
    }
  };

  const dataURItoBlob = (dataURI: string): Blob => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <div className="h-[calc(100vh-80px)] p-0 px-3 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        <div className="flex justify-center items-center h-full">
          {stage === 1 && <StageUpload handleFileUpload={handleFileUpload} />}
          {stage === 2 && uploadedImage && (
            <StageCrop uploadedImage={uploadedImage} cropperRef={cropperRef} handleCrop={handleCrop} handleBackToUpload={handleBackToUpload} />
          )}
          {stage === 3 && <StageLoading />}
          {stage === 4 && (
            <StageResult
              description={description}
              examples={examples}
              errorMessage={errorMessage}
              setStage={setStage}
            />
          )}
        </div>
      </div>
      <NavBar currentPage={"Example"} />
    </div>
  );
};

export default App;


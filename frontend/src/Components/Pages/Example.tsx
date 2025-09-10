import React, { useState, useRef, ChangeEvent } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import StageUpload from "../Elements/StageUpload";
import StageCrop from "../Elements/StageCrop";
import StageLoading from "../Elements/StageLoading";
import StageResult from "../Elements/StageResult";
import StageChat from "../Elements/StageChat";
import { Example } from "../types"; // Example type definition
import NavBar from "../Templates/Navbar";

const App = () => {
  const [stage, setStage] = useState<number>(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { showError, showSuccess, showWarning } = useErrorHandler();
  const cropperRef = useRef<any>(null);

  const handleFileUpload = (file: File) => {
    // 파일 형식 검사
    if (!file.type.startsWith("image/")) {
      showError("잘못된 파일 형식", "이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검사 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError(
        "파일 크기 초과",
        "이미지 파일이 너무 큽니다. (10MB 이하로 해주세요)"
      );
      return;
    }

    try {
      const imageURL = URL.createObjectURL(file);
      setUploadedImage(imageURL);
      setErrorMessage(""); // Clear any previous errors
      setStage(2); // Move to crop screen
    } catch (error) {
      showError("이미지 로드 오류", "이미지를 불러올 수 없습니다.");
      console.error("File upload error:", error);
    }
  };

  const handleCrop = () => {
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        showError(
          "자르기 오류",
          "이미지를 자를 수 없습니다. 다시 시도해주세요."
        );
        return;
      }

      const croppedCanvas = cropper.getCroppedCanvas({
        width: 800, // 최대 폭 제한
        height: 600, // 최대 높이 제한
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!croppedCanvas) {
        showError("자르기 오류", "이미지를 자를 수 없습니다.");
        return;
      }

      const croppedDataURL = croppedCanvas.toDataURL("image/jpeg", 0.8); // JPEG로 압축
      setCroppedImage(croppedDataURL);
      setStage(3); // Move to OCR stage
      handleGenerateExamples(croppedDataURL); // Generate examples and perform OCR
    } catch (error) {
      showError(
        "이미지 처리 오류",
        "이미지를 처리하는 중 오류가 발생했습니다."
      );
      console.error("Crop error:", error);
    }
  };

  const handleBackToUpload = () => {
    setUploadedImage(null); // Clear uploaded image
    setStage(1); // Go back to the upload stage
  };

  const handleAIChat = () => {
    setStage(5); // Move to AI chat stage
  };

  const handleBackFromChat = () => {
    setStage(1); // Go back to the upload stage
  };

  const handleGenerateExamples = async (imageData: string) => {
    setLoading(true);
    setErrorMessage("");

    try {
      console.log("🔍 Starting example generation...");
      console.log("🔍 Image data type:", typeof imageData);
      console.log("🔍 Image data preview:", imageData.substring(0, 50) + "...");
      console.log("🔍 API Endpoint:", API_ENDPOINTS.example);

      // 이미지 데이터 유효성 검사
      if (!imageData || !imageData.startsWith("data:image/")) {
        throw new Error("올바른 이미지 데이터가 아닙니다.");
      }

      const blob = dataURItoBlob(imageData);
      console.log("🔍 Blob created:", blob.type, blob.size, "bytes");

      if (blob.size === 0) {
        throw new Error("이미지 데이터가 비어있습니다.");
      }

      // 파일 크기 제한 (5MB)
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error("이미지 파일이 너무 큽니다. (5MB 이하로 해주세요)");
      }

      const formData = new FormData();
      formData.append("image", blob, "cropped-image.png");

      console.log("🔍 FormData prepared, sending request...");

      // 타임아웃 경고 메시지
      const timeoutId = setTimeout(() => {
        if (loading) {
          showWarning(
            "처리 중",
            "이미지 분석이 진행 중입니다. 잠시만 기다려주세요..."
          );
        }
      }, 5000); // 5초 후 알림

      const response = await axios.post(API_ENDPOINTS.example, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        timeout: 30000, // 30초 타임아웃
      });

      clearTimeout(timeoutId);
      console.log("✅ Response received:", response.data);

      if (!response.data || !response.data.generatedExample) {
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
      }

      console.log(
        "✅ Full response data:",
        JSON.stringify(response.data, null, 2)
      );

      const { generatedExample, audioContent } = response.data;
      console.log("✅ Generated example:", generatedExample);

      // Check if generatedExample has nested generatedExample structure
      const actualExample =
        generatedExample.generatedExample || generatedExample;
      console.log("✅ Actual example data:", actualExample);

      setDescription(actualExample.description || "");
      setExamples(actualExample.examples || []);

      console.log("✅ Setting description:", actualExample.description);
      console.log("✅ Setting examples:", actualExample.examples);

      showSuccess("분석 완료", "이미지에서 학습 예시를 생성했습니다!");
      setStage(4); // Show result
    } catch (error) {
      console.error("❌ Error generating examples:", error);

      if (axios.isAxiosError(error)) {
        console.error("❌ Response status:", error.response?.status);
        console.error("❌ Response data:", error.response?.data);

        if (error.code === "ECONNABORTED") {
          showError(
            "요청 시간 초과",
            "이미지 처리 시간이 초과되었습니다. 다시 시도해주세요."
          );
        } else if (error.response?.status === 413) {
          showError(
            "파일 크기 초과",
            "이미지 파일이 너무 큽니다. 좌 더 작게 잘라주세요."
          );
        } else if (error.response?.status === 400) {
          showError(
            "잘못된 요청",
            "이미지 형식이 올바르지 않습니다. 다른 이미지를 시도해주세요."
          );
        } else if (error.response?.status === 500) {
          showError(
            "서버 오류",
            "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
        } else if (!error.response) {
          showError(
            "네트워크 오류",
            "서버에 연결할 수 없습니다. CORS 오류일 수 있습니다."
          );
        } else {
          showError(
            "오류 발생",
            `예상치 못한 오류가 발생했습니다. (${error.response.status})`
          );
        }
      } else {
        showError(
          "이미지 처리 오류",
          (error as Error).message || "이미지를 처리할 수 없습니다."
        );
      }

      setErrorMessage("Failed to generate examples.");
      setStage(1); // Reset to initial state
    } finally {
      setLoading(false);
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
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {stage === 1 && (
        <StageUpload
          handleFileUpload={handleFileUpload}
          handleAIChat={handleAIChat}
        />
      )}
      {stage === 2 && uploadedImage && (
        <StageCrop
          uploadedImage={uploadedImage}
          cropperRef={cropperRef}
          handleCrop={handleCrop}
          handleBackToUpload={handleBackToUpload}
        />
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
      {stage === 5 && <StageChat onBack={handleBackFromChat} />}
      <NavBar currentPage={"Example"} />
    </div>
  );
};

export default App;

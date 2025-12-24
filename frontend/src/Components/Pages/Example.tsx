import React, { useState, useRef, useEffect, useCallback } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "axios";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { API_BASE_URL } from "../../config/api";
import StageUpload from "../Elements/StageUpload";
import StageCrop from "../Elements/StageCrop";
import StageLoading from "../Elements/StageLoading";
import StageResult from "../Elements/StageResult";
import StageChat from "../Elements/StageChat";
import { Example } from "../types";
import NavBar from "../Templates/Navbar";
import { createStorageKey, safeSetItem, safeGetItem, isTodayData } from "../../utils/storageUtils";
import { getTodayStringBy4AM } from "../../utils/dateUtils";
import { dataURItoBlob, validateImageFile, validateDataURI, MAX_IMAGE_SIZE } from "../../utils/imageUtils";
import { getAxiosErrorMessage, ERROR_MESSAGES } from "../../utils/errorMessages";

interface SavedExampleState {
  stage: number;
  croppedImage: string | null;
  examples: Example[];
  description: string;
  extractedText: string;
  timestamp: string;
  newImageSets?: Array<{
    image: string;
    description: string;
    exampleGroupIndex: number;
    timestamp: number;
  }>;
}

const App = () => {
  const [stage, setStage] = useState<number>(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [newImageSets, setNewImageSets] = useState<Array<{
    image: string;
    description: string;
    exampleGroupIndex: number;
    timestamp: number;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { showError, showSuccess, showWarning } = useErrorHandler();
  const cropperRef = useRef<any>(null);

  // 예문 생성 상태 저장
  const saveExampleState = useCallback(() => {
    if (stage === 4 && examples.length > 0) {
      const state: SavedExampleState = {
        stage: 4,
        croppedImage,
        examples,
        description,
        extractedText,
        timestamp: new Date().toISOString(),
        newImageSets: newImageSets.length > 0 ? newImageSets : undefined,
      };
      const storageKey = createStorageKey("example_generation_state");
      safeSetItem(storageKey, state);
    }
  }, [stage, examples, croppedImage, description, extractedText, newImageSets]);

  // 예문 생성 상태 불러오기
  const loadExampleState = useCallback((): SavedExampleState | null => {
    const storageKey = createStorageKey("example_generation_state");
    const saved = safeGetItem<SavedExampleState>(storageKey);
    
    if (saved && saved.timestamp && isTodayData(saved.timestamp)) {
      return saved;
    }
    
    return null;
  }, []);

  // AI 대화 상태 확인
  const hasChatMessages = useCallback((): boolean => {
    try {
      const dateKey = getTodayStringBy4AM();
      const storageKey = `stage_chat_messages_${dateKey}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const messages = JSON.parse(saved);
        // 초기 메시지만 있으면 false (실제 대화가 없음)
        return Array.isArray(messages) && messages.length > 1;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("AI 대화 상태 확인 실패:", error);
      }
    }
    return false;
  }, []);

  // 컴포넌트 마운트 시 저장된 상태 복원
  useEffect(() => {
    const savedExampleState = loadExampleState();
    const hasExample = savedExampleState && savedExampleState.stage === 4 && savedExampleState.examples.length > 0;
    const hasChat = hasChatMessages();

    if (hasExample && !hasChat) {
      // 예문만 있으면 예문 페이지로
      setStage(4);
      setCroppedImage(savedExampleState.croppedImage);
      setExamples(savedExampleState.examples);
      setDescription(savedExampleState.description);
      setExtractedText(savedExampleState.extractedText);
      if (savedExampleState.newImageSets && savedExampleState.newImageSets.length > 0) {
        setNewImageSets(savedExampleState.newImageSets);
      }
    } else if (hasChat && !hasExample) {
      // AI 대화만 있으면 대화 페이지로
      setStage(5);
    }
    // 둘 다 있거나 둘 다 없으면 stage 1 (업로드 페이지) 유지
  }, []);

  // stage, examples, description, croppedImage, newImageSets 변경 시 저장
  useEffect(() => {
    if (stage === 4 && examples.length > 0) {
      saveExampleState();
    }
  }, [stage, examples, description, croppedImage, extractedText, newImageSets, saveExampleState]);

  const handleFileUpload = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      showError("파일 업로드 오류", validation.error || "이미지 파일을 확인해주세요.");
      return;
    }

    try {
      const imageURL = URL.createObjectURL(file);
      setUploadedImage(imageURL);
      setErrorMessage("");
      setStage(2);
    } catch (error) {
      showError("이미지 로드 오류", "이미지를 불러올 수 없습니다.");
      if (import.meta.env.DEV) {
        console.error("File upload error:", error);
      }
    }
  }, [showError]);

  const handleGenerateExamples = useCallback(async (imageData: string) => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!validateDataURI(imageData)) {
        throw new Error("올바른 이미지 데이터가 아닙니다.");
      }

      const blob = dataURItoBlob(imageData);

      if (blob.size === 0) {
        throw new Error("이미지 데이터가 비어있습니다.");
      }

      if (blob.size > MAX_IMAGE_SIZE) {
        throw new Error("이미지 파일이 너무 큽니다. (5MB 이하로 해주세요)");
      }

      const formData = new FormData();
      const fileName = blob.type === "image/jpeg" ? "cropped-image.jpg" : "cropped-image.png";
      formData.append("image", blob, fileName);

      // 타임아웃 경고 메시지 (loading 상태를 ref로 추적하여 stale closure 방지)
      const loadingRef = { current: true };
      const timeoutId = setTimeout(() => {
        if (loadingRef.current) {
          showWarning(
            "처리 중",
            "이미지 분석이 진행 중입니다. 잠시만 기다려주세요..."
          );
        }
      }, 5000); // 5초 후 알림

      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await axios.post("/example", formData, {
        baseURL: API_BASE_URL,
        headers,
        withCredentials: true,
        timeout: 60000, // 60초 타임아웃 (OCR + GPT 처리 시간 고려)
      });

      clearTimeout(timeoutId);
      loadingRef.current = false;

      if (!response?.data || !response.data.generatedExample) {
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
      }

      const { generatedExample } = response.data;

      // 응답 구조: { extractedText, generatedExample: { generatedExample: { ... } } }
      // 또는: { extractedText, generatedExample: { ... } }
      let actualExample = generatedExample;
      if (generatedExample?.generatedExample) {
        actualExample = generatedExample.generatedExample;
      }

      const description = actualExample?.description || "";
      const examples = actualExample?.examples;
      const extractedTextFromResponse = response.data.extractedText || "";

      if (!examples || !Array.isArray(examples) || examples.length === 0) {
        throw new Error("생성된 예문이 없습니다. 다시 시도해주세요.");
      }

      setDescription(description);
      setExamples(examples);
      setExtractedText(extractedTextFromResponse);

      showSuccess("분석 완료", "이미지에서 학습 예시를 생성했습니다!");
      setStage(4);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const { title, message } = getAxiosErrorMessage(error);
        showError(title, message);
      } else {
        const errorMessage = error instanceof Error 
          ? error.message 
          : ERROR_MESSAGES.IMAGE_PROCESSING.PROCESS_FAILED;
        showError("이미지 처리 오류", errorMessage);
      }

      setErrorMessage("Failed to generate examples.");
      setStage(1);
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess, showWarning, loading]);

  const handleCrop = useCallback(() => {
    try {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) {
        showError("자르기 오류", "이미지를 자를 수 없습니다. 다시 시도해주세요.");
        return;
      }

      // 사용자가 선택한 영역을 그대로 가져오되, 너무 크면 리사이즈 (OCR 성능을 위해 크기 제한)
      const croppedCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "medium", // high -> medium으로 변경하여 처리 속도 개선
        maxWidth: 1200, // 1920 -> 1200으로 줄여서 처리 시간 단축
        maxHeight: 1200, // 1920 -> 1200으로 줄여서 처리 시간 단축
      });

      if (!croppedCanvas) {
        showError("자르기 오류", "이미지를 자를 수 없습니다.");
        return;
      }

      // 흰색 배경이 있는 새 canvas 생성
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = croppedCanvas.width;
      finalCanvas.height = croppedCanvas.height;
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) {
        showError("자르기 오류", "이미지를 처리할 수 없습니다.");
        return;
      }
      
      // 흰색 배경 채우기
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // 크롭된 이미지 그리기
      ctx.drawImage(croppedCanvas, 0, 0);

      // JPEG 품질을 낮춰서 파일 크기와 처리 시간 단축 (0.8 -> 0.7)
      const croppedDataURL = finalCanvas.toDataURL("image/jpeg", 0.7);
      setCroppedImage(croppedDataURL);
      setStage(3);
      handleGenerateExamples(croppedDataURL);
    } catch (error) {
      showError("이미지 처리 오류", "이미지를 처리하는 중 오류가 발생했습니다.");
      if (import.meta.env.DEV) {
        console.error("Crop error:", error);
      }
    }
  }, [showError, handleGenerateExamples]);

  const handleBackToUpload = useCallback(() => {
    setUploadedImage(null);
    setStage(1);
  }, []);

  const handleAIChat = useCallback(() => {
    setStage(5);
  }, []);

  const handleBackFromChat = useCallback(() => {
    setStage(1);
  }, []);

  const handleRestoreExample = useCallback(() => {
    const savedExampleState = loadExampleState();
    if (savedExampleState && savedExampleState.stage === 4 && savedExampleState.examples.length > 0) {
      setStage(4);
      setCroppedImage(savedExampleState.croppedImage);
      setExamples(savedExampleState.examples);
      setDescription(savedExampleState.description);
      setExtractedText(savedExampleState.extractedText);
    }
  }, [loadExampleState]);

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {stage === 1 && (
        <StageUpload
          handleFileUpload={handleFileUpload}
          handleAIChat={handleAIChat}
          hasSavedExample={(() => {
            const saved = loadExampleState();
            return !!(saved && saved.stage === 4 && saved.examples.length > 0);
          })()}
          hasSavedChat={hasChatMessages()}
          onRestoreExample={handleRestoreExample}
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
          extractedText={extractedText}
          uploadedImage={croppedImage}
          errorMessage={errorMessage}
          setStage={setStage}
          newImageSets={newImageSets}
          setNewImageSets={setNewImageSets}
          onExamplesUpdate={(newExamples) => {
            setExamples(newExamples);
          }}
        />
      )}
      {stage === 5 && <StageChat onBack={handleBackFromChat} />}
      <NavBar currentPage={"Example"} />
    </div>
  );
};

export default App;

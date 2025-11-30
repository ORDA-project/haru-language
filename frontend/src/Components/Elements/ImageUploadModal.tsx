import React, { useRef, useState } from "react";
import { Icons } from "./Icons";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
  title?: string;
}

const ImageUploadModal = ({
  isOpen,
  onClose,
  onImageSelect,
  title = "이미지 선택",
}: ImageUploadModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
      onClose();
    }
  };

  const handleCameraClick = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // 후면 카메라 우선
      });
      setStream(mediaStream);
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("카메라 접근 오류:", error);
      alert("카메라에 접근할 수 없습니다. 갤러리에서 이미지를 선택해주세요.");
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "camera-photo.jpg", {
                type: "image/jpeg",
              });
              onImageSelect(file);
              onClose();
            }
          },
          "image/jpeg",
          0.8
        );
      }
    }
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (isCameraOpen) {
        handleCloseCamera();
      } else {
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
        {!isCameraOpen ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <button
                onClick={handleCameraClick}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-[#00DAAA] hover:bg-[#00C495] text-white rounded-xl transition-colors"
              >
                <Icons.camera
                  className="w-6 h-6"
                  stroke="white"
                  strokeOpacity="1"
                />
                <span className="font-medium">카메라로 촬영</span>
              </button>

              <button
                onClick={handleGalleryClick}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-xl transition-colors"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-600"
                >
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="16"
                    y1="13"
                    x2="8"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="16"
                    y1="17"
                    x2="8"
                    y2="17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium">갤러리에서 선택</span>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              취소
            </button>
          </>
        ) : (
          <>
            {/* Camera View */}
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">사진 촬영</h2>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-900 rounded-xl object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleCloseCamera}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 bg-[#00DAAA] hover:bg-[#00C495] rounded-full flex items-center justify-center transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageUploadModal;

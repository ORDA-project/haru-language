import React from "react";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

interface StageCropProps {
  uploadedImage: string;
  cropperRef: React.RefObject<any>;
  handleCrop: () => void;
  handleBackToUpload: () => void;
}

const StageCrop = ({
  uploadedImage,
  cropperRef,
  handleCrop,
  handleBackToUpload,
}: StageCropProps) => {
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const headerTextStyle: React.CSSProperties = { fontSize: `${headerFontSize}px` };
  
  return (
  <div className="w-full flex-1 flex flex-col bg-[#F7F8FB] relative" style={{ zIndex: 1 }}>
    {/* Header */}
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <button
        onClick={handleBackToUpload}
        className="w-8 h-8 flex items-center justify-center"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <div className="text-center">
        <h1 className="font-semibold text-gray-800" style={headerTextStyle}>이미지 자르기</h1>
      </div>
      <div className="w-8"></div>
    </div>

    {/* Content */}
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      <div className="mb-4">
        <p className="font-medium text-gray-800 text-center" style={largeTextStyle}>
          어떤 문장을 기반으로 예문을 생성하고 싶으신가요?
        </p>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-0" style={{ position: 'relative', touchAction: 'none' }}>
        <style>{`
          .cropper-container {
            overflow: hidden !important;
            touch-action: none !important;
          }
          .cropper-view-box {
            outline: 2px solid #00DAAA !important;
            outline-offset: -2px;
          }
          .cropper-face {
            background-color: transparent !important;
          }
          .cropper-modal {
            background-color: rgba(0, 0, 0, 0.5) !important;
          }
          .cropper-drag-box {
            cursor: move !important;
          }
          .cropper-crop-box {
            cursor: move !important;
          }
          .cropper-point {
            cursor: pointer !important;
          }
          .cropper-point.point-se {
            cursor: nwse-resize !important;
          }
          .cropper-point.point-sw {
            cursor: nesw-resize !important;
          }
          .cropper-point.point-nw {
            cursor: nwse-resize !important;
          }
          .cropper-point.point-ne {
            cursor: nesw-resize !important;
          }
          .cropper-point.point-n {
            cursor: ns-resize !important;
          }
          .cropper-point.point-s {
            cursor: ns-resize !important;
          }
          .cropper-point.point-w {
            cursor: ew-resize !important;
          }
          .cropper-point.point-e {
            cursor: ew-resize !important;
          }
        `}</style>
        <Cropper
          src={uploadedImage}
          style={{ height: "100%", width: "100%", maxHeight: "100%", objectFit: "contain", touchAction: 'none' }}
          aspectRatio={NaN}
          guides={true}
          ref={cropperRef}
          viewMode={1}
          dragMode="move"
          autoCropArea={0.8}
          restore={false}
          modal={true}
          highlight={true}
          cropBoxMovable={true}
          cropBoxResizable={true}
          toggleDragModeOnDblclick={false}
          background={true}
          responsive={true}
          checkOrientation={false}
          zoomable={true}
          zoomOnTouch={true}
          zoomOnWheel={false}
          scalable={true}
          rotatable={false}
          minCropBoxWidth={50}
          minCropBoxHeight={50}
          ready={() => {
            if (cropperRef.current?.cropper) {
              const cropper = cropperRef.current.cropper;
              cropper.setAspectRatio(NaN);
            }
          }}
        />
      </div>

      {/* Buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={handleCrop}
          className="w-full py-4 bg-[#00DAAA] hover:bg-[#00C495] active:bg-[#00B085] text-white font-semibold rounded-full transition-colors shadow-lg"
          style={baseTextStyle}
        >
          선택 영역 예문 생성
        </button>
        <button
          onClick={handleBackToUpload}
          className="w-full py-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium rounded-full border border-gray-300 transition-colors"
          style={baseTextStyle}
        >
          다른 사진 선택하기
        </button>
      </div>
    </div>
  </div>
  );
};

export default StageCrop;

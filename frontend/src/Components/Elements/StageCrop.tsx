import React from "react";
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
}: StageCropProps) => (
  <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center overflow-hidden">
    <p className="text-2xl text-gray-800 text-lg my-7">
      어떤 문장을 기반으로 예문을 생성하고 싶으신가요?
    </p>
    <Cropper
      src={uploadedImage}
      style={{ height: 400, width: "100%", margin: "10px 0"}}
      initialAspectRatio={16 / 9}
      guides={true}
      ref={cropperRef}
    />
    <button 
      onClick={handleCrop}
      className="p-5 bg-teal-400 text-lg font-bold text-white border-none rounded cursor-pointer mt-5"
    >
      선택 영역 예문 생성
    </button>
    <button 
      onClick={handleBackToUpload}
      className="p-5 bg-teal-400 text-lg font-bold text-white border-none rounded cursor-pointer mt-5"
    >
      다른 사진 선택하기
    </button>
  </div>
);

export default StageCrop;

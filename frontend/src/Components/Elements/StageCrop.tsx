import React from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Stage, Button, Text } from "../../Styles/Example";

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
  <Stage>
    <Text style={{ fontSize: "19px", margin: "30px 0" }}>
      어떤 문장을 기반으로 예문을 생성하고 싶으신가요?
    </Text>
    <Cropper
      src={uploadedImage}
      style={{ height: 400, width: "100%", margin: "10px 0"}}
      initialAspectRatio={16 / 9}
      guides={true}
      ref={cropperRef}
    />
    <Button onClick={handleCrop}>선택 영역 예문 생성</Button>
    <Button onClick={handleBackToUpload}>다른 사진 선택하기</Button>
  </Stage>
);

export default StageCrop;

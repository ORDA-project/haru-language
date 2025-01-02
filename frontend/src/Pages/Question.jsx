import React, { useState, useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "axios";

const Question = () => {
  const [stage, setStage] = useState(1); // 단계 관리
  const [uploadedImage, setUploadedImage] = useState(null); // 업로드된 이미지 URL
  const [croppedImage, setCroppedImage] = useState(null); // 크롭된 이미지 데이터 URL
  const [examples, setExamples] = useState([]); // 생성된 예문
  const [errorMessage, setErrorMessage] = useState(""); // 에러 메시지
  const [extractedText, setExtractedText] = useState(""); // OCR 추출 텍스트
  const cropperRef = useRef(null); // Cropper 참조

  // 파일 업로드 핸들러
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setUploadedImage(imageURL);
      setStage(3); // 크롭 화면으로 이동
    }
  };

  // 크롭 완료 핸들러
  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        const croppedDataURL = croppedCanvas.toDataURL("image/png");
        setCroppedImage(croppedDataURL);
        setStage(4); // OCR 단계로 이동
        handleGenerateExamples(croppedDataURL); // OCR 및 예문 생성 호출
      }
    }
  };

  // OCR 및 예문 생성 API 호출
  const handleGenerateExamples = async (imageData) => {
    try {
      const formData = new FormData();
      formData.append("image", dataURItoBlob(imageData)); // Base64 -> Blob 변환

      const response = await axios.post(
        "http://localhost:3000/example",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // 백엔드 응답 데이터 출력
      console.log("Response Data:", response.data);

      const { extractedText, generatedExample } = response.data;
      setExtractedText(extractedText); // 추출된 텍스트 저장
      setExamples(response.data.generatedExample.examples); // 생성된 예문 저장
      setStage(5); // 결과 화면으로 이동
    } catch (error) {
      setErrorMessage("예문 생성에 실패했습니다.");
      console.error("Error generating examples:", error);
      setStage(1); // 초기화
    }
  };

  // Base64 -> Blob 변환 함수
  const dataURItoBlob = (dataURI) => {
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
    <div style={styles.container}>
      {/* 1단계: 이미지 업로드 */}
      {stage === 1 && (
        <div style={styles.stage}>
          <label htmlFor="upload" style={styles.uploadLabel}>
            <div style={styles.icon}>📷</div>
            <p>교재의 사진을 올려주세요</p>
          </label>
          <input
            id="upload"
            type="file"
            accept="image/*"
            style={styles.fileInput}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* 3단계: 크롭 화면 */}
      {stage === 3 && uploadedImage && (
        <div style={styles.stage}>
          <Cropper
            src={uploadedImage}
            style={{ height: 400, width: "100%" }}
            initialAspectRatio={16 / 9}
            guides={true}
            ref={cropperRef}
          />
          <button style={styles.button} onClick={handleCrop}>
            선택 영역 예문 생성
          </button>
        </div>
      )}

      {/* 4단계: 예문 생성 중 */}
      {stage === 4 && (
        <div style={styles.stage}>
          <p>텍스트 추출 및 예문을 만들고 있어요.</p>
          <p>잠시 기다려주세요.</p>
        </div>
      )}

      {/* 5단계: 결과 화면 */}
      {stage === 5 && (
        <div style={styles.result}>
          <h3>추출된 텍스트</h3>
          <p>{extractedText}</p>
          <h3>생성된 예문</h3>
          {examples.map((example) => (
            <div key={example.id} style={styles.example}>
              <p>
                <strong>Context:</strong> {example.context}
              </p>
              <p>
                <strong>A (English):</strong> {example.dialogue.A.english}
              </p>
              <p>
                <strong>A (Korean):</strong> {example.dialogue.A.korean}
              </p>
              <p>
                <strong>B (English):</strong> {example.dialogue.B.english}
              </p>
              <p>
                <strong>B (Korean):</strong> {example.dialogue.B.korean}
              </p>
            </div>
          ))}

          <button style={styles.button} onClick={() => setStage(1)}>
            다시 시작하기
          </button>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMessage && <p style={styles.error}>{errorMessage}</p>}
    </div>
  );
};

export default Question;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#fff",
  },
  stage: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    padding: "20px",
    border: "2px dashed #00DAAA",
    borderRadius: "10px",
    textAlign: "center",
  },
  icon: {
    fontSize: "50px",
    marginBottom: "10px",
  },
  fileInput: {
    display: "none",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#00DAAA",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "20px",
  },
  result: {
    textAlign: "center",
  },
  example: {
    marginBottom: "15px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  error: {
    color: "red",
    marginTop: "20px",
  },
};

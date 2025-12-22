/**
 * 이미지 관련 유틸리티 함수
 */

/**
 * Data URI를 Blob으로 변환
 */
export const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

/**
 * 이미지 파일 유효성 검사
 */
export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ImageValidationResult => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  if (!file.type.startsWith("image/")) {
    return {
      isValid: false,
      error: "이미지 파일만 업로드 가능합니다.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "이미지 파일이 너무 큽니다. (10MB 이하로 해주세요)",
    };
  }

  return { isValid: true };
};

/**
 * Data URI 유효성 검사
 */
export const validateDataURI = (dataURI: string): boolean => {
  return dataURI && dataURI.startsWith("data:image/");
};

/**
 * 이미지 크기 제한 (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB


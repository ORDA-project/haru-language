/**
 * 에러 메시지 상수
 */

export const ERROR_MESSAGES = {
  FILE_UPLOAD: {
    INVALID_TYPE: "이미지 파일만 업로드 가능합니다.",
    TOO_LARGE: "이미지 파일이 너무 큽니다. (10MB 이하로 해주세요)",
    LOAD_FAILED: "이미지를 불러올 수 없습니다.",
  },
  IMAGE_PROCESSING: {
    INVALID_DATA: "올바른 이미지 데이터가 아닙니다.",
    EMPTY_DATA: "이미지 데이터가 비어있습니다.",
    TOO_LARGE: "이미지 파일이 너무 큽니다. (5MB 이하로 해주세요)",
    CROP_FAILED: "이미지를 자를 수 없습니다. 다시 시도해주세요.",
    PROCESS_FAILED: "이미지를 처리하는 중 오류가 발생했습니다.",
  },
  API: {
    TIMEOUT: "이미지 처리 시간이 초과되었습니다. 다시 시도해주세요.",
    UNAUTHORIZED: "세션이 만료되었습니다. 다시 로그인해주세요.",
    FILE_TOO_LARGE: "이미지 파일이 너무 큽니다. 좀 더 작게 잘라주세요.",
    INVALID_REQUEST: "이미지 형식이 올바르지 않습니다. 다른 이미지를 시도해주세요.",
    SERVER_ERROR: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    NETWORK_ERROR: "서버에 연결할 수 없습니다. CORS 오류일 수 있습니다.",
    INVALID_RESPONSE: "서버에서 올바르지 않은 응답을 받았습니다.",
    NO_EXAMPLES: "생성된 예문이 없습니다. 다시 시도해주세요.",
  },
} as const;

/**
 * Axios 에러를 사용자 친화적인 메시지로 변환
 */
export const getAxiosErrorMessage = (error: any): { title: string; message: string } => {
  if (!error || typeof error !== 'object') {
    return {
      title: "오류 발생",
      message: "예상치 못한 오류가 발생했습니다.",
    };
  }

  // Axios 에러 처리
  if (error.code === "ECONNABORTED") {
    return {
      title: "요청 시간 초과",
      message: ERROR_MESSAGES.API.TIMEOUT,
    };
  }

  const status = error.response?.status;
  
  switch (status) {
    case 401:
      return {
        title: "로그인이 필요합니다",
        message: ERROR_MESSAGES.API.UNAUTHORIZED,
      };
    case 413:
      return {
        title: "파일 크기 초과",
        message: ERROR_MESSAGES.API.FILE_TOO_LARGE,
      };
    case 400:
      return {
        title: "잘못된 요청",
        message: ERROR_MESSAGES.API.INVALID_REQUEST,
      };
    case 500:
      return {
        title: "서버 오류",
        message: ERROR_MESSAGES.API.SERVER_ERROR,
      };
    default:
      if (!error.response) {
        return {
          title: "네트워크 오류",
          message: ERROR_MESSAGES.API.NETWORK_ERROR,
        };
      }
      return {
        title: "오류 발생",
        message: `예상치 못한 오류가 발생했습니다. (${status})`,
      };
  }
};


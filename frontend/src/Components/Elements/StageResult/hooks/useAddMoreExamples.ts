import { useState, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { Example } from "../../../../types";
import { API_ENDPOINTS, API_BASE_URL } from "../../../../config/api";
import { useErrorHandler } from "../../../../hooks/useErrorHandler";
import { dataURItoBlob, MAX_IMAGE_SIZE } from "../../../../utils/imageUtils";
import { transformApiExamplesToLocal, normalizeExampleResponse } from "../utils";

interface ExampleApiResponse {
  extractedText?: string;
  generatedExample?: {
    generatedExample?: {
      description?: string;
      examples?: Array<{
        context?: string;
        dialogue?: {
          A?: { english?: string; korean?: string };
          B?: { english?: string; korean?: string };
        };
      }>;
    };
    description?: string;
    examples?: Array<{
      context?: string;
      dialogue?: {
        A?: { english?: string; korean?: string };
        B?: { english?: string; korean?: string };
      };
    }>;
  };
}

const API_TIMEOUT = 60000;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const createFormDataFromImage = (image: string | File): FormData => {
  const formData = new FormData();
  if (typeof image === "string") {
    const blob = dataURItoBlob(image);
    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error("이미지 파일이 너무 큽니다. (5MB 이하로 해주세요)");
    }
    const fileName = blob.type === "image/jpeg" ? "cropped-image.jpg" : "cropped-image.png";
    formData.append("image", blob, fileName);
  } else {
    formData.append("image", image);
  }
  return formData;
};

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data?.message || "서버에서 오류가 발생했습니다.";

      if (status === 400) {
        return `잘못된 요청: ${message}`;
      }
      if (status === 401) {
        return "로그인이 필요합니다. 다시 로그인해주세요.";
      }
      if (status === 500) {
        return `서버 오류: ${message}`;
      }
      return message;
    }
    if (axiosError.request) {
      return "서버에 연결할 수 없습니다. 네트워크를 확인해주세요.";
    }
    if (axiosError.code === "ECONNABORTED") {
      return "요청 시간이 초과되었습니다. 다시 시도해주세요.";
    }
    return axiosError.message || "요청 중 오류가 발생했습니다.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
};

export const useAddMoreExamples = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { showError, showSuccess } = useErrorHandler();

  const generateExamplesFromImage = useCallback(
    async (image: string | File): Promise<{ examples: Example[]; description: string }> => {
      try {
        const formData = createFormDataFromImage(image);
        const headers = getAuthHeaders();

        if (import.meta.env.DEV) {
          console.log("예문 생성 요청 시작...", {
            imageType: typeof image,
            formDataKeys: Array.from(formData.keys()),
          });
        }

        const response = await axios.post<ExampleApiResponse>("/example", formData, {
          baseURL: API_BASE_URL,
          headers: {
            ...headers,
          },
          withCredentials: true,
          timeout: API_TIMEOUT,
        });

        if (import.meta.env.DEV) {
          console.log("예문 생성 응답:", response.data);
        }

        const actualExample = normalizeExampleResponse(response.data);

        if (!actualExample) {
          if (import.meta.env.DEV) {
            console.error("예문 데이터를 찾을 수 없습니다. 응답:", response.data);
          }
          throw new Error("예문 데이터를 찾을 수 없습니다.");
        }

        if (!actualExample.examples || !Array.isArray(actualExample.examples)) {
          if (import.meta.env.DEV) {
            console.error("예문 배열이 올바르지 않습니다. actualExample:", actualExample);
          }
          throw new Error("예문 배열이 올바르지 않습니다.");
        }

        if (actualExample.examples.length === 0) {
          throw new Error("생성된 예문이 없습니다.");
        }

        return {
          examples: transformApiExamplesToLocal(actualExample.examples),
          description: actualExample.description || "",
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("예문 생성 오류 상세:", error);
          if (axios.isAxiosError(error)) {
            console.error("응답 데이터:", error.response?.data);
            console.error("응답 상태:", error.response?.status);
            console.error("요청 헤더:", error.config?.headers);
          }
        }
        throw error;
      }
    },
    []
  );

  return {
    isLoadingMore,
    setIsLoadingMore,
    generateExamplesFromImage,
    showError,
    showSuccess,
    getErrorMessage,
  };
};


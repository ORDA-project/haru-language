import { usePostMutation } from "../../hooks/useQuery";
import { TTSParams, TTSResponse } from "./types";

export const useGenerateTTS = () => {
  const mutation = usePostMutation<TTSResponse, TTSParams>("/api/tts", {});

  // 개발 환경에서만 더미 데이터 처리
  if (import.meta.env.DEV) {
    const originalMutateAsync = mutation.mutateAsync;
    mutation.mutateAsync = async (params: TTSParams) => {
      try {
        return await originalMutateAsync(params);
      } catch (error) {
        // 개발 환경에서만 API 오류 시 더미 오디오 데이터 반환
        console.warn("TTS API 오류 - 개발 환경에서 더미 데이터 사용:", error);
        const dummyAudioContent =
          "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjE3AAAAAAAAAAAAAAAAJAAAAAAAAAAAAAA";
        return {
          message: "더미 데이터로 표시됩니다",
          audioContent: dummyAudioContent,
        };
      }
    };
  }

  return mutation;
};

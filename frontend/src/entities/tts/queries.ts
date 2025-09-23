import { usePostMutation } from "../../hooks/useQuery";
import { TTSParams, TTSResponse } from "./types";

export const useGenerateTTS = () => {
  const mutation = usePostMutation<TTSResponse, TTSParams>("/tts", {
    showSuccessMessage: "Generating TTS successfully",
  });

  // 더미 데이터 처리를 위한 래퍼
  const originalMutateAsync = mutation.mutateAsync;
  mutation.mutateAsync = async (params: TTSParams) => {
    try {
      return await originalMutateAsync(params);
    } catch (error) {
      // API 오류 시 더미 오디오 데이터 반환
      console.log("TTS API 오류 발생, 더미 데이터 사용");
      const dummyAudioContent =
        "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjE3AAAAAAAAAAAAAAAAJAAAAAAAAAAAAAA";
      return {
        message: "더미 데이터로 표시됩니다",
        audioContent: dummyAudioContent,
      };
    }
  };

  return mutation;
};

import { useState, useRef, useCallback } from "react";
import { useGenerateTTS } from "../../../../entities/tts/queries";
import { useErrorHandler } from "../../../../hooks/useErrorHandler";
import { MAX_RETRIES, RETRY_DELAY } from "../constants";

export const useChatTTS = () => {
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playingChatExampleId, setPlayingChatExampleId] = useState<string | null>(null);
  const ttsMutation = useGenerateTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showError } = useErrorHandler();

  const stopTTS = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
    setPlayingChatExampleId(null);
  }, []);

  const useBrowserTTS = useCallback((textToRead: string, exampleId: string) => {
    if (!('speechSynthesis' in window)) {
      showError("TTS 오류", "음성을 재생할 수 없습니다. 브라우저가 TTS를 지원하지 않습니다.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setPlayingChatExampleId(null);
      setIsPlayingTTS(false);
    };

    utterance.onerror = () => {
      setPlayingChatExampleId(null);
      setIsPlayingTTS(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [showError]);

  const playChatExampleTTS = useCallback(async (
    dialogueA: string,
    dialogueB: string,
    exampleId: string
  ) => {
    if (playingChatExampleId === exampleId && isPlayingTTS) {
      stopTTS();
      return;
    }

    if (!dialogueA || !dialogueB) {
      showError("재생 오류", "예문 데이터가 올바르지 않습니다.");
      return;
    }

    const textToRead = `${dialogueA}. ${dialogueB}`;

    stopTTS();
    setPlayingChatExampleId(exampleId);
    setIsPlayingTTS(true);

    try {
      let response = null;
      let retryCount = 0;

      while (retryCount < MAX_RETRIES && (!response || !response.audioContent)) {
        try {
          response = await ttsMutation.mutateAsync({
            text: textToRead,
            speed: 1.0,
          });

          if (response && response.audioContent) {
            break;
          }
        } catch (error) {
          console.error(`TTS API 호출 실패 (시도 ${retryCount + 1}/${MAX_RETRIES}):`, error);
        }

        retryCount++;
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }

      if (!response || !response.audioContent) {
        useBrowserTTS(textToRead, exampleId);
        return;
      }

      const audioUrl = `data:audio/mp3;base64,${response.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        if (audioRef.current === audio) {
          setPlayingChatExampleId(null);
          setIsPlayingTTS(false);
          audioRef.current = null;
        }
      };

      audio.onerror = () => {
        if (audioRef.current === audio) {
          setPlayingChatExampleId(null);
          setIsPlayingTTS(false);
          audioRef.current = null;
          useBrowserTTS(textToRead, exampleId);
        }
      };

      audio.oncanplaythrough = async () => {
        if (audioRef.current === audio && playingChatExampleId === exampleId && isPlayingTTS) {
          try {
            await audio.play();
          } catch (playError) {
            console.error("오디오 재생 오류:", playError);
            setPlayingChatExampleId(null);
            setIsPlayingTTS(false);
            audioRef.current = null;
          }
        }
      };

      audio.load();
    } catch (error) {
      console.error("TTS 요청 중 오류:", error);
      setPlayingChatExampleId(null);
      setIsPlayingTTS(false);
      showError("재생 오류", "TTS 요청 중 오류가 발생했습니다.");
    }
  }, [isPlayingTTS, playingChatExampleId, stopTTS, ttsMutation, useBrowserTTS, showError]);

  return {
    isPlayingTTS,
    playingChatExampleId,
    playChatExampleTTS,
    stopTTS,
    audioRef,
  };
};


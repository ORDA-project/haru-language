import { useState, useRef, useCallback } from "react";
import { useGenerateTTS } from "../../../../entities/tts/queries";
import { useErrorHandler } from "../../../../hooks/useErrorHandler";
import { MAX_RETRIES, RETRY_DELAY } from "../constants";

export const useChatTTS = () => {
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playingChatExampleId, setPlayingChatExampleId] = useState<string | null>(null);
  const ttsMutation = useGenerateTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingTTSRef = useRef(false);
  const playingChatExampleIdRef = useRef<string | null>(null);
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
    isPlayingTTSRef.current = false;
    playingChatExampleIdRef.current = null;
    setIsPlayingTTS(false);
    setPlayingChatExampleId(null);
  }, []);

  const playChatExampleTTS = useCallback(async (
    dialogueA: string,
    dialogueB: string,
    exampleId: string
  ) => {
    if (playingChatExampleIdRef.current === exampleId && isPlayingTTSRef.current) {
      stopTTS();
      return;
    }

    if (!dialogueA || !dialogueB) {
      showError("재생 오류", "예문 데이터가 올바르지 않습니다.");
      return;
    }

    const textToRead = `${dialogueA}. ${dialogueB}`;

    stopTTS();
    playingChatExampleIdRef.current = exampleId;
    isPlayingTTSRef.current = true;
    setPlayingChatExampleId(exampleId);
    setIsPlayingTTS(true);

    const useBrowserTTS = (text: string) => {
      if (!('speechSynthesis' in window)) {
        showError("TTS 오류", "음성을 재생할 수 없습니다. 브라우저가 TTS를 지원하지 않습니다.");
        playingChatExampleIdRef.current = null;
        isPlayingTTSRef.current = false;
        setPlayingChatExampleId(null);
        setIsPlayingTTS(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        playingChatExampleIdRef.current = null;
        isPlayingTTSRef.current = false;
        setPlayingChatExampleId(null);
        setIsPlayingTTS(false);
      };

      utterance.onerror = () => {
        playingChatExampleIdRef.current = null;
        isPlayingTTSRef.current = false;
        setPlayingChatExampleId(null);
        setIsPlayingTTS(false);
      };

      window.speechSynthesis.speak(utterance);
    };

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
        useBrowserTTS(textToRead);
        return;
      }

      const audioUrl = `data:audio/mp3;base64,${response.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        if (audioRef.current === audio) {
          playingChatExampleIdRef.current = null;
          isPlayingTTSRef.current = false;
          setPlayingChatExampleId(null);
          setIsPlayingTTS(false);
          audioRef.current = null;
        }
      };

      audio.onerror = () => {
        if (audioRef.current === audio) {
          playingChatExampleIdRef.current = null;
          isPlayingTTSRef.current = false;
          setPlayingChatExampleId(null);
          setIsPlayingTTS(false);
          audioRef.current = null;
          useBrowserTTS(textToRead);
        }
      };

      audio.oncanplaythrough = async () => {
        if (audioRef.current === audio && playingChatExampleIdRef.current === exampleId && isPlayingTTSRef.current) {
          try {
            await audio.play();
          } catch (playError) {
            console.error("오디오 재생 오류:", playError);
            playingChatExampleIdRef.current = null;
            isPlayingTTSRef.current = false;
            setPlayingChatExampleId(null);
            setIsPlayingTTS(false);
            audioRef.current = null;
            useBrowserTTS(textToRead);
          }
        }
      };

      audio.load();
    } catch (error) {
      console.error("TTS 요청 중 오류:", error);
      playingChatExampleIdRef.current = null;
      isPlayingTTSRef.current = false;
      setPlayingChatExampleId(null);
      setIsPlayingTTS(false);
      useBrowserTTS(textToRead);
    }
  }, [stopTTS, ttsMutation, showError]);

  return {
    isPlayingTTS,
    playingChatExampleId,
    playChatExampleTTS,
    stopTTS,
    audioRef,
  };
};


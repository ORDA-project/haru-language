import { useState, useRef, useCallback } from "react";
import { useGenerateTTS } from "../../../entities/tts/queries";
import { useErrorHandler } from "../../../hooks/useErrorHandler";
import { MAX_RETRIES, RETRY_DELAY } from "../constants";
import type { ExampleRecord, ExampleDialogue, ExampleItem } from "../types";

export const useTTS = () => {
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [currentPlayingExampleId, setCurrentPlayingExampleId] = useState<number | null>(null);
  const ttsMutation = useGenerateTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showWarning, showError } = useErrorHandler();

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
    setCurrentPlayingExampleId(null);
  }, []);

  const useBrowserTTS = useCallback((textToRead: string) => {
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
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
    };

    utterance.onerror = () => {
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [showError]);

  const playTTS = useCallback(async (
    example: ExampleRecord,
    currentItemIndex: number
  ): Promise<void> => {
    if (isPlayingTTS && currentPlayingExampleId === example.id) {
      stopTTS();
      return;
    }

    stopTTS();

    try {
      setIsPlayingTTS(true);
      setCurrentPlayingExampleId(example.id);

      let textToRead = "";
      if (example.exampleItems && example.exampleItems.length > 0) {
        const currentItem = example.exampleItems[currentItemIndex];
        if (currentItem && currentItem.dialogues && currentItem.dialogues.length > 0) {
          const englishTexts: string[] = [];
          currentItem.dialogues.forEach((dialogue: ExampleDialogue) => {
            if (dialogue && dialogue.english) {
              englishTexts.push(dialogue.english);
            }
          });
          textToRead = englishTexts.join(". ");
        }
      }

      if (!textToRead || textToRead.trim() === "") {
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
        showWarning("재생할 예문이 없습니다", "예문을 불러올 수 없습니다.");
        return;
      }

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
        setIsPlayingTTS(false);
        setCurrentPlayingExampleId(null);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.onerror = () => {
        useBrowserTTS(textToRead);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };

      audio.oncanplaythrough = async () => {
        try {
          await audio.play();
        } catch (playError) {
          console.error("오디오 재생 시작 실패:", playError);
          useBrowserTTS(textToRead);
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        }
      };

      audio.load();
    } catch (error) {
      console.error("TTS 재생 오류:", error);
      setIsPlayingTTS(false);
      setCurrentPlayingExampleId(null);
      showError("TTS 오류", "음성 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
      if (audioRef.current) {
        audioRef.current = null;
      }
    }
  }, [isPlayingTTS, currentPlayingExampleId, stopTTS, ttsMutation, useBrowserTTS, showWarning, showError]);

  return {
    isPlayingTTS,
    currentPlayingExampleId,
    playTTS,
    stopTTS,
  };
};


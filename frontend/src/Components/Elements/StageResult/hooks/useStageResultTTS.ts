import { useState, useRef, useCallback, useEffect } from "react";
import { API_ENDPOINTS } from "../../../../config/api";
import { Example } from "../../../../types";

export const useStageResultTTS = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);
  const playingExampleIdRef = useRef<string | null>(null);
  const isPlayingTTSRef = useRef<boolean>(false);

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, [stopCurrentAudio]);

  const playDialogueSequence = useCallback(
    async (dialogueA: string, dialogueB: string, exampleId: string) => {
      const playSingleDialogue = async (text: string, currentExampleId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          fetch(API_ENDPOINTS.tts, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
            credentials: "include",
          })
            .then((res) => {
              if (!res.ok) throw new Error("TTS 요청에 실패했습니다.");
              return res.json();
            })
            .then(({ audioContent }) => {
              const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
              audioRef.current = audio;

              const cleanup = () => {
                if (audioRef.current === audio) {
                  audioRef.current = null;
                }
              };

              audio.onended = () => {
                resolve();
                cleanup();
              };

              audio.onerror = () => {
                reject(new Error("오디오 재생 실패"));
                cleanup();
              };

              audio.oncanplaythrough = async () => {
                if (
                  audioRef.current === audio &&
                  playingExampleIdRef.current === currentExampleId &&
                  isPlayingTTSRef.current
                ) {
                  try {
                    await audio.play();
                  } catch (playError) {
                    reject(playError);
                  }
                } else if (audioRef.current === audio) {
                  audio.pause();
                  audio.currentTime = 0;
                  audioRef.current = null;
                  reject(new Error("재생이 취소되었습니다."));
                }
              };

              audio.load();
            })
            .catch(reject);
        });
      };

      try {
        await playSingleDialogue(dialogueA, exampleId);
        if (playingExampleIdRef.current !== exampleId || !isPlayingTTSRef.current) {
          return;
        }
        await playSingleDialogue(dialogueB, exampleId);
        if (playingExampleIdRef.current === exampleId) {
          playingExampleIdRef.current = null;
          isPlayingTTSRef.current = false;
          setIsPlayingTTS(false);
          setPlayingExampleId(null);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("TTS 오류:", error);
        }
        stopCurrentAudio();
        playingExampleIdRef.current = null;
        isPlayingTTSRef.current = false;
        setIsPlayingTTS(false);
        setPlayingExampleId(null);
      }
    },
    [stopCurrentAudio]
  );

  const handlePlayExample = useCallback(
    (example: Example) => {
      if (playingExampleId === example.id) {
        stopCurrentAudio();
        playingExampleIdRef.current = null;
        isPlayingTTSRef.current = false;
        setPlayingExampleId(null);
        setIsPlayingTTS(false);
        return;
      }

      if (!example?.dialogue?.A?.english || !example?.dialogue?.B?.english) {
        return;
      }

      const dialogueA = example.dialogue.A.english;
      const dialogueB = example.dialogue.B.english;

      stopCurrentAudio();
      playingExampleIdRef.current = example.id;
      isPlayingTTSRef.current = true;
      setPlayingExampleId(example.id);
      setIsPlayingTTS(true);
      playDialogueSequence(dialogueA, dialogueB, example.id);
    },
    [playingExampleId, stopCurrentAudio, playDialogueSequence]
  );

  return {
    isPlayingTTS,
    playingExampleId,
    handlePlayExample,
  };
};


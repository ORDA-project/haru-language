import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { userAtom } from "../../store/authStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";
import NavBar from "../Templates/Navbar";
import Mike from "../../Images/mike.png";
import Send from "../../Images/sendicon.png";
import { useGenerateTTS } from "../../entities/tts/queries";
import { getTodayStringBy4AM } from "../../utils/dateUtils";

const ChatBot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<
    { type: "user" | "bot"; content: string; timestamp?: Date }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [fontSize, setFontSize] = useState(18); // 기본 폰트 크기
  const [userName, setUserName] = useState("사용자");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const { showError, showWarning, showInfo } = useErrorHandler();
  const ttsMutation = useGenerateTTS();
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [user] = useAtom(userAtom);

  // 대화 내역 저장/불러오기 - 사용자별로 구분
  const getStorageKey = () => {
    const dateKey = getTodayStringBy4AM();
    if (user?.userId) {
      return `chat_messages_${user.userId}_${dateKey}`;
    }
    return `chat_messages_guest_${dateKey}`;
  };

  const saveMessages = (msgs: typeof messages) => {
    if (!user?.userId) return; // 로그인하지 않은 경우 저장하지 않음
    
    try {
      const storageKey = getStorageKey();
      const messagesToSave = msgs.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? msg.timestamp.toISOString() : new Date().toISOString()
      }));
      localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error("대화 내역 저장 실패:", error);
    }
  };

  const loadMessages = () => {
    if (!user?.userId) return null; // 로그인하지 않은 경우 로드하지 않음
    
    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
      }
    } catch (error) {
      console.error("대화 내역 불러오기 실패:", error);
    }
    return null;
  };
  
  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };
  const smallTextStyle: React.CSSProperties = { fontSize: `${smallFontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const };

  // 로그인 체크 - useEffect에서 navigate 대신 window.location 사용 (렌더링 중 업데이트 방지)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if ((!user || !user.userId) && !token) {
      // navigate 대신 window.location 사용하여 렌더링 중 업데이트 방지
      window.location.href = '/';
      return;
    }
  }, [user]);

  useEffect(() => {
    // 로그인하지 않은 경우 메시지 초기화
    const token = localStorage.getItem("accessToken");
    if ((!user || !user.userId) && !token) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // 저장된 대화 내역 불러오기 (사용자별)
        const savedMessages = loadMessages();
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages);
          setLoading(false);
          return;
        }

        // Home 페이지와 동일한 API 요청 (http 유틸리티 사용)
        const response = await http.get<{
          result: boolean;
          userData: {
            userId: number;
            name: string;
            visitCount: number;
            mostVisitedDay: string;
            recommendation: string;
          };
        }>("/home");


        if (response && response.userData) {
          // 사용자 이름 가져오기
          const fetchedUserName = response.userData?.name || "사용자";
          setUserName(fetchedUserName);

          // 초기 메시지 설정
          const initialMessages = [
            {
              type: "bot" as const,
              content: `안녕하세요, ${fetchedUserName}님! 학습 관련 도움이 필요하신가요?😊`,
              timestamp: new Date(),
            },
          ];
          setMessages(initialMessages);
          saveMessages(initialMessages);
        } else {
          throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
        }
      } catch (error: any) {
        console.error("사용자 데이터를 불러오는 데 실패했습니다:", error);

        if (error?.status === 0) {
          showError("네트워크 오류", "서버에 연결할 수 없습니다.");
        } else if (error?.status === 401) {
          // 인증 실패 시 로그인 페이지로 리다이렉트
          localStorage.removeItem("accessToken");
          window.location.href = '/';
          return;
        } else if (error?.status === 500) {
          showError("서버 오류", "서버에서 오류가 발생했습니다.");
        }

        const initialMessages = [
          {
            type: "bot" as const,
            content: "안녕하세요! 학습 관련 도움이 필요하신가요?",
            timestamp: new Date(),
          },
        ];
        setMessages(initialMessages);
        saveMessages(initialMessages);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.userId]); // showError는 함수이므로 dependency에서 제거

  const handleSend = async () => {
    if (!userInput.trim()) return;

    if (sendingMessage) {
      showWarning("처리 중", "이전 메시지가 처리되는 동안 기다려주세요.");
      return;
    }

    const currentInput = userInput.trim();
    setUserInput("");
    setSendingMessage(true);
    const userMessage = { type: "user" as const, content: currentInput, timestamp: new Date() };
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      saveMessages(updated);
      return updated;
    });

    try {
      const timeoutId = setTimeout(() => {
        if (sendingMessage) {
          showInfo("처리 중", "AI가 답변을 생성하고 있습니다...");
        }
      }, 3000); // 3초 후 알림

      // http 유틸리티 사용 (JWT 토큰 자동 포함)
      const response = await http.post<{
        answer: string | { answer: string };
      }>("/question", {
        json: { question: currentInput },
      });

      clearTimeout(timeoutId);

      if (!response || !response.answer) {
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
      }

      const botResponse = typeof response.answer === 'string' 
        ? response.answer 
        : response.answer.answer;

      if (!botResponse || typeof botResponse !== "string") {
        throw new Error("AI 응답이 올바르지 않습니다.");
      }

      const botMessage = { type: "bot" as const, content: botResponse, timestamp: new Date() };
      setMessages((prev) => {
        const updated = [...prev, botMessage];
        saveMessages(updated);
        return updated;
      });
    } catch (error: any) {
      console.error("Error during request:", error);

      let errorMessage = "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.";

      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        if (error.code === "ECONNABORTED") {
          errorMessage = "응답 시간이 초과되었습니다. 다시 시도해주세요.";
          showError(
            "응답 시간 초과",
            "질문이 복잡하여 처리 시간이 오래 걸렸습니다."
          );
        } else if (error.response?.status === 429) {
          errorMessage =
            "너무 많은 요청을 보내셨습니다. 잠시 후 다시 시도해주세요.";
          showError("요청 제한", "잠시 후 다시 질문해주세요.");
        } else if (error.response?.status === 500) {
          errorMessage =
            "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          showError("서버 오류", "서버에서 일시적인 오류가 발생했습니다.");
        } else if (!error.response) {
          errorMessage = "네트워크 연결을 확인해주세요.";
          showError("네트워크 오류", "서버에 연결할 수 없습니다.");
        } else {
          errorMessage =
            error.response?.data?.message || "알 수 없는 오류가 발생했습니다.";
          showError("오류 발생", errorMessage);
        }
      } else {
        showError(
          "예상치 못한 오류",
          error.message || "알 수 없는 오류가 발생했습니다."
        );
      }

      const errorBotMessage = { type: "bot" as const, content: errorMessage, timestamp: new Date() };
      setMessages((prev) => {
        const updated = [...prev, errorBotMessage];
        saveMessages(updated);
        return updated;
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
  };

  const handleMicClick = async () => {
    // 마지막 봇 메시지를 찾아서 TTS로 읽어주기
    const lastBotMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.type === "bot");

    if (!lastBotMessage) {
      showWarning("알림", "읽을 메시지가 없습니다.");
      return;
    }

    try {
      setIsPlayingTTS(true);

      // 마크다운 태그 제거 (간단한 정규식으로)
      const cleanText = lastBotMessage.content
        .replace(/#{1,6}\s+/g, "") // 헤더 태그 제거
        .replace(/\*\*(.*?)\*\*/g, "$1") // 볼드 태그 제거
        .replace(/\*(.*?)\*/g, "$1") // 이탤릭 태그 제거
        .replace(/`(.*?)`/g, "$1") // 인라인 코드 태그 제거
        .replace(/```[\s\S]*?```/g, "") // 코드 블록 제거
        .replace(/\[(.*?)\]\(.*?\)/g, "$1") // 링크 텍스트만 남기기
        .replace(/\n+/g, " ") // 줄바꿈을 공백으로
        .trim();

      if (!cleanText) {
        showWarning("알림", "읽을 수 있는 텍스트가 없습니다.");
        return;
      }

      // TTS API 호출
      const response = await ttsMutation.mutateAsync({
        text: cleanText,
        speed: 1.0,
      });

      // Base64 오디오 데이터를 Blob으로 변환
      const audioBlob = new Blob(
        [Uint8Array.from(atob(response.audioContent), (c) => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      );

      // 오디오 URL 생성 및 재생
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlayingTTS(false);
        URL.revokeObjectURL(audioUrl); // 메모리 정리
      };

      audio.onerror = () => {
        console.error("오디오 재생 실패");
        setIsPlayingTTS(false);
        URL.revokeObjectURL(audioUrl);
        showError("재생 오류", "음성 재생에 실패했습니다.");
      };

      await audio.play();
    } catch (error) {
      console.error("TTS 재생 실패:", error);
      setIsPlayingTTS(false);
      showError("TTS 오류", "음성 변환에 실패했습니다.");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <div className="h-[calc(100vh-72px)] w-full max-w-[440px] box-border mx-auto flex flex-col justify-end bg-gray-100">
        <div className="flex items-center justify-center mb-5 pt-2">
          <label className="font-bold mr-2" style={baseTextStyle}>폰트 크기</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleFontSizeChange(14)}
              className="px-3 py-2 border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-50 active:bg-gray-200 active:shadow-inner cursor-pointer"
              style={smallTextStyle}
            >
              작게
            </button>
            <button
              onClick={() => handleFontSizeChange(18)}
              className="px-3 py-2 border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-50 active:bg-gray-200 active:shadow-inner cursor-pointer"
              style={smallTextStyle}
            >
              중간
            </button>
            <button
              onClick={() => handleFontSizeChange(22)}
              className="px-3 py-2 border border-gray-300 rounded bg-white shadow-sm hover:bg-gray-50 active:bg-gray-200 active:shadow-inner cursor-pointer"
              style={smallTextStyle}
            >
              크게
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 pb-[72px] flex flex-col gap-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[70%] p-4 my-1 rounded-lg relative shadow-md font-bold leading-relaxed ${
                msg.type === "user"
                  ? "bg-teal-400 text-white self-end"
                  : "bg-white text-gray-800 self-start"
              } ${
                msg.type === "user"
                  ? "after:content-[''] after:absolute after:top-2 after:-right-2 after:border-l-[10px] after:border-l-teal-400 after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-transparent"
                  : "after:content-[''] after:absolute after:top-2 after:-left-2 after:border-r-[10px] after:border-r-white after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-transparent"
              }`}
              style={{ fontSize: `${isLargeTextMode ? Math.max(fontSize, baseFontSize) : fontSize}px`, wordBreak: 'keep-all', overflowWrap: 'break-word' as const }}
            >
              {msg.type === "bot" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center p-1 bg-white border-t border-gray-300 w-full box-border shadow-inner">
          <button
            onClick={handleMicClick}
            disabled={isPlayingTTS || ttsMutation.isPending}
            className={`border-none rounded-full w-10 h-10 flex justify-center items-center cursor-pointer ${
              isPlayingTTS || ttsMutation.isPending
                ? "bg-teal-500 opacity-50"
                : "bg-gray-400 hover:bg-teal-500"
            }`}
          >
            <img src={Mike} alt="마이크" className="w-7 h-7" />
          </button>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="내용을 입력하세요."
            className="flex-1 p-2 border border-gray-300 rounded-full mx-4"
            style={baseTextStyle}
          />
          <button
            onClick={handleSend}
            className="bg-teal-400 text-white border-none rounded-full w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-teal-500"
          >
            <img src={Send} alt="전송" className="ml-0.5 w-12 h-12" />
          </button>
        </div>
      </div>
      <NavBar currentPage={"Question"} />
    </div>
  );
};

export default ChatBot;

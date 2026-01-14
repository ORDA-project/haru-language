import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // React Router로 홈 이동
import NavBar from "../Templates/Navbar";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { Spinner } from "basic-loading";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { userAtom } from "../../store/authStore";
import {
  QuizQuestion,
  setCurrentQuizAtom,
  setQuizLoadingAtom,
  addQuizResultAtom,
  currentQuizAtom,
  isQuizLoadingAtom,
} from "../../store/dataStore";

interface QuizProps {}

// QuizQuestion 타입은 dataStore에서 import
type Question = QuizQuestion;

const Quiz = (props: QuizProps) => {
  const navigate = useNavigate(); // 페이지 이동을 위한 네비게이트
  const { showError, showWarning, showSuccess } = useErrorHandler();
  
  // 전역 상태 관리
  const [currentQuiz] = useAtom(currentQuizAtom);
  const [isLoading] = useAtom(isQuizLoadingAtom);
  const [, setCurrentQuizData] = useAtom(setCurrentQuizAtom);
  const [, setQuizLoading] = useAtom(setQuizLoadingAtom);
  const [, addQuizResult] = useAtom(addQuizResultAtom);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const [user] = useAtom(userAtom);

  // 로그인 체크
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if ((!user || !user.userId) && !token) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // 로컬 상태
  const [isSuccess, setSuccess] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0); // 현재 문제 인덱스
  const [selectedAnswer, setSelectedAnswer] = useState<"O" | "X" | null>(null); // 선택한 답
  const [correctCount, setCorrectCount] = useState(0); // 맞은 문제 개수
  const [showDescription, setShowDescription] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
  
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  
  const baseTextStyle: React.CSSProperties = { fontSize: `${baseFontSize}px` };
  const largeTextStyle: React.CSSProperties = { fontSize: `${largeFontSize}px` };

  // 현재 퀴즈 데이터 (전역 상태에서 가져옴)
  const quiz = currentQuiz || [];

  useEffect(() => {
    const loadQuiz = async () => {
      setQuizLoading(true);

      try {
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            showWarning(
              "문제 생성 중",
              "문제를 만들고 있습니다. 잠시만 기다려주세요..."
            );
          }
        }, 3000); // 3초 후 알림

        const response = await axios({
          method: "POST",
          url: API_ENDPOINTS.quiz,
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 20000, // 20초 타임아웃
        });

        clearTimeout(timeoutId);

        if (!response.data) {
          throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
        }

        if (!response.data.success) {
          setSuccess(false);
          const errorMsg =
            response.data.message || "문제를 불러올 수 없습니다.";
          setMessage(errorMsg);
          showError("문제 로드 실패", errorMsg);
        } else {
          const quizData: Question[] = response.data.quiz; // API에서 받아온 데이터를 설정

          if (!quizData || quizData.length === 0) {
            throw new Error("생성된 문제가 없습니다.");
          }

          setCurrentQuizData(quizData);
          showSuccess(
            "문제 로드 완료",
            `${quizData.length}개의 문제가 준비되었습니다!`
          );
        }
      } catch (error: any) {
        console.error("Quiz loading error:", error);
        setSuccess(false);

        let errorMessage = "문제를 불러오는 중 오류가 발생했습니다.";

        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            errorMessage =
              "문제 생성 시간이 초과되었습니다. 다시 시도해주세요.";
            showError("시간 초과", "문제 생성에 시간이 오래 걸리고 있습니다.");
          } else if (error.response?.status === 429) {
            errorMessage =
              "너무 많은 요청을 보내셨습니다. 잠시 후 다시 시도해주세요.";
            showError("요청 제한", "잠시 후 다시 시도해주세요.");
          } else if (error.response?.status === 500) {
            errorMessage =
              "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
            showError("서버 오류", "서버에서 일시적인 오류가 발생했습니다.");
          } else if (!error.response) {
            errorMessage = "네트워크 연결을 확인해주세요.";
            showError("네트워크 오류", "서버에 연결할 수 없습니다.");
          } else {
            errorMessage =
              error.response?.data?.message ||
              "알 수 없는 오류가 발생했습니다.";
            showError("오류 발생", errorMessage);
          }
        } else {
          errorMessage = error.message || "예상치 못한 오류가 발생했습니다.";
          showError("예상치 못한 오류", errorMessage);
        }

        setMessage(errorMessage);
      } finally {
        setQuizLoading(false);
      }
    };

    loadQuiz();
  }, [
    showError,
    showWarning,
    showSuccess,
    setCurrentQuizData,
    setQuizLoading,
    isLoading,
  ]);

  const handleAnswer = (answer: "O" | "X") => {
    setSelectedAnswer(answer); // 선택한 답 설정
    if (answer === quiz[currentIndex].answer) {
      setCorrectCount((prev) => prev + 1); // 정답 개수 증가
    }

    setTimeout(() => {
      setShowDescription(true); // 1초 뒤에 설명 표시
    }, 500);
  };

  const handleNext = () => {
    if (currentIndex + 1 < quiz.length) {
      setSelectedAnswer(null); // 선택한 답 초기화
      setShowDescription(false); // 설명 초기화
      setCurrentIndex((prev) => prev + 1); // 다음 문제로 이동
    } else {
      setShowPopup(true); // 모든 문제를 푼 경우 팝업 표시
    }
  };

  const handleClosePopup = () => {
    // 퀴즈 결과를 전역 상태에 저장
    if (quiz.length > 0) {
      addQuizResult({
        questions: quiz,
        correctCount,
        totalCount: quiz.length,
      });
    }

    setShowPopup(false); // 팝업 닫기
    navigate("/home"); // 홈 페이지로 이동
  };

  if (isSuccess && quiz.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
        <div className="h-[calc(100vh-72px)] w-full max-w-[440px] box-border mx-auto flex flex-col items-center justify-center overflow-hidden">
          <span className="my-[10px]" style={largeTextStyle}>문제을 만들고 있어요.</span>
          <span className="my-[10px]" style={largeTextStyle}>잠시 기다려주세요.</span>
          <Spinner
            option={{
              size: 50,
              bgColor: "#00daaa",
              barColor: "rgba(0, 218, 171, 0.44)",
            }}
          />
        </div>
        <NavBar currentPage={"quiz"} />
      </div>
    );
  } // 로딩 중 처리

  const currentQuestion = quiz[currentIndex]; // 현재 문제

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      {isSuccess ? (
        <div className="h-[calc(100vh-152px)] w-full max-w-[440px] box-border mx-auto flex flex-col items-center justify-around overflow-y-scroll pb-[72px]">
          <div className="relative w-[293px] p-[20px] m-[100px_10px_10px_10px] rounded-[13px] bg-[#f6f6f6] shadow-[4px_0px_7px_2px_rgba(0,0,0,0.1)] text-start break-all after:content-[''] after:absolute after:bottom-1/2 after:right-full after:w-0 after:h-0 after:border-l-[20px] after:border-l-transparent after:border-t-[10px] after:border-t-transparent after:border-b-[10px] after:border-b-transparent after:border-r-[20px] after:border-r-[#f6f6f6]">
            <p>{currentQuestion.question}</p>
          </div>
          <div className="flex flex-row">
            <button
              className={`w-[120px] h-[120px] rounded-[10.4px] shadow-[3.2px_0px_5.6px_1.6px_rgba(0,0,0,0.1)] flex justify-center items-center border-0 m-[20px] cursor-pointer disabled:cursor-not-allowed ${
                selectedAnswer === "O" && currentQuestion.answer === "O"
                  ? "bg-[#00daaa]"
                  : selectedAnswer === "O" && currentQuestion.answer !== "O"
                  ? "bg-[#F6A6A6]"
                  : "bg-[#F6F6F6]"
              }`}
              onClick={() => handleAnswer("O")}
              disabled={selectedAnswer !== null}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="96"
                height="96"
                viewBox="0 0 96 96"
                fill="none"
              >
                <circle
                  cx="48"
                  cy="48"
                  r="45.2"
                  stroke="black"
                  strokeWidth="5.6"
                />
              </svg>
            </button>
            <button
              className={`w-[120px] h-[120px] rounded-[10.4px] shadow-[3.2px_0px_5.6px_1.6px_rgba(0,0,0,0.1)] flex justify-center items-center border-0 m-[20px] cursor-pointer disabled:cursor-not-allowed ${
                selectedAnswer === "X" && currentQuestion.answer === "X"
                  ? "bg-[#00daaa]"
                  : selectedAnswer === "X" && currentQuestion.answer !== "X"
                  ? "bg-[#F6A6A6]"
                  : "bg-[#F6F6F6]"
              }`}
              onClick={() => handleAnswer("X")}
              disabled={selectedAnswer !== null}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="90"
                height="90"
                viewBox="0 0 90 90"
                fill="none"
              >
                <path
                  d="M3.39999 3.3999L86.6 86.5999"
                  stroke="black"
                  strokeWidth="5.91269"
                  strokeLinecap="round"
                />
                <path
                  d="M86.6 3.3999L3.4 86.5999"
                  stroke="black"
                  strokeWidth="5.91269"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {showDescription && (
            <div className="m-[20px] p-[10px] bg-[#f0f0f0] rounded-[8px] shadow-[2px_2px_6px_rgba(0,0,0,0.1)] text-center" style={baseTextStyle}>
              {currentQuestion.description}
            </div>
          )}
          <button
            className={`rounded-[10px] w-[166px] p-[15px_0px] text-center border-0 m-[50px_0] cursor-pointer ${
              selectedAnswer === null
                ? "bg-[#f6f6f6] cursor-not-allowed"
                : "bg-[#00daaa]"
            }`}
            onClick={handleNext}
            disabled={selectedAnswer === null}
            style={baseTextStyle}
          >
            다음
          </button>
        </div>
      ) : (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-[250px] h-[150px] p-[20px] rounded-[10px] text-center shadow-[0px_4px_10px_rgba(0,0,0,0.2)]">
            <p style={baseTextStyle}>퀴즈를 생성할 예문이 부족합니다.</p>
            <p style={baseTextStyle}>예문 생성 후에 다시 시도하세요.</p>
            <button
              className="mt-[20px] p-[10px_20px] bg-[#00daaa] border-none rounded-[5px] cursor-pointer hover:bg-[#c9c9c9]"
              onClick={handleClosePopup}
              style={baseTextStyle}
            >
              확인
            </button>
          </div>
        </div>
      )}
      <NavBar currentPage={"quiz"} />
      {showPopup && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white w-[250px] h-[150px] p-[20px] rounded-[10px] text-center shadow-[0px_4px_10px_rgba(0,0,0,0.2)]">
            <p style={baseTextStyle}>맞은 개수: {correctCount}</p>
            <p style={baseTextStyle}>틀린 개수: {quiz.length - correctCount}</p>
            <button
              className="mt-[20px] p-[10px_20px] bg-[#00daaa] border-none rounded-[5px] cursor-pointer hover:bg-[#c9c9c9]"
              onClick={handleClosePopup}
              style={baseTextStyle}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;

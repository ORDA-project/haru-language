import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { userAtom, setOnboardedAtom } from "../../store/authStore";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { http } from "../../utils/http";
import NavBar from "../Templates/Navbar";

interface UserProfileEditProps {}

export default function UserProfileEdit({}: UserProfileEditProps) {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [, setOnboarded] = useAtom(setOnboardedAtom);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const { showSuccess, showError, handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  // 큰글씨 모드에 따른 텍스트 크기 (다른 페이지와 동일하게)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const headerFontSize = isLargeTextMode ? 22 : 18;
  
  const baseTextStyle: React.CSSProperties = {
    fontSize: `${baseFontSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };
  const headerTextStyle: React.CSSProperties = {
    fontSize: `${headerFontSize}px`,
    wordBreak: 'keep-all',
    overflowWrap: 'break-word' as const
  };

  const [formData, setFormData] = useState({
    gender: "",
    goal: "",
    interests: [] as string[],
    books: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(true);

  // 기존 사용자 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = await http.get<{
          gender?: string;
          goal?: string;
          interests?: string[];
          books?: string[];
        }>("/userDetails/info");

        setFormData({
          gender: userInfo.gender || "",
          goal: userInfo.goal || "",
          interests: userInfo.interests || [],
          books: userInfo.books || [],
        });
      } catch (error) {
        console.error("Failed to load user info:", error);
        // 에러가 발생해도 계속 진행 (새로운 사용자일 수 있음)
      } finally {
        setIsLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  const genderOptions = [
    { label: "여성", value: "female" },
    { label: "남성", value: "male" },
    { label: "비공개", value: "private" },
  ];

  const goalOptions = [
    { label: "취미", value: "hobby" },
    { label: "수능 등 시험", value: "exam" },
    { label: "비즈니스", value: "business" },
    { label: "여행", value: "travel" },
  ];

  const interestOptions = [
    { label: "회화", value: "conversation" },
    { label: "독해", value: "reading" },
    { label: "문법분석", value: "grammar" },
    { label: "비즈니스", value: "business" },
    { label: "어휘", value: "vocabulary" },
  ];

  const bookOptions = [
    { label: "없음", value: "none" },
    { label: "여행회화", value: "travel" },
    { label: "일상회화", value: "daily" },
    { label: "영문소설", value: "novel" },
    { label: "중고등 교과서", value: "textbook" },
  ];

  const handleSelect = (field: string, value: string, label: string) => {
    if (field === "interests" || field === "books") {
      const currentValues = formData[
        field as keyof typeof formData
      ] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      setFormData((prev) => ({
        ...prev,
        [field]: newValues,
      }));
    } else {
      // 이미 같은 값이 선택되어 있으면 무시
      if (formData[field as keyof typeof formData] === value) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // 먼저 사용자 정보가 있는지 확인
      let isExistingUser = false;
      try {
        await http.get("/userDetails/info");
        isExistingUser = true;
      } catch (error) {
        // 사용자 정보가 없으면 새로 생성
        isExistingUser = false;
      }

      // 기존 사용자 정보가 있으면 PUT으로 수정, 없으면 POST로 생성
      if (isExistingUser) {
        await http.put("/userDetails", { json: formData });
      } else {
        await http.post("/userDetails", { json: formData });
      }

      // 온보딩 완료 상태로 설정
      setOnboarded();

      // 회원정보 쿼리 캐시 무효화 (MyPage에서 최신 데이터 가져오기)
      queryClient.invalidateQueries({ queryKey: ["userDetails", "info"] });

      showSuccess("저장 완료", "유저 정보가 저장되었습니다.");
      
      // 저장 후 MyPage로 이동
      setTimeout(() => {
        navigate("/mypage");
      }, 1500);
    } catch (error) {
      console.error("Profile save error:", error);
      handleError(error);
      showError("저장 실패", "프로필 저장 중 오류가 발생했습니다.");
    }
  };

  const renderAllQuestions = () => {
    const questions = [
      {
        id: 1,
        systemMessage: "안녕하세요! 시작하기에 앞서 몇가지 질문이 있어요.",
        userResponse: "나는",
        options: genderOptions,
        field: "gender",
      },
      {
        id: 2,
        systemMessage: "어떤 목표로 공부하시나요?",
        userResponse: "",
        options: goalOptions,
        field: "goal",
      },
      {
        id: 3,
        systemMessage: "당신의 관심사는 무엇인가요?",
        userResponse: "",
        options: interestOptions,
        field: "interests",
      },
      {
        id: 4,
        systemMessage: "지금 교재가 있나요? 있다면 어떤 내용인가요?",
        userResponse: "",
        options: bookOptions,
        field: "books",
      },
    ];

    const messagePadding = isLargeTextMode ? "px-5 py-4" : "px-4 py-3";
    const buttonPadding = isLargeTextMode ? "px-5 py-3" : "px-4 py-2.5";
    const spacing = isLargeTextMode ? "space-y-4" : "space-y-3";
    const gapSize = isLargeTextMode ? "gap-3" : "gap-2.5";

    return (
      <div className={`flex-1 overflow-y-auto ${isLargeTextMode ? "py-5 pb-24" : "py-4 pb-20"} bg-gray-50`}>
        <div className={`px-4 space-y-6 ${isAllQuestionsAnswered() ? "pb-0" : "pb-6"}`}>
          {questions.map((question) => (
            <div key={question.id} className={`${spacing} mb-6`}>
              {/* 시스템 메시지 */}
              <div className="flex justify-start mb-3">
                <div className={`max-w-[75%] ${messagePadding} rounded-2xl bg-gray-100 text-gray-800`}>
                  <p 
                    className="leading-relaxed"
                    style={baseTextStyle}
                  >
                    {question.systemMessage}
                  </p>
                </div>
              </div>

              {/* 사용자 응답 - 첫 번째 질문에서만 표시 */}
              {question.userResponse && (
                <div className="flex justify-end mb-3">
                  <div className={`max-w-[75%] ${messagePadding} rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100`}>
                    <p 
                      className="leading-relaxed"
                      style={baseTextStyle}
                    >
                    {question.userResponse}
                    </p>
                  </div>
                </div>
              )}

              {/* 선택지들 */}
              <div className="flex justify-end w-full mt-4">
                <div className={`flex flex-wrap ${gapSize} max-w-[85%] justify-end`}>
                  {question.options.map((option) => {
                    const isSelected =
                      question.field === "interests" || question.field === "books"
                        ? (
                            formData[
                              question.field as keyof typeof formData
                            ] as string[]
                          ).includes(option.value)
                        : formData[question.field as keyof typeof formData] ===
                          option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleSelect(question.field, option.value, option.label)
                        }
                        className={`${buttonPadding} rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                          isSelected
                            ? "bg-[#00DAAA] text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                        style={baseTextStyle}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* 완료 메시지 */}
          {isAllQuestionsAnswered() && (
            <div className={`${spacing} mb-6`}>
              <div className="flex justify-start mb-3">
                <div className={`max-w-[75%] ${messagePadding} rounded-2xl bg-gray-100 text-gray-800`}>
                  <p 
                    className="leading-relaxed"
                    style={baseTextStyle}
                  >
                    말씀해주신 걸 바탕으로 예문생성을 도와드릴게요!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 저장하기 버튼 */}
        {isAllQuestionsAnswered() && (
          <div className={`bg-gray-50 ${isLargeTextMode ? "pt-6 pb-4" : "pt-4 pb-4"} px-4`}>
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                className={`${isLargeTextMode ? "px-10 py-4" : "px-8 py-3"} bg-[#00DAAA] text-white rounded-full hover:bg-[#00C495] transition-colors font-medium shadow-sm`}
                style={baseTextStyle}
              >
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isAllQuestionsAnswered = () => {
    return (
      formData.gender &&
      formData.goal &&
      formData.interests.length > 0 &&
      formData.books.length > 0
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col max-w-[440px] mx-auto bg-gray-50">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => navigate("/mypage")}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-800" style={headerTextStyle}>프로필 설정</h1>
          </div>
          <div className="w-8"></div>
        </div>

        {/* 로딩 영역 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00DAAA] mx-auto mb-4"></div>
            <p className="text-gray-600" style={baseTextStyle}>프로필 정보를 불러오는 중...</p>
          </div>
        </div>

        {/* Navbar */}
        <NavBar currentPage="MyPage" />
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-72px)] flex flex-col max-w-[440px] mx-auto bg-gray-50 shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => navigate("/mypage")}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>프로필 설정</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* 모든 질문과 답변 영역 */}
      <div className="flex-1 flex flex-col">{renderAllQuestions()}</div>

      {/* Navbar */}
      <NavBar currentPage="MyPage" />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom, setOnboardedAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { API_ENDPOINTS } from "../../config/api";
import NavBar from "../Templates/Navbar";

interface UserProfileEditProps {}

export default function UserProfileEdit({}: UserProfileEditProps) {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [, setOnboarded] = useAtom(setOnboardedAtom);
  const { showSuccess, showError, handleError } = useErrorHandler();

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
        const response = await fetch(`${API_ENDPOINTS.userDetails}/info`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const userInfo = await response.json();
          setFormData({
            gender: userInfo.gender || "",
            goal: userInfo.goal || "",
            interests: userInfo.interests || [],
            books: userInfo.books || [],
          });
        }
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
    { label: "문법부석", value: "grammar" },
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
      const checkResponse = await fetch(`${API_ENDPOINTS.userDetails}/info`, {
        method: "GET",
        credentials: "include",
      });

      let response;
      if (checkResponse.ok) {
        // 기존 사용자 정보가 있으면 PUT으로 수정
        response = await fetch(API_ENDPOINTS.userDetails, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      } else {
        // 기존 사용자 정보가 없으면 POST로 생성
        response = await fetch(API_ENDPOINTS.userDetails, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        // 온보딩 완료 상태로 설정
        setOnboarded();

        showSuccess("저장 완료", "유저 정보가 저장되었습니다.");
        setTimeout(() => {
          navigate("/mypage");
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "프로필 저장에 실패했습니다.");
      }
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

    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-4">
            {/* 시스템 메시지 */}
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
                <p className="text-sm leading-relaxed">
                  {question.systemMessage}
                </p>
              </div>
            </div>

            {/* 사용자 응답 - 첫 번째 질문에서만 표시 */}
            {question.userResponse && (
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm border border-gray-100">
                  <p className="text-sm leading-relaxed">
                    {question.userResponse}
                  </p>
                </div>
              </div>
            )}

            {/* 선택지들 */}
            <div className="flex justify-end">
              <div className="flex flex-wrap gap-2 max-w-[80%]">
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
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-[#00DAAA] text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
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
          <div className="space-y-2">
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-gray-100 text-gray-800">
                <p className="text-sm leading-relaxed">
                  말씀해주신 걸 바탕으로 예문생성을 도와드릴게요!
                </p>
              </div>
            </div>

            {/* 저장하기 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-[#00DAAA] text-white rounded-full hover:bg-[#00C495] transition-colors font-medium shadow-sm"
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
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
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
            <h1 className="text-lg font-semibold text-gray-800">프로필 설정</h1>
          </div>
          <div className="w-8"></div>
        </div>

        {/* 로딩 영역 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00DAAA] mx-auto mb-4"></div>
            <p className="text-gray-600">프로필 정보를 불러오는 중...</p>
          </div>
        </div>

        {/* Navbar */}
        <NavBar currentPage="MyPage" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col max-w-[440px] mx-auto bg-gray-50">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
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
          <h1 className="text-lg font-semibold text-gray-800">프로필 설정</h1>
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

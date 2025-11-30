import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { logoutAtom } from "../../store/authStore";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { userDetailsApi } from "../../entities/user-details/api";
import NavBar from "../Templates/Navbar";

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [, logout] = useAtom(logoutAtom);
  const { showSuccess, showError, handleError } = useErrorHandler();
  const [isAgreed, setIsAgreed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!isAgreed) {
      showError("안내사항 동의 필요", "안내사항에 동의해주세요.");
      return;
    }

    if (isDeleting) return;

    try {
      setIsDeleting(true);
      showSuccess("탈퇴 처리 중", "잠시만 기다려주세요...");

      await userDetailsApi.deleteAccount();

      // 로그아웃 처리
      logout();

      showSuccess("탈퇴 완료", "회원 탈퇴가 완료되었습니다.");

      // 홈으로 이동
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Delete account error:", error);
      handleError(error);
      showError("탈퇴 실패", "회원 탈퇴 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col max-w-[440px] mx-auto bg-[#F5F6FA] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between p-4 bg-white">
        <button
          onClick={handleCancel}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            className="w-6 h-6 text-gray-800"
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
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold text-gray-900">회원탈퇴</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 w-full">

          {/* 섹션 헤더 */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              탈퇴 전 확인하세요
            </h3>
            <div className="h-[1px] bg-gray-300"></div>
          </div>

          {/* 경고 메시지 */}
          <div className="mb-8">
            <p 
              className="text-lg text-gray-700 leading-relaxed"
              style={{
                wordBreak: 'keep-all',
                overflowWrap: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              탈퇴하시면 이용 중인 모든 데이터는 복구가 불가능합니다.
            </p>
          </div>

          {/* 동의 체크박스 */}
          <div className="mb-4">
            <label className="flex items-start cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="w-5 h-5 appearance-none border-2 rounded cursor-pointer transition-colors"
                  style={{
                    borderColor: isAgreed ? '#000000' : '#D1D5DB',
                    backgroundColor: isAgreed ? '#000000' : 'transparent',
                  }}
                />
                {isAgreed && (
                  <svg
                    className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span 
                className="ml-3 text-base text-gray-700 leading-relaxed"
                style={{
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal'
                }}
              >
                안내사항을 모두 확인하였으며, 이에 동의합니다.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 - Navbar 위에 고정 */}
      <div className="p-4 bg-white pb-20">
        <button
          onClick={handleDelete}
          disabled={isDeleting || !isAgreed}
          className={`w-full py-4 text-base font-semibold rounded-xl transition-colors ${
            isAgreed && !isDeleting
              ? "bg-[#00DAAA] hover:bg-[#00C99A] active:bg-[#00B88A] text-white cursor-pointer shadow-sm"
              : "bg-gray-300 cursor-not-allowed text-gray-500"
          }`}
        >
          {isDeleting ? "처리 중..." : "탈퇴하기"}
        </button>
      </div>

      {/* Navbar */}
      <NavBar currentPage="MyPage" />
    </div>
  );
}


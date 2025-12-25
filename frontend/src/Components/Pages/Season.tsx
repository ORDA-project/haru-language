import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { isLargeTextModeAtom } from "../../store/dataStore";
import { isLoggedInAtom, userAtom } from "../../store/authStore";
import { http } from "../../utils/http";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import NavBar from "../Templates/Navbar";
import { ChevronLeft } from "lucide-react";
import { Icons } from "../Elements/Icons";

const SEASON_VISITS = 10;

const Season = () => {
  const navigate = useNavigate();
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [user] = useAtom(userAtom);
  const [isLargeTextMode] = useAtom(isLargeTextModeAtom);
  const { showError } = useErrorHandler();
  const [visitCount, setVisitCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 큰글씨 모드에 따른 텍스트 크기 (중년층용)
  const baseFontSize = isLargeTextMode ? 18 : 16;
  const largeFontSize = isLargeTextMode ? 22 : 20;
  const xLargeFontSize = isLargeTextMode ? 26 : 24;
  const smallFontSize = isLargeTextMode ? 16 : 14;
  const headerFontSize = isLargeTextMode ? 22 : 18;

  const baseTextStyle: React.CSSProperties = {
    fontSize: `${baseFontSize}px`,
    wordBreak: "keep-all",
    overflowWrap: "break-word" as const,
  };
  const largeTextStyle: React.CSSProperties = {
    fontSize: `${largeFontSize}px`,
    wordBreak: "keep-all",
    overflowWrap: "break-word" as const,
  };
  const xLargeTextStyle: React.CSSProperties = {
    fontSize: `${xLargeFontSize}px`,
    wordBreak: "keep-all",
    overflowWrap: "break-word" as const,
  };
  const smallTextStyle: React.CSSProperties = {
    fontSize: `${smallFontSize}px`,
    wordBreak: "keep-all",
    overflowWrap: "break-word" as const,
  };
  const headerTextStyle: React.CSSProperties = {
    fontSize: `${headerFontSize}px`,
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
      return;
    }

    const fetchVisitCount = async () => {
      try {
        const response = await http.get<{
          result: boolean;
          userData: {
            visitCount: number;
          };
        }>("/home");

        if (response && response.userData) {
          setVisitCount(response.userData.visitCount || 0);
        }
      } catch (error: any) {
        if (error.status !== 401) {
          showError("오류 발생", "방문 횟수를 불러오는데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVisitCount();
  }, [isLoggedIn, navigate, showError]);

  const currentSeason = Math.floor((visitCount || 0) / SEASON_VISITS) + 1;
  const progressInSeason = (visitCount || 0) % SEASON_VISITS;
  const completedSeasons = Math.floor((visitCount || 0) / SEASON_VISITS);
  const progressPercentage = (progressInSeason / SEASON_VISITS) * 100;
  const remainingVisits = SEASON_VISITS - progressInSeason;

  // 시즌별 색상 (그라데이션)
  const seasonColors = [
    { from: "#00DAAA", to: "#00C495" }, // 시즌 1
    { from: "#6770F6", to: "#5A63E8" }, // 시즌 2
    { from: "#FF6B9D", to: "#FF5A8A" }, // 시즌 3
    { from: "#FFB84D", to: "#FFA733" }, // 시즌 4
    { from: "#9B59B6", to: "#8E44AD" }, // 시즌 5
  ];

  const currentColor =
    seasonColors[(currentSeason - 1) % seasonColors.length];

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F7F8FB]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00DAAA]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col max-w-[440px] mx-auto bg-[#F7F8FB] shadow-[0_0_10px_0_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button
          onClick={() => navigate("/home")}
          className={`${isLargeTextMode ? "w-10 h-10" : "w-8 h-8"} flex items-center justify-center`}
        >
          <ChevronLeft
            className={`${isLargeTextMode ? "w-6 h-6" : "w-5 h-5"} text-gray-600`}
          />
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-800" style={headerTextStyle}>
            시즌 현황
          </h1>
        </div>
        <div className={isLargeTextMode ? "w-10" : "w-8"}></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 pb-[72px]">
        {/* Current Season Card */}
        <div
          className="rounded-[24px] p-6 mb-6 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${currentColor.from} 0%, ${currentColor.to} 100%)`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Icons.trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white opacity-90" style={smallTextStyle}>
                  현재 시즌
                </div>
                <div className="text-white font-bold" style={xLargeTextStyle}>
                  시즌 {currentSeason}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold" style={largeTextStyle}>
                {progressInSeason}/{SEASON_VISITS}
              </div>
              <div className="text-white opacity-80" style={smallTextStyle}>
                방문 완료
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-4 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-md"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-[20px] p-6 shadow-md mb-6">
          <div className="text-gray-600 mb-4" style={baseTextStyle}>
            통계
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-[16px] p-4">
              <div className="text-gray-500 mb-1" style={smallTextStyle}>
                총 방문 횟수
              </div>
              <div className="text-gray-900 font-bold" style={xLargeTextStyle}>
                {visitCount}회
              </div>
            </div>
            <div className="bg-gray-50 rounded-[16px] p-4">
              <div className="text-gray-500 mb-1" style={smallTextStyle}>
                완료한 시즌
              </div>
              <div className="text-gray-900 font-bold" style={xLargeTextStyle}>
                {completedSeasons}개
              </div>
            </div>
          </div>
        </div>

        {/* Season History */}
        <div className="bg-white rounded-[20px] p-6 shadow-md">
          <div className="text-gray-600 mb-4" style={baseTextStyle}>
            시즌 히스토리
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => {
              const seasonNum = i + 1;
              const seasonStartVisit = (seasonNum - 1) * SEASON_VISITS;
              const seasonEndVisit = seasonNum * SEASON_VISITS;
              const isCompleted = visitCount >= seasonEndVisit;
              const isCurrent = seasonNum === currentSeason;
              const isUpcoming = seasonNum > currentSeason;

              const color =
                seasonColors[(seasonNum - 1) % seasonColors.length];

              return (
                <div
                  key={seasonNum}
                  className={`flex items-center justify-between p-4 rounded-[16px] border-2 ${
                    isCurrent
                      ? "border-[#00DAAA]"
                      : isCompleted
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-100"
                          : isCurrent
                          ? "bg-[#00DAAA]"
                          : "bg-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <span className="text-2xl">✓</span>
                      ) : isCurrent ? (
                        <Icons.trophy className="w-6 h-6 text-white" />
                      ) : (
                        <span
                          className="text-gray-400 font-bold"
                          style={baseTextStyle}
                        >
                          {seasonNum}
                        </span>
                      )}
                    </div>
                    <div>
                      <div
                        className={`font-bold ${
                          isCurrent ? "text-[#00DAAA]" : "text-gray-700"
                        }`}
                        style={largeTextStyle}
                      >
                        시즌 {seasonNum}
                      </div>
                      <div className="text-gray-500" style={smallTextStyle}>
                        {seasonStartVisit}회 ~ {seasonEndVisit}회
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isCompleted ? (
                      <span className="text-green-600 font-semibold" style={baseTextStyle}>
                        완료
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[#00DAAA] font-semibold" style={baseTextStyle}>
                        진행중
                      </span>
                    ) : (
                      <span className="text-gray-400" style={smallTextStyle}>
                        대기중
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NavBar currentPage={"Home"} />
    </div>
  );
};

export default Season;


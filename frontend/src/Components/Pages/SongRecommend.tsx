import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../Templates/Navbar";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { useAtom } from "jotai";
import {
  currentSongAtom,
  isSongLoadingAtom,
  setCurrentSongAtom,
  setSongLoadingAtom,
} from "../../store/dataStore";
import { http, isHttpError } from "../../utils/http";

interface RecommendProps {}

const SongRecommend = (props: RecommendProps) => {
  // 전역 상태 관리
  const [currentSong] = useAtom(currentSongAtom);
  const [isSongLoading] = useAtom(isSongLoadingAtom);
  const [, setCurrentSongData] = useAtom(setCurrentSongAtom);
  const [, setSongLoading] = useAtom(setSongLoadingAtom);

  const navigate = useNavigate();
  const { showError, showWarning, showInfo } = useErrorHandler();

  // 로컬 상태 추가
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string>("");
  const [isYoutubeLoading, setIsYoutubeLoading] = useState<boolean>(false);

  // 전역 상태에서 데이터 가져오기
  const title = currentSong?.title || "로딩 중...";
  const artist = currentSong?.artist || "";
  const lyric = currentSong?.lyric || "가사를 불러오고 있습니다...";

  useEffect(() => {
    const loadSongRecommendation = async () => {
      setSongLoading(true);

      try {
        const timeoutId = setTimeout(() => {
          if (isSongLoading) {
            showInfo(
              "추천 곡 불러오는 중",
              "오늘의 추천 곡을 가져오고 있습니다..."
            );
          }
        }, 3000); // 3초 후 알림

        const response = await http.get<{
          songData?: { Title?: string; Artist?: string; Lyric?: string };
        }>("/songLyric");

        clearTimeout(timeoutId);

        if (!response || !response.songData) {
          throw new Error("서버에서 올바르지 않은 응답을 받았습니다.");
        }

        const { Title, Artist, Lyric } = response.songData;

        if (!Title && !Artist && !Lyric) {
          throw new Error("추천할 곡 데이터가 비어있습니다.");
        }

        // 가사 데이터 처리 - HTML 엔티티 대신 직접 \n 처리
        const lyricData = Lyric
          ? Lyric.replace(/\n/g, "<br/>")
          : "가사 정보가 없습니다.";

        // 전역 상태에 저장
        setCurrentSongData({
          title: Title || "제목 없음",
          artist: Artist || "아티스트 없음",
          lyric: lyricData,
        });
      } catch (error: unknown) {
        console.error("Song recommendation error:", error);

        if (isHttpError(error)) {
          if (error.status === 0) {
            showError("네트워크 오류", "서버에 연결할 수 없습니다.");
          } else if (error.status === 401) {
            showError("로그인이 필요합니다", "다시 로그인 후 시도해주세요.");
          } else if (error.status === 404) {
            showError("추천 곡 없음", "오늘 추천할 곡을 찾을 수 없습니다.");
          } else if (error.status === 500) {
            showError("서버 오류", "서버에서 오류가 발생했습니다.");
          } else {
            const errorData = error.data as { message?: string } | undefined;
            showError(
              "오류 발생",
              errorData?.message ||
                "추천 곡을 불러오는 중 오류가 발생했습니다."
            );
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
          showError(
            "예상치 못한 오류",
            errorMessage
          );
        }

        // 에러 시 기본값 설정
        setCurrentSongData({
          title: "추천 곡을 불러올 수 없습니다",
          artist: "",
          lyric:
            "오늘의 추천 곡을 준비하지 못했습니다.<br/>나중에 다시 시도해주세요.",
        });
      } finally {
        setSongLoading(false);
      }
    };

    loadSongRecommendation();
  }, []); // 빈 의존성 배열로 변경 - 컴포넌트 마운트 시 한 번만 실행

  // 노래 정보가 로드된 후 YouTube 비디오 불러오기
  useEffect(() => {
    if (currentSong?.title && currentSong?.artist && !isSongLoading) {
      loadYoutubeVideo();
    }
  }, [currentSong?.title, currentSong?.artist, isSongLoading]);

  const loadYoutubeVideo = async () => {
    setIsYoutubeLoading(true);

    try {

      const response = await http.get<{
        result?: boolean;
        embedUrl?: string;
      }>("/songYoutube");


      if (response?.result && response.embedUrl) {
        setYoutubeEmbedUrl(response.embedUrl);
      } else {
        console.warn("YouTube video not found or invalid response");
      }
    } catch (error: unknown) {
      console.error("YouTube loading error:", error);

      if (isHttpError(error)) {
        if (error.status === 0) {
          console.warn("YouTube loading timeout or network error");
        } else if (error.status === 400) {
          console.warn("No song data available for YouTube search");
        } else if (error.status === 401) {
          showWarning("로그인이 필요합니다", "다시 로그인 후 시도해주세요.");
        } else if (error.status === 500) {
          console.warn("YouTube API error");
        }
      }

      // YouTube 로딩 실패는 전체 페이지에 영향을 주지 않도록 조용히 처리
      setYoutubeEmbedUrl("");
    } finally {
      setIsYoutubeLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center max-w-[440px] mx-auto shadow-[0_0_10px_0_rgba(0,0,0,0.1)] bg-[#F7F8FB]">
      <div className="h-[calc(100vh-72px)] p-0 px-3 w-full max-w-[440px] box-border mx-auto overflow-y-scroll">
        {/* 뒤로가기 버튼 */}
        <div
          className="py-6"
          onClick={() => {
            navigate("/home");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
          >
            <path
              d="M14.2969 23.4375L5.85938 15L14.2969 6.5625M7.03125 15H24.1406"
              stroke="black"
              strokeWidth="2.8125"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          {/* YouTube container */}
          <div className="w-full mb-4">
            {isYoutubeLoading ? (
              <div className="w-full h-[300px] bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00DAAA] mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">
                    YouTube 비디오 로딩 중...
                  </p>
                </div>
              </div>
            ) : youtubeEmbedUrl ? (
              <div className="w-full h-[300px] rounded-lg overflow-hidden shadow-md">
                <iframe
                  width="100%"
                  height="100%"
                  src={youtubeEmbedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-sm text-center">
                  YouTube 비디오를
                  <br />
                  불러올 수 없습니다
                </p>
              </div>
            )}
          </div>
          <div className="w-full bg-[#00daaa]">
            <div className="p-[10px_20px] text-[22px] font-bold">{title}</div>
            <div className="p-[10px_20px] text-[18px]">{artist}</div>
          </div>
          <div className="whitespace-pre-wrap p-3">
            <div dangerouslySetInnerHTML={{ __html: lyric }} />
          </div>
        </div>
      </div>
      <NavBar currentPage={"Home"} />
    </div>
  );
};

export default SongRecommend;

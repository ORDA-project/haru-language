const express = require("express");
const { User, UserActivity, WritingQuestion } = require("../models");
const { getRandomSong } = require("../services/songService");
const { logError } = require("../middleware/errorHandler");
const { getTodayStringBy4AM, hashDateString } = require("../utils/dateUtils");

const router = express.Router();

/**
 * @openapi
 * /home:
 *   get:
 *     summary: 홈 화면 데이터 조회
 *     description: 로그인한 사용자의 기본 정보, 방문 통계 및 추천 노래를 반환합니다.
 *     tags:
 *       - Home
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 홈 데이터 조회 성공
 *       401:
 *         description: 로그인 필요
 *       404:
 *         description: 사용자 데이터를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/", async (req, res) => {
  try {
    // 보안: 로그인 성공/실패 메시지 처리 (세션에서 가져오기)
    const loginSuccess = req.session.loginSuccess;
    const loginError = req.session.loginError;
    const tempUserName = req.session.tempUserName;
    const tempErrorMessage = req.session.tempErrorMessage;

    // 세션에서 임시 정보 삭제 (한 번만 사용)
    if (loginSuccess !== undefined) {
      delete req.session.loginSuccess;
    }
    if (loginError !== undefined) {
      delete req.session.loginError;
    }
    if (tempUserName) {
      delete req.session.tempUserName;
    }
    if (tempErrorMessage) {
      delete req.session.tempErrorMessage;
    }

    // JWT 기반 인증 사용 (우선)
    const user = req.user;
    
    // 보안: JWT가 없으면 세션 fallback 사용하지 않음 (잘못된 사용자 데이터 방지)
    if (!user || !user.userId) {
      // 세션에 잘못된 사용자 정보가 남아있을 수 있으므로 세션 fallback 제거
      return res.status(401).json({
        result: false,
        message: "로그인이 필요합니다.",
        loginSuccess,
        loginError,
        userName: tempUserName,
        errorMessage: tempErrorMessage,
      });
    }

    // JWT 기반 인증: DB에서 최신 정보 가져오기
    const dbUser = await User.findByPk(user.userId);
    if (!dbUser) {
      return res.status(404).json({
        result: false,
        message: "사용자 데이터를 찾을 수 없습니다.",
      });
    }

    // 방문 기록 업데이트 (새로운 날짜면 자동으로 visit_count 증가)
    const updatedActivity = await UserActivity.updateVisit(user.userId);
    
    // 최신 방문 통계 가져오기
    // visit_count 필드를 명시적으로 선택하여 최신 누적 방문 횟수 가져오기
    const activity = await UserActivity.findOne({ 
      where: { user_id: user.userId },
      attributes: ['visit_count', 'created_at'],
      order: [["created_at", "DESC"]],
    });
    
    // 방문 횟수: 전체 누적 방문 횟수 (최신 레코드의 visit_count가 전체 누적 값)
    const visitCount = activity?.visit_count ?? updatedActivity?.visit_count ?? 0;
    
    
    const mostVisitedDays = await UserActivity.getMostVisitedDays(user.userId);
    const mostVisitedDay = (mostVisitedDays?.mostVisitedDays || []).join(", ") || "데이터 없음";
    
    // 추천 노래 가져오기 (에러 발생 시에도 홈 화면은 정상 표시)
    let songData = null;
    try {
      songData = await getRandomSong(req);
    } catch (songError) {
      // 추천 곡 로딩 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
      logError(songError, { endpoint: "GET /home - getRandomSong" });
      songData = null;
    }

    // 오늘의 한줄 영어 - 오전 4시 기준 날짜 기반 해시로 질문 선택 (같은 날에는 같은 질문)
    const allQuestions = await WritingQuestion.findAll({
      order: [["id", "ASC"]],
    });
    
    let dailyQuestion = null;
    if (allQuestions.length > 0) {
      // 오전 4시 기준으로 오늘 날짜 문자열 가져오기
      const dateString = getTodayStringBy4AM();
      
      // 날짜 문자열을 해시하여 질문 인덱스 결정
      const hash = hashDateString(dateString);
      
      // 해시 값을 양수로 변환하고 질문 개수로 나눈 나머지
      const questionIndex = hash % allQuestions.length;
      dailyQuestion = allQuestions[questionIndex];
    }

    return res.status(200).json({
      result: true,
      userData: {
        userId: dbUser.id,
        name: dbUser.name,
        socialProvider: dbUser.social_provider,
        visitCount, // 전체 누적 방문 횟수
        mostVisitedDay,
        recommendation: songData
          ? `${songData.Title} by ${songData.Artist}`
          : "추천된 노래가 없습니다.",
        dailySentence: dailyQuestion
          ? {
              english: dailyQuestion.question_text,
              korean: dailyQuestion.korean_text,
            }
          : null,
        // 노래 데이터를 응답에 포함 (세션 대신 사용)
        songData: songData ? {
          Title: songData.Title,
          Artist: songData.Artist,
          Lyric: songData.Lyric,
          YouTube: songData.YouTube,
          youtubeLink: songData.youtubeLink || songData.YouTube,
        } : null,
      },
      // 보안: 로그인 성공/실패 정보는 응답 body에만 포함 (URL에 노출 안함)
      loginSuccess,
      loginError,
      userName: tempUserName,
      errorMessage: tempErrorMessage,
    });
  } catch (error) {
    logError(error, { endpoint: "GET /home" });
    return res.status(500).json({
      result: false,
      error: "홈 데이터를 가져오는데 실패했습니다.",
    });
  }
});

module.exports = router;


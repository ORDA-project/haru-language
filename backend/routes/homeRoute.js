const express = require("express");
const { User } = require("../models");

const router = express.Router();

/**
 * @openapi
 * /home:
 *   get:
 *     summary: 홈 화면 데이터 조회
 *     description: 로그인한 사용자의 기본 정보, 방문 통계 및 추천 노래를 반환합니다.
 *     tags:
 *       - Home
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
  const sessionUser = req.session.user;

  if (!sessionUser?.userId) {
    return res.status(401).json({
      result: false,
      message: "로그인이 필요합니다.",
    });
  }

  try {
    const user = await User.findByPk(sessionUser.userId);

    if (!user) {
      return res.status(404).json({
        result: false,
        message: "사용자 데이터를 찾을 수 없습니다.",
      });
    }

    const visitCount = Number(sessionUser.visitCount ?? 0);
    const mostVisitedDay = sessionUser.mostVisitedDays || "데이터 없음";
    const songData = req.session.songData;

    return res.status(200).json({
      result: true,
      userData: {
        userId: user.id,
        name: user.name,
        visitCount,
        mostVisitedDay,
        recommendation: songData
          ? `${songData.Title} by ${songData.Artist}`
          : "추천된 노래가 없습니다.",
      },
    });
  } catch (error) {
    console.error("홈 데이터 가져오기 실패:", error);
    return res.status(500).json({
      result: false,
      error: "홈 데이터를 가져오는데 실패했습니다.",
    });
  }
});

module.exports = router;


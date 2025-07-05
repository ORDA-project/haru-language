const express = require("express");
const { User } = require("../models");
const router = express.Router();


// 로그인한 사용자의 정보, 방문 통계, 추천 노래를 반환
router.get("/", async (req, res) => {
    const sessionUser = req.session.user;
    if (!sessionUser) {
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

        const { visitCount = 1, mostVisitedDays = "데이터 없음" } = sessionUser;
        const songData = req.session.songData;

        return res.status(200).json({
            result: true,
            userData: {
                name: user.name,
                visitCount,
                mostVisitedDay: mostVisitedDays,
                recommendation: songData
                    ? `${songData.Title} by ${songData.Artist}`
                    : "추천할 노래가 없습니다.",
            },
        });
    } catch (error) {
        console.error("홈 데이터 가져오기 실패:", error.message);
        return res.status(500).json({
            result: false,
            error: "홈 데이터를 가져오는 데 실패했습니다.",
        });
    }
});

module.exports = router;

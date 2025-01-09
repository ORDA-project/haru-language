const express = require("express");
const { User, UserActivity } = require("../models");
const { getRandomSong } = require("../services/songService");

const router = express.Router();

router.get("/", async (req, res) => {
    console.log("세션 데이터:", req.session.user);
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "로그인이 필요합니다.",
        });
    }

    try {
        const userId = req.session.user.userId;
        console.log(userId);

        // 사용자 정보 가져오기
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "사용자 데이터를 찾을 수 없습니다.",
            });
        }

        // 사용자 활동 데이터 가져오기
        const [activity] = await UserActivity.findOrCreate({
            where: { user_id: userId },
            defaults: {
                visit_count: 0,
                most_visited_day: null,
            },
        });

        const songData = req.session.songData;

        // 응답 데이터 생성
        res.status(200).json({
            result: true,
            userData: {
                name: user.name,
                visitCount: activity.visit_count,
                mostVisitedDay: activity.most_visited_day,
                recommendation: songData
                    ? `${songData.Title} by ${songData.Artist}`
                    : "추천할 노래가 없습니다.",
            },
        });
    } catch (error) {
        console.error("홈 데이터 가져오기 실패:", error.message);
        res.status(500).json({
            success: false,
            error: "홈 데이터를 가져오는 데 실패했습니다.",
        });
    }
});

module.exports = router;
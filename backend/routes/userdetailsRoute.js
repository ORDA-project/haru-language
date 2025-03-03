const express = require("express");
const router = express.Router();
const { User, UserInterest, UserBook } = require("../models");

// 사용자 정보 조회 (기존 정보 확인)
router.get("/info", async (req, res) => {
    const userId = req.session.user ? req.session.user.userId : null;

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const user = await User.findOne({
            where: { id: userId },
            include: [UserInterest, UserBook]
        });

        if (!user) {
            return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
        }

        res.json({
            gender: user.gender,
            goal: user.goal,
            interests: user.UserInterests.map(i => i.interest),
            books: user.UserBooks.map(b => b.book)
        });
    } catch (error) {
        console.error("사용자 정보 조회 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// 최초 사용자 저장 (최초 입력만 허용)
router.post("/", async (req, res) => {
    const { gender, goal, interests, books } = req.body;
    const userId = req.session.user ? req.session.user.userId : null;

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const existingUser = await User.findOne({ where: { id: userId } });

        if (existingUser) {
            // 이미 정보가 있는 사용자는 새로 저장할 수 없음
            return res.status(400).json({ message: "이미 사용자 정보가 존재합니다." });
        }

        // 새로운 사용자 정보 저장
        await User.create({ id: userId, gender, goal });

        // 관심사 저장
        if (interests && Array.isArray(interests)) {
            await UserInterest.bulkCreate(interests.map(interest => ({ user_id: userId, interest })));
        }

        // 교재 저장
        if (books && Array.isArray(books)) {
            await UserBook.bulkCreate(books.map(book => ({ user_id: userId, book })));
        }

        res.json({ message: "사용자 정보가 성공적으로 저장되었습니다!" });
    } catch (error) {
        console.error("사용자 정보 저장 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// 기존 사용자 정보 수정 (수정 버튼을 눌렀을 때만 실행)
router.put("/", async (req, res) => {
    const { gender, goal, interests, books } = req.body;
    const userId = req.session.user ? req.session.user.userId : null;

    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    try {
        const existingUser = await User.findOne({ where: { id: userId } });

        if (!existingUser) {
            return res.status(404).json({ message: "사용자 정보가 존재하지 않습니다. 먼저 정보를 저장하세요." });
        }

        // 성별 & 목표 업데이트
        await User.update({ gender, goal }, { where: { id: userId } });

        // 관심사 업데이트 (기존 데이터 삭제 후 삽입)
        if (interests && Array.isArray(interests)) {
            await UserInterest.destroy({ where: { user_id: userId } });
            await UserInterest.bulkCreate(interests.map(interest => ({ user_id: userId, interest })));
        }

        // 교재 업데이트 (기존 데이터 삭제 후 삽입)
        if (books && Array.isArray(books)) {
            await UserBook.destroy({ where: { user_id: userId } });
            await UserBook.bulkCreate(books.map(book => ({ user_id: userId, book })));
        }

        res.json({ message: "사용자 정보가 성공적으로 수정되었습니다!" });
    } catch (error) {
        console.error("사용자 정보 수정 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

module.exports = router;

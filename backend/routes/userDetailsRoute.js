const express = require("express");
const router = express.Router();

const { User, UserInterest, UserBook } = require("../models");
const { getSocialIdFromSession } = require("../utils/userUtils");

const GENDERS = new Set(["male", "female", "private"]);
const GOALS = new Set(["hobby", "exam", "business", "travel"]);
const INTERESTS = new Set(["conversation", "reading", "grammar", "business", "vocabulary"]);
const BOOKS = new Set(["none", "travel_conversation", "daily_conversation", "english_novel", "textbook"]);

const sanitizeString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const filterEnumValues = (values, allowedSet) => {
  if (!Array.isArray(values)) {
    return undefined;
  }
  const filtered = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length && allowedSet.has(value));

  return [...new Set(filtered)];
};

const loadUserFromRequest = async (req) => {
  // JWT 기반 인증 사용 (req.user는 authenticateToken 미들웨어에서 설정됨)
  if (req.user && req.user.social_id) {
    return User.findOne({ where: { social_id: req.user.social_id } });
  }

  // Fallback: 세션 기반 (하위 호환성)
  const socialId = getSocialIdFromSession(req);
  if (!socialId) {
    return null;
  }

  return User.findOne({ where: { social_id: socialId } });
};

const withRelations = (user) =>
  user.reload({
    include: [
      { model: UserInterest, attributes: ["interest"] },
      { model: UserBook, attributes: ["book"] },
    ],
  });

const serializeUser = (user) => ({
  id: user.id,
  social_id: user.social_id,
  social_provider: user.social_provider,
  name: user.name,
  email: user.email,
  gender: user.gender,
  goal: user.goal,
  interests: user.UserInterests?.map((interest) => interest.interest) || [],
  books: user.UserBooks?.map((book) => book.book) || [],
});

const handleUpsertUserDetails = async (req, res) => {
  try {
    const user = await loadUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const name = sanitizeString(req.body?.name);
    const email = sanitizeString(req.body?.email);
    const gender = GENDERS.has(req.body?.gender) ? req.body.gender : undefined;
    const goal = GOALS.has(req.body?.goal) ? req.body.goal : undefined;
    const interests = filterEnumValues(req.body?.interests, INTERESTS);
    const books = filterEnumValues(req.body?.books, BOOKS);

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (email !== undefined) updatePayload.email = email;
    if (gender !== undefined) updatePayload.gender = gender;
    if (goal !== undefined) updatePayload.goal = goal;

    if (Object.keys(updatePayload).length) {
      await user.update(updatePayload);
    }

    if (interests !== undefined) {
      await UserInterest.destroy({ where: { user_id: user.id } });
      if (interests.length) {
        await UserInterest.bulkCreate(
          interests.map((interest) => ({
            user_id: user.id,
            interest,
          }))
        );
      }
    }

    if (books !== undefined) {
      await UserBook.destroy({ where: { user_id: user.id } });
      if (books.length) {
        await UserBook.bulkCreate(
          books.map((book) => ({
            user_id: user.id,
            book,
          }))
        );
      }
    }

    const refreshed = await withRelations(user);

    return res.json({
      message: "User details saved successfully",
      data: serializeUser(refreshed),
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

/**
 * @openapi
 * /userDetails/info:
 *   get:
 *     summary: 사용자 상세 정보 조회
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: 사용자 상세 정보 조회 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get("/info", async (req, res) => {
  try {
    const user = await loadUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const detailedUser = await withRelations(user);
    return res.json(serializeUser(detailedUser));
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * @openapi
 * /userDetails:
 *   post:
 *     summary: 사용자 상세 정보 생성
 *     tags:
 *       - User
 *   put:
 *     summary: 사용자 상세 정보 수정
 *     tags:
 *       - User
 */
router.post("/", handleUpsertUserDetails);
router.put("/", handleUpsertUserDetails);

/**
 * @openapi
 * /userDetails/delete:
 *   delete:
 *     summary: 회원 탈퇴
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: 회원 탈퇴 성공
 *       401:
 *         description: 인증되지 않은 요청
 *       500:
 *         description: 서버 오류
 */
router.delete("/delete", async (req, res) => {
  try {
    const user = await loadUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 사용자와 관련된 모든 데이터는 CASCADE로 자동 삭제됨
    // User 모델의 관계 설정에 따라 자동으로 삭제됨
    await user.destroy();

    // 세션 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
    });

    return res.json({
      message: "회원 탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
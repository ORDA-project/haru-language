const express = require("express");
const router = express.Router();
const { User, UserInterest, UserBook } = require("../models");
const { getUserIdBySocialId, getSocialIdFromSession } = require("../utils/userUtils");

/**
 * @openapi
 * /userDetails/info:
 *   get:
 *     summary: Get logged-in user's details (uses social_id from session)
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 social_id:
 *                   type: string
 *                   example: "test123"
 *                 social_provider:
 *                   type: string
 *                   example: "swagger"
 *                 name:
 *                   type: string
 *                   example: "홍길동"
 *                 email:
 *                   type: string
 *                   example: "hong@test.com"
 *                 gender:
 *                   type: string
 *                   enum: [male, female, private]
 *                   example: "private"
 *                 goal:
 *                   type: string
 *                   enum: [hobby, exam, business, travel]
 *                   example: "hobby"
 *                 interests:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["conversation", "reading"]
 *                 books:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["daily_conversation"]
 *       401:
 *         description: Unauthorized (not logged in)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/info", async (req, res) => {
    try {
      const socialId = getSocialIdFromSession(req);
      if (!socialId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
  
      const user = await User.findOne({
        where: { social_id: socialId },
        include: [
          { model: UserInterest, attributes: ['interest'] },
          { model: UserBook, attributes: ['book'] }
        ]
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.json({
        id: user.id,
        social_id: user.social_id,
        social_provider: user.social_provider,
        name: user.name,
        email: user.email,
        gender: user.gender,
        goal: user.goal,
        interests: user.UserInterests?.map(ui => ui.interest) || [],
        books: user.UserBooks?.map(ub => ub.book) || []
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

/**
 * @openapi
 * /userDetails:
 *   post:
 *     summary: Create/Update user details with interests and books
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "홍길동"
 *               email:
 *                 type: string
 *                 example: "hong@test.com"
 *               gender:
 *                 type: string
 *                 enum: [male, female, private]
 *                 example: "private"
 *               goal:
 *                 type: string
 *                 enum: [hobby, exam, business, travel]
 *                 example: "hobby"
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [conversation, reading, grammar, business, vocabulary]
 *                 example: ["conversation", "reading"]
 *               books:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [none, travel_conversation, daily_conversation, english_novel, textbook]
 *                 example: ["daily_conversation"]
 *     responses:
 *       200:
 *         description: User details created successfully
 *       401:
 *         description: Unauthorized (not logged in)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
    try {
      const socialId = getSocialIdFromSession(req);
      if (!socialId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
  
      const user = await User.findOne({
        where: { social_id: socialId }
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { interests, books, ...userFields } = req.body;

      // User 기본 정보 업데이트
      await user.update(userFields);

      // UserInterest 처리
      if (interests && Array.isArray(interests)) {
        // 기존 관심사 삭제
        await UserInterest.destroy({ where: { user_id: user.id } });
        
        // 새로운 관심사 추가
        if (interests.length > 0) {
          const interestRecords = interests.map(interest => ({
            user_id: user.id,
            interest: interest
          }));
          await UserInterest.bulkCreate(interestRecords);
        }
      }

      // UserBook 처리
      if (books && Array.isArray(books)) {
        // 기존 책 삭제
        await UserBook.destroy({ where: { user_id: user.id } });
        
        // 새로운 책 추가
        if (books.length > 0) {
          const bookRecords = books.map(book => ({
            user_id: user.id,
            book: book
          }));
          await UserBook.bulkCreate(bookRecords);
        }
      }
  
      res.json({
        message: "User details created successfully",
        data: {
          ...user.toJSON(),
          interests: interests || [],
          books: books || []
        }
      });
    } catch (error) {
      console.error("Error updating user details:", error);
      res.status(500).json({ message: error.message });
    }
  });

/**
 * @openapi
 * /userDetails:
 *   put:
 *     summary: Update user details (same as POST)
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "홍길동"
 *               email:
 *                 type: string
 *                 example: "hong@test.com"
 *               gender:
 *                 type: string
 *                 enum: [male, female, private]
 *                 example: "private"
 *               goal:
 *                 type: string
 *                 enum: [hobby, exam, business, travel]
 *                 example: "hobby"
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["conversation", "reading"]
 *               books:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["daily_conversation"]
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       401:
 *         description: Unauthorized (not logged in)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/", async (req, res) => {
    try {
      const socialId = getSocialIdFromSession(req);
      if (!socialId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
  
      const user = await User.findOne({
        where: { social_id: socialId }
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { interests, books, ...userFields } = req.body;

      // User 기본 정보 업데이트
      await user.update(userFields);

      // UserInterest 처리
      if (interests && Array.isArray(interests)) {
        await UserInterest.destroy({ where: { user_id: user.id } });
        
        if (interests.length > 0) {
          const interestRecords = interests.map(interest => ({
            user_id: user.id,
            interest: interest
          }));
          await UserInterest.bulkCreate(interestRecords);
        }
      }

      // UserBook 처리
      if (books && Array.isArray(books)) {
        await UserBook.destroy({ where: { user_id: user.id } });
        
        if (books.length > 0) {
          const bookRecords = books.map(book => ({
            user_id: user.id,
            book: book
          }));
          await UserBook.bulkCreate(bookRecords);
        }
      }
  
      res.json({
        message: "User details updated successfully",
        data: {
          ...user.toJSON(),
          interests: interests || [],
          books: books || []
        }
      });
    } catch (error) {
      console.error("Error updating user details:", error);
      res.status(500).json({ message: error.message });
    }
  });

module.exports = router;
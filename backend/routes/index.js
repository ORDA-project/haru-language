const express = require("express");
const router = express.Router();

// 모듈별 라우트 연결
router.use("/auth", require("./socialLoginRoute"));         // 소셜 로그인
router.use("/home", require("./homeRoute"));                // 홈화면 관련
router.use("/userDetails", require("./userDetailsRoute"));  // 유저 상세 정보
router.use("/friends", require("./friendRoute"));           // 친구 기능
router.use("/songLyric", require("./songLyricRoute"));      // 가사 제공
router.use("/songYoutube", require("./songYoutubeRoute"));  // 유튜브 영상 링크
router.use("/api", require("./ttsRoute"));                  // TTS 기능
router.use("/example", require("./exampleRoute"));          // 예제 API
router.use("/question", require("./questionRoute"));        // 질문 기능
router.use("/writing", require("./writingRoute"));          // 작문 기능

module.exports = router;
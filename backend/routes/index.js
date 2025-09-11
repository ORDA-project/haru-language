const express = require("express");
const router = express.Router();

// 紐⑤뱢蹂??쇱슦???곌껐
router.use("/auth", require("./socialLoginRoute"));         // ?뚯뀥 濡쒓렇??
router.use("/home", require("./homeRoute"));                // ?덊솕硫?愿??
router.use("/userDetails", require("./userDetailsRoute"));  // ?좎? ?곸꽭 ?뺣낫
router.use("/friends", require("./friendRoute"));           // 移쒓뎄 湲곕뒫
router.use("/songLyric", require("./songLyricRoute"));      // 媛???쒓났
router.use("/songYoutube", require("./songYoutubeRoute"));  // ?좏뒠釉??곸긽 留곹겕
router.use("/api", require("./ttsRoute"));                  // TTS 湲곕뒫
router.use("/example", require("./exampleRoute"));          // ?덉젣 API
router.use("/question", require("./questionRoute"));        // 吏덈Ц 湲곕뒫
router.use("/writing", require("./writingRoute"));          // ?묐Ц 湲곕뒫
router.use("/swagger-test-login", require("./swaggerTestRoute")); // (媛쒕컻) swagger ?꾪븳 ?뚯뒪??濡쒓렇??

module.exports = router;

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Stage,
  TopContainer,
  BottomContainer,
  Logo,
  Title,
  Subtitle,
  LoginButton,
  KakaoLoginButton,
  GoogleLogo,
  KakaoLogo,
} from "../../Styles/Startlogin";
import googlelogo from "../../Images/google_logo.png";
import logo from "../../Images/LogoImg.png"; // 로고 이미지
import kakaologo from "../../Images/kakaologo.png"; // 카카오 로고 이미지 추가

const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Google OAuth 엔드포인트로 리다이렉트
    window.location.href = "http://localhost:8000/auth/google";
  };

  const handleKakaoLogin = () => {
    // Kakao OAuth 엔드포인트로 리다이렉트
    window.location.href = "http://localhost:8000/auth/kakao";
  };

  const handleExplore = () => {
    // introduction 페이지로 이동
    navigate("/introduction");
  };

  return (
    <Stage>
      {/* 위쪽: 로고와 제목 */}
      <TopContainer>
        <Logo src={logo} alt="로고 이미지" />
        <Title>하루 언어</Title>
      </TopContainer>

      {/* 아래쪽: 둘러보기와 로그인 버튼 */}
      <BottomContainer>
        <Subtitle onClick={handleExplore}>둘러보기</Subtitle>

        <LoginButton onClick={handleGoogleLogin}>
          <GoogleLogo src={googlelogo} alt="구글 로고" />
          구글로 연결하기
        </LoginButton>

        <KakaoLoginButton onClick={handleKakaoLogin}>
          <KakaoLogo src={kakaologo} alt="카카오 로고" />
          카카오로 연결하기
        </KakaoLoginButton>
      </BottomContainer>
    </Stage>
  );
};

export default Login;

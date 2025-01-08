import React from "react";
import {
  Stage,
  Logo,
  Title,
  Subtitle,
  LoginButton,
  GoogleLogo,
} from "../../Styles/Startlogin";
import googlelogo from "../../Images/google_logo.png";




const Login: React.FC = () => {
  const handleGoogleLogin = () => {
    // 서버의 Google OAuth 엔드포인트로 리다이렉트
    window.location.href = "http://localhost:8000/auth/google";
  };
  

  return (
    <Stage>
      <Logo>로고 이미지</Logo>
      <Title>하루 언어</Title>
      <Subtitle>둘러보기</Subtitle>
      <LoginButton onClick={handleGoogleLogin}>
        <GoogleLogo src={googlelogo} alt="구글 로고" />
        구글로 연결하기
      </LoginButton>
    </Stage>
  );
};

export default Login;

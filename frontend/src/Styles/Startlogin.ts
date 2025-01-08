import styled from "styled-components";

// 컨테이너 스타일
export const Stage = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: "KoPubWorldDotum_Pro", sans-serif;
  background-color: #f6f6f6;
`;

// 로고 자리 스타일
export const Logo = styled.div`
  width: 100px;
  height: 100px;
  background-color: #00daaa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 16px;
  color: white;
  font-weight: bold;
`;

// 제목 스타일
export const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #000;
  margin-bottom: 10px;
`;

// 둘러보기 텍스트 스타일
export const Subtitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 20px;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: #333;
  }
`;

// 구글 로그인 버튼 스타일
export const LoginButton = styled.button`
  width: 300px;
  height: 50px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #000;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #f0f0f0;
  }
`;

// 구글 로고 스타일
export const GoogleLogo = styled.img`
  width: 20px;
  height: 20px;
`;
